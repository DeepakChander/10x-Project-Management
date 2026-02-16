-- ============================================================================
-- Phase 3: Notification System
-- Version: 0.1.0
-- Description: Creates notification system for real-time alerts
-- ============================================================================

-- ── Notification Type Enum ──────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'task_assigned',        -- Task assigned to user
        'task_status_changed',  -- Task moved to different status
        'task_comment',         -- Comment added to task
        'sprint_started',       -- Sprint became active
        'sprint_ending',        -- Sprint ending soon (24h warning)
        'sprint_completed',     -- Sprint completed
        'dependency_resolved',  -- Blocking task completed
        'mention',              -- User @mentioned in comment
        'review_requested',     -- Review requested from user
        'review_completed'      -- Review completed on user's task
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Notification Channel Enum ───────────────────────────────────
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM (
        'in_app',     -- In-app notification
        'email',      -- Email notification
        'webhook'     -- Webhook/API notification
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Notifications Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Context (what triggered the notification)
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,

    -- Actor (who caused the notification)
    actor_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',  -- Additional context (old_status, new_status, etc.)

    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Index for fast queries
    CONSTRAINT check_read_at CHECK (read = FALSE OR read_at IS NOT NULL)
);

-- ── Notification Preferences ────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Notification type preferences
    notification_type notification_type NOT NULL,

    -- Channels enabled for this type
    in_app_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    webhook_enabled BOOLEAN DEFAULT FALSE,

    -- Grouping settings
    batch_enabled BOOLEAN DEFAULT FALSE,  -- Group multiple notifications
    batch_interval_minutes INTEGER DEFAULT 15,  -- Batch every 15 minutes

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, notification_type)
);

-- ── Notification History (for debugging/analytics) ──────────────
CREATE TABLE IF NOT EXISTS archon_notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES archon_notifications(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user ON archon_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON archon_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON archon_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON archon_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_project ON archon_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task ON archon_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON archon_notifications(type);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON archon_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_notif ON archon_notification_history(notification_id);

-- ── Auto-update timestamp trigger ───────────────────────────────
CREATE TRIGGER update_notification_prefs_updated_at
    BEFORE UPDATE ON archon_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── Auto-set read_at when read=true ─────────────────────────────
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = TRUE AND OLD.read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_read_at_trigger
    BEFORE UPDATE ON archon_notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_read_at();

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notification_history ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to notifications" ON archon_notifications;
CREATE POLICY "Service role full access to notifications"
    ON archon_notifications FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to notification preferences" ON archon_notification_preferences;
CREATE POLICY "Service role full access to notification preferences"
    ON archon_notification_preferences FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to notification history" ON archon_notification_history;
CREATE POLICY "Service role full access to notification history"
    ON archon_notification_history FOR ALL
    USING (auth.role() = 'service_role');

-- ── Default Preferences for All Users ───────────────────────────
-- Create default preferences for existing users
INSERT INTO archon_notification_preferences (user_id, notification_type, in_app_enabled, email_enabled)
SELECT
    u.id,
    t.type,
    TRUE,  -- in_app enabled by default
    FALSE  -- email disabled by default (need email config first)
FROM archon_users_profile u
CROSS JOIN (
    SELECT unnest(enum_range(NULL::notification_type)) AS type
) t
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '017_phase3_notifications')
ON CONFLICT DO NOTHING;
