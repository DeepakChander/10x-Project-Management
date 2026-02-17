-- ============================================================================
-- Analytics Auto-Triggers
-- Version: 0.1.0
-- Description: Auto-create analytics data when sprints start/complete
-- ============================================================================

-- ── Create Burndown Snapshot When Sprint Starts ────────────────
CREATE OR REPLACE FUNCTION create_burndown_snapshot_on_sprint_start()
RETURNS TRIGGER AS $$
BEGIN
    -- When sprint changes to 'active', create initial burndown snapshot
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        INSERT INTO archon_sprint_burndown (
            sprint_id,
            project_id,
            snapshot_date,
            remaining_story_points,
            remaining_tasks,
            total_scope_points,
            total_scope_tasks
        )
        SELECT
            NEW.id,
            NEW.project_id,
            CURRENT_DATE,
            COALESCE(SUM(t.story_points) FILTER (WHERE t.status != 'done'), 0),
            COUNT(t.id) FILTER (WHERE t.status != 'done'),
            COALESCE(SUM(t.story_points), 0),
            COUNT(t.id)
        FROM archon_tasks t
        WHERE t.sprint_id = NEW.id
        AND t.archived = false
        ON CONFLICT (sprint_id, snapshot_date) DO UPDATE
        SET
            remaining_story_points = EXCLUDED.remaining_story_points,
            remaining_tasks = EXCLUDED.remaining_tasks,
            total_scope_points = EXCLUDED.total_scope_points,
            total_scope_tasks = EXCLUDED.total_scope_tasks;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_burndown_on_sprint_start ON archon_sprints;
CREATE TRIGGER trigger_create_burndown_on_sprint_start
    AFTER INSERT OR UPDATE OF status ON archon_sprints
    FOR EACH ROW
    EXECUTE FUNCTION create_burndown_snapshot_on_sprint_start();

-- ── Record Velocity When Sprint Completes ──────────────────────
CREATE OR REPLACE FUNCTION record_velocity_on_sprint_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_completed_points INTEGER;
    v_completed_tasks INTEGER;
    v_total_points INTEGER;
    v_total_tasks INTEGER;
    v_completion_rate DECIMAL(5,2);
BEGIN
    -- When sprint changes to 'completed', record velocity
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get sprint metrics
        SELECT
            COALESCE(SUM(story_points) FILTER (WHERE status = 'done'), 0),
            COUNT(*) FILTER (WHERE status = 'done'),
            COALESCE(SUM(story_points), 0),
            COUNT(*)
        INTO
            v_completed_points,
            v_completed_tasks,
            v_total_points,
            v_total_tasks
        FROM archon_tasks
        WHERE sprint_id = NEW.id
        AND archived = false;

        -- Calculate completion rate
        v_completion_rate := CASE
            WHEN v_total_tasks > 0 THEN (v_completed_tasks::DECIMAL / v_total_tasks) * 100
            ELSE 0
        END;

        -- Insert into velocity history
        INSERT INTO archon_velocity_history (
            project_id,
            sprint_id,
            sprint_name,
            sprint_start_date,
            sprint_end_date,
            planned_story_points,
            completed_story_points,
            planned_tasks,
            completed_tasks,
            velocity_points,
            velocity_tasks,
            completion_rate,
            sprint_status
        )
        VALUES (
            NEW.project_id,
            NEW.id,
            NEW.name,
            NEW.start_date,
            NEW.end_date,
            v_total_points,
            v_completed_points,
            v_total_tasks,
            v_completed_tasks,
            v_completed_points,
            v_completed_tasks,
            v_completion_rate,
            'completed'
        )
        ON CONFLICT (project_id, sprint_id) DO UPDATE
        SET
            completed_story_points = EXCLUDED.completed_story_points,
            completed_tasks = EXCLUDED.completed_tasks,
            velocity_points = EXCLUDED.velocity_points,
            velocity_tasks = EXCLUDED.velocity_tasks,
            completion_rate = EXCLUDED.completion_rate;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_velocity_on_sprint_complete ON archon_sprints;
CREATE TRIGGER trigger_record_velocity_on_sprint_complete
    AFTER UPDATE OF status ON archon_sprints
    FOR EACH ROW
    EXECUTE FUNCTION record_velocity_on_sprint_complete();

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '021_analytics_triggers')
ON CONFLICT DO NOTHING;
