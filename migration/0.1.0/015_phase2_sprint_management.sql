-- ============================================================================
-- Phase 2: Sprint Management
-- Version: 0.1.0
-- Description: Adds sprint management tables and links tasks to sprints
-- ============================================================================

-- ── Sprint Status Enum ──────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Sprints Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_sprints (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    goal        TEXT DEFAULT '',
    status      sprint_status NOT NULL DEFAULT 'planning',
    start_date  TIMESTAMPTZ,
    end_date    TIMESTAMPTZ,
    capacity_hours INTEGER DEFAULT 0,
    created_by  TEXT DEFAULT 'User',
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_sprint_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

-- ── Add sprint_id to tasks (if not exists) ──────────────────────
DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN sprint_id UUID REFERENCES archon_sprints(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON archon_sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON archon_sprints(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON archon_tasks(sprint_id);

-- ── Auto-update timestamp trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION update_sprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sprint_updated_at ON archon_sprints;
CREATE TRIGGER update_sprint_updated_at
    BEFORE UPDATE ON archon_sprints
    FOR EACH ROW
    EXECUTE FUNCTION update_sprint_timestamp();

-- ── Sprint capacity view ────────────────────────────────────────
-- Calculates how much of a sprint's capacity is used by assigned tasks
CREATE OR REPLACE VIEW sprint_capacity_summary AS
SELECT
    s.id AS sprint_id,
    s.project_id,
    s.name AS sprint_name,
    s.status AS sprint_status,
    s.capacity_hours,
    COALESCE(SUM(t.story_points), 0) AS total_story_points,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'doing') AS active_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('backlog', 'todo')) AS pending_tasks
FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = false
GROUP BY s.id, s.project_id, s.name, s.status, s.capacity_hours;

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_sprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to sprints" ON archon_sprints;
CREATE POLICY "Service role full access to sprints"
    ON archon_sprints FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '015_phase2_sprint_management')
ON CONFLICT DO NOTHING;
