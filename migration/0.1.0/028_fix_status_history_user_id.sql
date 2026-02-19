-- ============================================================================
-- Fix: Status History User ID
-- Version: 0.1.0
-- Description: Make user_id nullable since triggers can't access app context
-- ============================================================================

-- Make user_id nullable (triggers can't determine who made the change)
ALTER TABLE archon_task_status_history
ALTER COLUMN user_id DROP NOT NULL;

-- Update the trigger function to use NULL instead of hardcoded UUID
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
            user_id,  -- NULL - will be updated by application layer if needed
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

-- Ensure archon_migrations table exists before tracking
CREATE TABLE IF NOT EXISTS archon_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(32),
  UNIQUE(version, migration_name)
);

-- Track migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '028_fix_status_history_user_id')
ON CONFLICT DO NOTHING;
