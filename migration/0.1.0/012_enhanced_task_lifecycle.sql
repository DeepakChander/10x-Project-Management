-- =====================================================
-- Migration: Enhanced Task Lifecycle
-- Version: 0.1.0 / 012
-- Description: Adds 'backlog' status to task_status enum,
--   new lifecycle columns (reviewer_id, story_points,
--   due_date, started_at, completed_at, created_by),
--   and changes the default status to 'backlog'.
--
-- IMPORTANT: This migration must be run in 2 steps in Supabase SQL Editor.
--   PostgreSQL requires new enum values to be committed before use.
--   Step 1: Run ONLY the ALTER TYPE statement below (line 14).
--   Step 2: Run everything from line 17 onward.
-- =====================================================

-- STEP 1: Run this ALONE first, then run the rest separately.
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'backlog' BEFORE 'todo';

-- STEP 2: Run everything below AFTER Step 1 has been committed.
DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN reviewer_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN story_points INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN due_date TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN started_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE archon_tasks ADD COLUMN created_by TEXT DEFAULT 'User';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Change default status from 'todo' to 'backlog'
ALTER TABLE archon_tasks ALTER COLUMN status SET DEFAULT 'backlog';

-- 4. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_archon_tasks_due_date ON archon_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_story_points ON archon_tasks(story_points);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_reviewer_id ON archon_tasks(reviewer_id);

-- 5. Add comments for new columns
COMMENT ON COLUMN archon_tasks.reviewer_id IS 'The user or agent assigned to review this task';
COMMENT ON COLUMN archon_tasks.story_points IS 'Estimated effort in story points (1-13 Fibonacci scale)';
COMMENT ON COLUMN archon_tasks.due_date IS 'Target completion date for this task';
COMMENT ON COLUMN archon_tasks.started_at IS 'Timestamp when task was moved to doing status';
COMMENT ON COLUMN archon_tasks.completed_at IS 'Timestamp when task was moved to done status';
COMMENT ON COLUMN archon_tasks.created_by IS 'The user or agent that created this task';

-- 6. Record migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '012_enhanced_task_lifecycle')
ON CONFLICT (version, migration_name) DO NOTHING;
