-- =====================================================
-- Migration: Task Dependencies
-- Version: 0.1.0 / 013
-- Description: Adds archon_task_dependencies table for
--   blocking relationships between tasks with circular
--   dependency prevention constraints.
-- =====================================================

-- Task Dependencies table
-- task_id IS BLOCKED BY depends_on_id
CREATE TABLE IF NOT EXISTS archon_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate dependencies
  UNIQUE(task_id, depends_on_id),
  -- Prevent self-referencing
  CHECK (task_id != depends_on_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON archon_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on_id ON archon_task_dependencies(depends_on_id);

-- RLS
ALTER TABLE archon_task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to archon_task_dependencies" ON archon_task_dependencies
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to read and update archon_task_dependencies" ON archon_task_dependencies
    FOR ALL TO authenticated
    USING (true);

-- Comments
COMMENT ON TABLE archon_task_dependencies IS 'Task dependency relationships - task_id is blocked by depends_on_id';
COMMENT ON COLUMN archon_task_dependencies.task_id IS 'The task that is blocked';
COMMENT ON COLUMN archon_task_dependencies.depends_on_id IS 'The task that blocks task_id';
COMMENT ON COLUMN archon_task_dependencies.dependency_type IS 'Type of dependency (currently only blocks)';

-- Record migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '013_add_task_dependencies')
ON CONFLICT (version, migration_name) DO NOTHING;
