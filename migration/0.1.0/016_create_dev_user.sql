-- ============================================================================
-- Create Development User & Setup
-- Version: 0.1.0
-- Description: Creates dev user, default org, and links existing projects
-- ============================================================================

-- Step 1: Create dev user profile
INSERT INTO archon_users_profile (id, email, display_name, user_type)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'dev@10x.local',
    'Development User',
    'human'
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create default development organization
INSERT INTO archon_organizations (id, name, slug, owner_id, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Development Organization',
    'dev-org',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'system'
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add dev user as Owner of the organization
INSERT INTO archon_org_memberships (user_id, org_id, org_role, status)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'owner',
    'active'
)
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Step 4: Link all existing projects to the dev organization (if org_id column exists)
DO $$
BEGIN
    -- Check if org_id column exists in archon_projects
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'archon_projects' AND column_name = 'org_id'
    ) THEN
        -- Update existing projects to belong to dev org
        UPDATE archon_projects
        SET org_id = '00000000-0000-0000-0000-000000000002'::uuid
        WHERE org_id IS NULL;
    ELSE
        -- Column doesn't exist yet, skip this step
        RAISE NOTICE 'org_id column does not exist in archon_projects, skipping project linking';
    END IF;
END $$;

-- Step 5: Add dev user as Owner for all existing projects
INSERT INTO archon_project_memberships (user_id, project_id, project_role, status)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    id,
    'owner',
    'active'
FROM archon_projects
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Track migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '016_create_dev_user')
ON CONFLICT DO NOTHING;
