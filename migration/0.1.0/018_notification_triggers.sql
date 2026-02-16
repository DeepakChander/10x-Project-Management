-- ============================================================================
-- Notification Database Triggers
-- Version: 0.1.0
-- Description: Auto-create notifications on task/sprint changes
-- ============================================================================

-- ── Task Assignment Trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify when assignee changes to a real user (not "User")
    IF (TG_OP = 'UPDATE' AND
        NEW.assignee IS NOT NULL AND
        NEW.assignee != 'User' AND
        (OLD.assignee IS NULL OR OLD.assignee != NEW.assignee)) THEN

        INSERT INTO archon_notifications (
            user_id,
            type,
            title,
            message,
            project_id,
            task_id,
            metadata
        )
        VALUES (
            NEW.assignee::uuid,
            'task_assigned',
            'Task assigned: ' || NEW.title,
            'You have been assigned to task: ' || NEW.title,
            NEW.project_id,
            NEW.id,
            jsonb_build_object('task_title', NEW.title)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON archon_tasks;
CREATE TRIGGER trigger_notify_task_assignment
    AFTER INSERT OR UPDATE OF assignee ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_task_assignment();

-- ── Task Status Change Trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify assignee when status changes (skip if assignee is doing the change)
    IF (TG_OP = 'UPDATE' AND
        OLD.status != NEW.status AND
        NEW.assignee IS NOT NULL AND
        NEW.assignee != 'User') THEN

        INSERT INTO archon_notifications (
            user_id,
            type,
            title,
            message,
            project_id,
            task_id,
            metadata
        )
        VALUES (
            NEW.assignee::uuid,
            'task_status_changed',
            'Task status changed: ' || NEW.title,
            'Task "' || NEW.title || '" moved from ' || OLD.status || ' to ' || NEW.status,
            NEW.project_id,
            NEW.id,
            jsonb_build_object(
                'task_title', NEW.title,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_status_change ON archon_tasks;
CREATE TRIGGER trigger_notify_task_status_change
    AFTER UPDATE OF status ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_task_status_change();

-- ── Sprint Status Change Trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_sprint_status_change()
RETURNS TRIGGER AS $$
DECLARE
    member_record RECORD;
BEGIN
    -- Notify all project members when sprint becomes active
    IF (TG_OP = 'UPDATE' AND
        OLD.status != NEW.status AND
        NEW.status = 'active') THEN

        -- Insert notification for each project member
        FOR member_record IN
            SELECT user_id
            FROM archon_project_memberships
            WHERE project_id = NEW.project_id
        LOOP
            INSERT INTO archon_notifications (
                user_id,
                type,
                title,
                message,
                project_id,
                sprint_id,
                metadata
            )
            VALUES (
                member_record.user_id,
                'sprint_started',
                'Sprint started: ' || NEW.name,
                'Sprint "' || NEW.name || '" is now active!',
                NEW.project_id,
                NEW.id,
                jsonb_build_object('sprint_name', NEW.name)
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_sprint_status_change ON archon_sprints;
CREATE TRIGGER trigger_notify_sprint_status_change
    AFTER UPDATE OF status ON archon_sprints
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_sprint_status_change();

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '018_notification_triggers')
ON CONFLICT DO NOTHING;
