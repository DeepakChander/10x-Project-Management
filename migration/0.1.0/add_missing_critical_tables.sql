-- ============================================================================
-- Add Missing Critical Tables
-- Description: Creates 5 missing tables needed for full functionality
-- ============================================================================

-- 1. archon_sprints table
CREATE TABLE IF NOT EXISTS archon_sprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    velocity INTEGER DEFAULT 0,
    completed_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON archon_sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON archon_sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON archon_sprints(start_date, end_date);

-- 2. archon_comments table
CREATE TABLE IF NOT EXISTS archon_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,
    mentions UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES archon_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON archon_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON archon_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON archon_comments(created_at DESC);

-- 3. archon_task_status_history table
CREATE TABLE IF NOT EXISTS archon_task_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_in_previous_status INTERVAL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_history_task ON archon_task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed ON archon_task_status_history(changed_at DESC);

-- Create trigger to auto-record status changes
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
BEGIN
    -- Only record if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Calculate time spent in previous status
        time_in_status := NOW() - OLD.updated_at;

        -- Insert status change record with NULL user_id (trigger doesn't have user context)
        INSERT INTO archon_task_status_history (
            task_id,
            user_id,
            old_status,
            new_status,
            time_in_previous_status
        )
        VALUES (
            NEW.id,
            NULL,  -- Trigger doesn't have access to current user
            OLD.status,
            NEW.status,
            time_in_status
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS task_status_change_trigger ON archon_tasks;
CREATE TRIGGER task_status_change_trigger
    AFTER UPDATE ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION record_status_change();

-- 4. archon_notifications table
CREATE TABLE IF NOT EXISTS archon_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON archon_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON archon_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON archon_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON archon_notifications(type);

-- 5. archon_project_memberships table
CREATE TABLE IF NOT EXISTS archon_project_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_project ON archon_project_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON archon_project_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON archon_project_memberships(role);

-- Enable RLS on all new tables
ALTER TABLE archon_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_project_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archon_sprints
DROP POLICY IF EXISTS "Allow service role full access to archon_sprints" ON archon_sprints;
CREATE POLICY "Allow service role full access to archon_sprints" ON archon_sprints
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read archon_sprints" ON archon_sprints;
CREATE POLICY "Allow authenticated users to read archon_sprints" ON archon_sprints
    FOR SELECT TO authenticated USING (true);

-- RLS Policies for archon_comments
DROP POLICY IF EXISTS "Allow service role full access to archon_comments" ON archon_comments;
CREATE POLICY "Allow service role full access to archon_comments" ON archon_comments
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read archon_comments" ON archon_comments;
CREATE POLICY "Allow authenticated users to read archon_comments" ON archon_comments
    FOR SELECT TO authenticated USING (true);

-- RLS Policies for archon_task_status_history
DROP POLICY IF EXISTS "Allow service role full access to archon_task_status_history" ON archon_task_status_history;
CREATE POLICY "Allow service role full access to archon_task_status_history" ON archon_task_status_history
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read archon_task_status_history" ON archon_task_status_history;
CREATE POLICY "Allow authenticated users to read archon_task_status_history" ON archon_task_status_history
    FOR SELECT TO authenticated USING (true);

-- RLS Policies for archon_notifications
DROP POLICY IF EXISTS "Allow service role full access to archon_notifications" ON archon_notifications;
CREATE POLICY "Allow service role full access to archon_notifications" ON archon_notifications
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow users to read own notifications" ON archon_notifications;
CREATE POLICY "Allow users to read own notifications" ON archon_notifications
    FOR SELECT TO authenticated USING (user_id::text = current_setting('request.headers')::json->>'x-user-id');

-- RLS Policies for archon_project_memberships
DROP POLICY IF EXISTS "Allow service role full access to archon_project_memberships" ON archon_project_memberships;
CREATE POLICY "Allow service role full access to archon_project_memberships" ON archon_project_memberships
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read archon_project_memberships" ON archon_project_memberships;
CREATE POLICY "Allow authenticated users to read archon_project_memberships" ON archon_project_memberships
    FOR SELECT TO authenticated USING (true);

-- Ensure archon_migrations table exists
CREATE TABLE IF NOT EXISTS archon_migrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(32),
    UNIQUE(version, migration_name)
);

-- Track this migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', 'add_missing_critical_tables')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added 5 critical tables:';
    RAISE NOTICE '  ✅ archon_sprints';
    RAISE NOTICE '  ✅ archon_comments';
    RAISE NOTICE '  ✅ archon_task_status_history';
    RAISE NOTICE '  ✅ archon_notifications';
    RAISE NOTICE '  ✅ archon_project_memberships';
    RAISE NOTICE '========================================';
END $$;
