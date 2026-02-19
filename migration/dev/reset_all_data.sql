-- ============================================================================
-- Reset All Data (Development Only)
-- ============================================================================
-- WARNING: This deletes ALL data except migrations
-- Use this to test first-time user flow from scratch
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Delete in correct order (respecting foreign keys)

-- User management & sessions
DELETE FROM archon_user_activity_log;
DELETE FROM archon_api_keys;
DELETE FROM archon_user_sessions;
DELETE FROM archon_invitations;

-- Analytics
DELETE FROM archon_daily_progress;
DELETE FROM archon_daily_metrics;
DELETE FROM archon_member_performance;
DELETE FROM archon_velocity_history;
DELETE FROM archon_sprint_burndown;
DELETE FROM archon_task_time_tracking;
DELETE FROM archon_sprint_timeline;

-- AI & suggestions
DELETE FROM archon_ai_learning_data;
DELETE FROM archon_ai_suggestions;
DELETE FROM archon_team_velocity;

-- Notifications
DELETE FROM archon_notification_history;
DELETE FROM archon_notifications;
DELETE FROM archon_notification_preferences;

-- Role assignments
DELETE FROM archon_role_assignments;

-- Agent workflow data (Phase 9)
DELETE FROM archon_webhook_deliveries;
DELETE FROM archon_agent_task_reviews;
DELETE FROM archon_task_acknowledgements;
DELETE FROM archon_agent_webhooks;

-- Project & task data
DELETE FROM archon_document_versions;
DELETE FROM archon_task_dependencies;
DELETE FROM archon_tasks;
DELETE FROM archon_sprints;
DELETE FROM archon_projects;

-- Memberships
DELETE FROM archon_project_memberships;
DELETE FROM archon_org_memberships;

-- Organizational structure
DELETE FROM archon_teams;
DELETE FROM archon_departments;
DELETE FROM archon_organizations;

-- Users (delete last)
DELETE FROM archon_users_profile;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT
  'users' as table_name, COUNT(*) as remaining FROM archon_users_profile
UNION ALL
SELECT 'organizations', COUNT(*) FROM archon_organizations
UNION ALL
SELECT 'projects', COUNT(*) FROM archon_projects
UNION ALL
SELECT 'tasks', COUNT(*) FROM archon_tasks
UNION ALL
SELECT 'sprints', COUNT(*) FROM archon_sprints
UNION ALL
SELECT 'notifications', COUNT(*) FROM archon_notifications
UNION ALL
SELECT 'invitations', COUNT(*) FROM archon_invitations;

-- Expected result: All counts should be 0
