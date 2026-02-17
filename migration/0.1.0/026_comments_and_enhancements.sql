-- ============================================================================
-- Comments, Tags, and Task Enhancements
-- Version: 0.1.0
-- Description: Add comments, tags, status history, and time tracking
-- ============================================================================

-- ── Task Comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    comment_text TEXT NOT NULL,

    -- Mentions
    mentions UUID[], -- Array of mentioned user IDs

    -- Metadata
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT check_comment_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0)
);

-- ── Task Status History ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    old_status TEXT,
    new_status TEXT NOT NULL,

    time_in_previous_status INTERVAL, -- How long in old status

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Add Missing Fields to Tasks ─────────────────────────────────
DO $$
BEGIN
    -- Tags
    ALTER TABLE archon_tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

    -- Time tracking
    ALTER TABLE archon_tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6,2);
    ALTER TABLE archon_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(6,2);

    -- WIP tracking
    ALTER TABLE archon_tasks ADD COLUMN IF NOT EXISTS wip_limit_violations INTEGER DEFAULT 0;
END $$;

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comments_task ON archon_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON archon_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON archon_task_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_task ON archon_task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON archon_task_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_tags ON archon_tasks USING GIN (tags);

-- ── Track Status Changes Automatically ──────────────────────────
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
BEGIN
    IF OLD.status != NEW.status THEN
        -- Calculate time in previous status
        time_in_status := NOW() - OLD.updated_at;

        -- Record status change
        INSERT INTO archon_task_status_history (
            task_id,
            user_id,
            old_status,
            new_status,
            time_in_previous_status
        )
        VALUES (
            NEW.id,
            -- TODO: Get current user from context
            '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder
            OLD.status,
            NEW.status,
            time_in_status
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_status_change ON archon_tasks;
CREATE TRIGGER trigger_record_status_change
    AFTER UPDATE OF status ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION record_status_change();

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to comments" ON archon_task_comments;
CREATE POLICY "Service role full access to comments"
    ON archon_task_comments FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to status history" ON archon_task_status_history;
CREATE POLICY "Service role full access to status history"
    ON archon_task_status_history FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '026_comments_and_enhancements')
ON CONFLICT DO NOTHING;
