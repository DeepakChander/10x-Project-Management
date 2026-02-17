-- ============================================================================
-- Enhanced Analytics - Time Tracking & Predictions
-- Version: 0.1.0
-- Description: Comprehensive analytics with time tracking and predictions
-- ============================================================================

-- ── Task Time Tracking ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_task_time_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE SET NULL,

    -- Estimates (from AI or manual)
    estimated_hours DECIMAL(6,2),
    estimated_story_points INTEGER,

    -- Actuals
    actual_hours DECIMAL(6,2),
    actual_story_points INTEGER,

    -- Time tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_in_doing INTERVAL,  -- Time spent in 'doing' status
    time_in_review INTERVAL, -- Time spent in 'review' status

    -- Deadline tracking
    due_date TIMESTAMPTZ,
    completed_on_time BOOLEAN,
    days_early_or_late INTEGER,  -- Negative = early, positive = late

    -- Accuracy metrics
    estimation_accuracy DECIMAL(5,2),  -- Percentage (100% = perfect)

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(task_id)
);

-- ── Sprint Timeline Tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_sprint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,

    -- Planned timeline
    planned_start TIMESTAMPTZ,
    planned_end TIMESTAMPTZ,
    planned_duration_days INTEGER,

    -- Actual timeline
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    actual_duration_days INTEGER,

    -- Progress tracking
    days_elapsed INTEGER,
    days_remaining INTEGER,
    progress_percentage DECIMAL(5,2),

    -- Predictions (AI-powered)
    predicted_completion_date TIMESTAMPTZ,
    predicted_days_early_or_late INTEGER,
    prediction_confidence DECIMAL(3,2),

    -- Risk assessment
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB DEFAULT '[]',  -- Array of risk descriptions

    -- Velocity tracking
    current_velocity DECIMAL(6,2),  -- Points per day
    required_velocity DECIMAL(6,2),  -- To finish on time

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(sprint_id)
);

-- ── Daily Progress Snapshots ────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_daily_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,

    -- Work completed today
    tasks_completed_today INTEGER DEFAULT 0,
    story_points_completed_today INTEGER DEFAULT 0,

    -- Cumulative totals
    cumulative_tasks_completed INTEGER DEFAULT 0,
    cumulative_story_points_completed INTEGER DEFAULT 0,

    -- Team metrics
    active_contributors INTEGER DEFAULT 0,
    avg_task_completion_time_hours DECIMAL(6,2),

    -- Trend indicators
    velocity_today DECIMAL(6,2),  -- Points completed today
    velocity_trend TEXT CHECK (velocity_trend IN ('up', 'stable', 'down')),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(project_id, sprint_id, snapshot_date)
);

-- ── Comprehensive Analytics View ────────────────────────────────
CREATE OR REPLACE VIEW sprint_health_dashboard AS
SELECT
    s.id as sprint_id,
    s.project_id,
    s.name as sprint_name,
    s.status,
    s.start_date,
    s.end_date,
    s.capacity_hours,

    -- Task progress
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('doing', 'review')) as active_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('backlog', 'todo')) as pending_tasks,

    -- Story points
    COALESCE(SUM(t.story_points), 0) as total_story_points,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0) as completed_story_points,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status != 'done'), 0) as remaining_story_points,

    -- Progress percentage
    CASE
        WHEN COUNT(t.id) > 0 THEN
            ROUND((COUNT(t.id) FILTER (WHERE t.status = 'done')::DECIMAL / COUNT(t.id)) * 100, 2)
        ELSE 0
    END as task_completion_percentage,

    CASE
        WHEN COALESCE(SUM(t.story_points), 0) > 0 THEN
            ROUND((COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0)::DECIMAL /
                   COALESCE(SUM(t.story_points), 1)) * 100, 2)
        ELSE 0
    END as story_point_completion_percentage,

    -- Time tracking
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.start_date)) / 86400 as days_elapsed,
    EXTRACT(EPOCH FROM (s.end_date - CURRENT_TIMESTAMP)) / 86400 as days_remaining,

    -- Capacity utilization
    ROUND((COALESCE(SUM(t.story_points), 0)::DECIMAL / NULLIF(s.capacity_hours, 0)) * 100, 2) as capacity_utilization_percentage,

    -- On-time status
    CASE
        WHEN s.status = 'active' AND s.end_date IS NOT NULL THEN
            CASE
                WHEN CURRENT_TIMESTAMP > s.end_date THEN 'overdue'
                WHEN EXTRACT(EPOCH FROM (s.end_date - CURRENT_TIMESTAMP)) / 86400 < 2 THEN 'at_risk'
                ELSE 'on_track'
            END
        ELSE 'not_applicable'
    END as timeline_status

FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = false
GROUP BY s.id, s.project_id, s.name, s.status, s.start_date, s.end_date, s.capacity_hours;

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_task_time_tracking_task ON archon_task_time_tracking(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_tracking_sprint ON archon_task_time_tracking(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_timeline_sprint ON archon_sprint_timeline(sprint_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON archon_daily_progress(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_sprint ON archon_daily_progress(sprint_id);

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_task_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_sprint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_daily_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to task time tracking" ON archon_task_time_tracking;
CREATE POLICY "Service role full access to task time tracking"
    ON archon_task_time_tracking FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to sprint timeline" ON archon_sprint_timeline;
CREATE POLICY "Service role full access to sprint timeline"
    ON archon_sprint_timeline FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to daily progress" ON archon_daily_progress;
CREATE POLICY "Service role full access to daily progress"
    ON archon_daily_progress FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '022_enhanced_analytics')
ON CONFLICT DO NOTHING;
