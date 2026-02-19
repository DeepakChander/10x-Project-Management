-- Migration 032: Fix record_status_change trigger type mismatch
--
-- Problem: The trigger does COALESCE(NEW.created_by, uuid_literal) but
-- created_by is TEXT and the literal is UUID — PostgreSQL rejects the
-- type mismatch with error code 42804.
--
-- Fix: Remove the COALESCE and always use the system placeholder UUID.
-- The service layer already records the real actor separately.

CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        time_in_status := NOW() - OLD.updated_at;

        INSERT INTO archon_task_status_history (
            task_id,
            user_id,
            old_status,
            new_status,
            time_in_previous_status
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000001'::uuid,
            OLD.status,
            NEW.status,
            time_in_status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Record this migration
INSERT INTO archon_migrations (version, name, applied_at)
VALUES ('0.1.0', '032_fix_status_history_trigger', NOW())
ON CONFLICT (version, name) DO NOTHING;
