-- ============================================================================
-- Phase 7: Advanced Analytics
-- Version: 0.1.0
-- Description: Analytics tables for charts, metrics, and dashboards
-- ============================================================================

-- ── Sprint Burndown Snapshots ───────────────────────────────────
-- Daily snapshots of sprint progress for burndown charts
CREATE TABLE IF NOT EXISTS archon_sprint_burndown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,

    -- Snapshot date
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Remaining work
    remaining_story_points INTEGER NOT NULL DEFAULT 0,
    remaining_tasks INTEGER NOT NULL DEFAULT 0,

    -- Completed today
    completed_today_points INTEGER DEFAULT 0,
    completed_today_tasks INTEGER DEFAULT 0,

    -- Sprint scope (for tracking scope creep)
    total_scope_points INTEGER NOT NULL DEFAULT 0,
    total_scope_tasks INTEGER NOT NULL DEFAULT 0,

    -- Ideal remaining (for ideal burndown line)
    ideal_remaining_points DECIMAL(6,2),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(sprint_id, snapshot_date)
);

-- ── Team Velocity History ───────────────────────────────────────
-- Historical velocity data for trend analysis
CREATE TABLE IF NOT EXISTS archon_velocity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,

    -- Sprint info
    sprint_name TEXT NOT NULL,
    sprint_start_date TIMESTAMPTZ,
    sprint_end_date TIMESTAMPTZ,

    -- Planned vs Actual
    planned_story_points INTEGER DEFAULT 0,
    completed_story_points INTEGER DEFAULT 0,
    planned_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,

    -- Velocity metrics
    velocity_points DECIMAL(6,2),  -- Story points completed
    velocity_tasks DECIMAL(6,2),   -- Tasks completed
    completion_rate DECIMAL(5,2),  -- Percentage completed

    -- Sprint outcomes
    sprint_status TEXT CHECK (sprint_status IN ('completed', 'cancelled')),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(project_id, sprint_id)
);

-- ── Team Member Performance ─────────────────────────────────────
-- Individual contributor metrics per sprint
CREATE TABLE IF NOT EXISTS archon_member_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,

    -- Tasks completed
    tasks_completed INTEGER DEFAULT 0,
    story_points_completed INTEGER DEFAULT 0,

    -- Quality metrics
    tasks_first_time_right INTEGER DEFAULT 0,  -- No rework needed
    tasks_required_rework INTEGER DEFAULT 0,

    -- Time metrics
    avg_task_duration_hours DECIMAL(6,2),
    total_active_hours DECIMAL(8,2),

    -- Collaboration
    tasks_reviewed INTEGER DEFAULT 0,  -- As reviewer
    helpful_reviews INTEGER DEFAULT 0,  -- Reviews marked as helpful

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(user_id, project_id, sprint_id)
);

-- ── Daily Metrics Snapshot ──────────────────────────────────────
-- Daily aggregate metrics for trend analysis
CREATE TABLE IF NOT EXISTS archon_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,

    metric_date DATE NOT NULL,

    -- Task metrics
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,

    -- Story points
    story_points_added INTEGER DEFAULT 0,
    story_points_completed INTEGER DEFAULT 0,

    -- Active users
    active_users INTEGER DEFAULT 0,
    active_contributors TEXT[],  -- Array of user IDs

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(project_id, metric_date)
);

-- ── Analytics Views ─────────────────────────────────────────────

-- Current Sprint Burndown (real-time)
CREATE OR REPLACE VIEW current_sprint_burndown AS
SELECT
    s.id as sprint_id,
    s.project_id,
    s.name as sprint_name,
    s.start_date,
    s.end_date,
    s.capacity_hours,

    -- Current state
    COUNT(t.id) FILTER (WHERE t.status != 'done') as remaining_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status != 'done'), 0) as remaining_points,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0) as completed_points,

    -- Total scope
    COUNT(t.id) as total_tasks,
    COALESCE(SUM(t.story_points), 0) as total_points,

    -- Progress percentage
    CASE
        WHEN COUNT(t.id) > 0 THEN
            ROUND((COUNT(t.id) FILTER (WHERE t.status = 'done')::DECIMAL / COUNT(t.id)) * 100, 2)
        ELSE 0
    END as progress_percentage

FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = false
WHERE s.status = 'active'
GROUP BY s.id, s.project_id, s.name, s.start_date, s.end_date, s.capacity_hours;

-- Project Velocity Summary
CREATE OR REPLACE VIEW project_velocity_summary AS
SELECT
    p.id as project_id,
    p.title as project_name,

    -- Velocity metrics
    COUNT(DISTINCT vh.sprint_id) as sprints_completed,
    ROUND(AVG(vh.velocity_points), 2) as avg_velocity_points,
    ROUND(AVG(vh.completion_rate), 2) as avg_completion_rate,

    -- Recent trend (last 3 sprints)
    ROUND(AVG(vh.velocity_points) FILTER (
        WHERE vh.created_at >= NOW() - INTERVAL '90 days'
    ), 2) as recent_velocity_points

FROM archon_projects p
LEFT JOIN archon_velocity_history vh ON vh.project_id = p.id
GROUP BY p.id, p.title;

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_burndown_sprint ON archon_sprint_burndown(sprint_id);
CREATE INDEX IF NOT EXISTS idx_burndown_date ON archon_sprint_burndown(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_velocity_history_project ON archon_velocity_history(project_id);
CREATE INDEX IF NOT EXISTS idx_velocity_history_sprint ON archon_velocity_history(sprint_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_user ON archon_member_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_sprint ON archon_member_performance(sprint_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_project ON archon_daily_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON archon_daily_metrics(metric_date);

-- ── Auto-update timestamp triggers ─────────────────────────────
CREATE TRIGGER update_member_performance_updated_at
    BEFORE UPDATE ON archon_member_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_sprint_burndown ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_velocity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_member_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to burndown" ON archon_sprint_burndown;
CREATE POLICY "Service role full access to burndown"
    ON archon_sprint_burndown FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to velocity history" ON archon_velocity_history;
CREATE POLICY "Service role full access to velocity history"
    ON archon_velocity_history FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to member performance" ON archon_member_performance;
CREATE POLICY "Service role full access to member performance"
    ON archon_member_performance FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to daily metrics" ON archon_daily_metrics;
CREATE POLICY "Service role full access to daily metrics"
    ON archon_daily_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '020_phase7_analytics')
ON CONFLICT DO NOTHING;
