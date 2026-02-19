-- ============================================================================
-- Analytics Views + Time Tracking Fields
-- ============================================================================
-- Creates the missing sprint_capacity_summary and project_velocity_summary
-- views required by analytics_service.py and sprint_service.py.
-- Also adds estimated_hours and actual_hours to archon_tasks.
-- ============================================================================

-- Step 1: Create sprint_capacity_summary view
-- Aggregates task metrics per sprint for capacity tracking
DROP VIEW IF EXISTS sprint_capacity_summary CASCADE;
CREATE VIEW sprint_capacity_summary AS
SELECT
    s.id AS sprint_id,
    s.project_id,
    s.name AS sprint_name,
    s.status AS sprint_status,
    s.capacity_hours,
    s.start_date,
    s.end_date,
    COUNT(t.id)                                               AS total_tasks,
    COALESCE(SUM(t.story_points), 0)                         AS total_story_points,
    COUNT(t.id) FILTER (WHERE t.status = 'done')             AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'doing')            AS active_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('backlog','todo')) AS pending_tasks,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0) AS completed_story_points
FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = FALSE
GROUP BY s.id, s.project_id, s.name, s.status, s.capacity_hours, s.start_date, s.end_date;

GRANT SELECT ON sprint_capacity_summary TO anon, authenticated, service_role;

-- Step 2: Create project_velocity_summary view
-- Aggregates completed sprint velocity per project
DROP VIEW IF EXISTS project_velocity_summary CASCADE;
CREATE VIEW project_velocity_summary AS
SELECT
    s.project_id,
    COUNT(DISTINCT s.id)                         AS total_sprints_completed,
    COALESCE(AVG(vh.velocity_points), 0)         AS avg_velocity_points,
    COALESCE(MAX(vh.velocity_points), 0)         AS max_velocity_points,
    COALESCE(MIN(vh.velocity_points), 0)         AS min_velocity_points,
    COALESCE(SUM(vh.velocity_points), 0)         AS total_points_delivered
FROM archon_sprints s
LEFT JOIN archon_velocity_history vh ON vh.sprint_id = s.id
WHERE s.status = 'completed'
GROUP BY s.project_id;

GRANT SELECT ON project_velocity_summary TO anon, authenticated, service_role;

-- Step 3: Add time tracking fields to archon_tasks
ALTER TABLE archon_tasks
    ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6, 2),
    ADD COLUMN IF NOT EXISTS actual_hours    NUMERIC(6, 2);

-- Step 4: Create archon_task_comments table if it doesn't exist
-- (used by comments_api.py)
CREATE TABLE IF NOT EXISTS archon_task_comments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id      UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    mentions     UUID[] DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON archon_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON archon_task_comments(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON archon_task_comments TO anon, authenticated, service_role;

-- Step 5: Create archon_task_status_history table if it doesn't exist
-- (used by comments_api.py status-history endpoint and analytics)
CREATE TABLE IF NOT EXISTS archon_task_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    from_status TEXT,
    to_status   TEXT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON archon_task_status_history(task_id);

GRANT SELECT, INSERT ON archon_task_status_history TO anon, authenticated, service_role;

-- Step 6: Track this migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', 'analytics_views_time_tracking')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration 030 applied successfully!';
    RAISE NOTICE '  VIEW sprint_capacity_summary    -> created';
    RAISE NOTICE '  VIEW project_velocity_summary   -> created';
    RAISE NOTICE '  archon_tasks.estimated_hours    -> added';
    RAISE NOTICE '  archon_tasks.actual_hours       -> added';
    RAISE NOTICE '  archon_task_comments            -> created (if not existed)';
    RAISE NOTICE '  archon_task_status_history      -> created (if not existed)';
    RAISE NOTICE '============================================';
END $$;
