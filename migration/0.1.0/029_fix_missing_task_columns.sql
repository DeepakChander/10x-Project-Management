-- ============================================================================
-- Fix Missing Columns + Column Type Mismatches
-- Run this if you used COMPLETE_DATABASE_SETUP_PRODUCTION.sql
-- ============================================================================

-- Step 1: Drop FK constraints on created_by and reviewer_id
-- (production SQL incorrectly defined these as UUID; code uses TEXT values like "User")
ALTER TABLE archon_tasks
    DROP CONSTRAINT IF EXISTS archon_tasks_created_by_fkey,
    DROP CONSTRAINT IF EXISTS archon_tasks_reviewer_id_fkey;

-- Step 2: Change created_by and reviewer_id from UUID to TEXT
ALTER TABLE archon_tasks
    ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT,
    ALTER COLUMN reviewer_id TYPE TEXT USING reviewer_id::TEXT;

-- Step 3: Restore correct defaults
ALTER TABLE archon_tasks
    ALTER COLUMN created_by SET DEFAULT 'User';

-- Step 4: Add missing columns to archon_tasks
ALTER TABLE archon_tasks
    ADD COLUMN IF NOT EXISTS feature TEXT,
    ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS code_examples JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_by TEXT;

-- Step 5: Add notes column to archon_project_sources
-- (used by source_linking_service to store 'technical' or 'business' type)
ALTER TABLE archon_project_sources
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 6: Add the dev user to archon_users_profile
-- Required so the dev user UUID (00000000-...-0001) can be used as actor_id in notifications
INSERT INTO archon_users_profile (id, email, display_name, user_type, status)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'dev@10x.local',
    'Development User',
    'human',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create a default organization if none exists
INSERT INTO archon_organizations (id, name, slug, owner_id)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'My Organization',
    'my-org',
    '00000000-0000-0000-0000-000000000001'::uuid
)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Add dev user as owner of the organization
INSERT INTO archon_org_memberships (user_id, org_id, org_role, status)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'owner',
    'active'
)
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Track this fix
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', 'fix_missing_task_columns')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Fix applied successfully!';
    RAISE NOTICE '  archon_tasks.created_by  -> changed to TEXT';
    RAISE NOTICE '  archon_tasks.reviewer_id -> changed to TEXT';
    RAISE NOTICE '  archon_tasks: added feature, sources, code_examples, archived_at, archived_by';
    RAISE NOTICE '  archon_project_sources: added notes';
    RAISE NOTICE '  archon_users_profile: dev user added (00000000-...-0001)';
    RAISE NOTICE '  archon_organizations: default org created';
    RAISE NOTICE '  archon_org_memberships: dev user linked to org';
    RAISE NOTICE '============================================';
END $$;
