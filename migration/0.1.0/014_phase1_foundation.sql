-- =====================================================
-- Phase 1: Foundation - Role Management & Permissions
-- =====================================================
-- Creates the organizational hierarchy, role system,
-- and permission framework for 10x PM.
--
-- Tables created:
--   archon_users_profile    - Extended user profile
--   archon_organizations    - Organizations / companies
--   archon_departments      - Departments within orgs
--   archon_teams            - Teams within departments
--   archon_org_memberships  - User membership in orgs
--   archon_project_memberships - User roles per project
--   archon_permissions      - Permission matrix
--   archon_role_assignments - Audit trail for role changes
-- =====================================================

-- 1. Role enum type (7-level hierarchy)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'agent',   -- Level 1: AI assistants, bots
        'viewer',  -- Level 2: Read-only stakeholders
        'member',  -- Level 3: Regular contributors
        'lead',    -- Level 4: Team/tech leads
        'manager', -- Level 5: Project/department managers
        'admin',   -- Level 6: Organization administrators
        'owner'    -- Level 7: Organization owner
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Role level function for comparison
CREATE OR REPLACE FUNCTION role_level(r user_role)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE r
        WHEN 'agent'   THEN 1
        WHEN 'viewer'  THEN 2
        WHEN 'member'  THEN 3
        WHEN 'lead'    THEN 4
        WHEN 'manager' THEN 5
        WHEN 'admin'   THEN 6
        WHEN 'owner'   THEN 7
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Membership status enum
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM (
        'invited',
        'active',
        'deactivated'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Permission scope enum
DO $$ BEGIN
    CREATE TYPE permission_scope AS ENUM (
        'own',     -- Only own resources
        'team',    -- Team-scoped
        'project', -- Project-scoped
        'org'      -- Organization-wide
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. Users Profile (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    user_type TEXT NOT NULL DEFAULT 'human' CHECK (user_type IN ('human', 'agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_profile_email ON archon_users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON archon_users_profile(status);
CREATE INDEX IF NOT EXISTS idx_users_profile_type ON archon_users_profile(user_type);

CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON archon_users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. Organizations
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES archon_users_profile(id) ON DELETE RESTRICT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON archon_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON archon_organizations(owner_id);

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON archon_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Departments
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES archon_organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON archon_departments(org_id);
CREATE INDEX IF NOT EXISTS idx_departments_head ON archon_departments(head_id);

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON archon_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Teams
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES archon_departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lead_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_department ON archon_teams(department_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON archon_teams(lead_id);

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON archon_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Organization Memberships
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES archon_organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES archon_departments(id) ON DELETE SET NULL,
    team_id UUID REFERENCES archon_teams(id) ON DELETE SET NULL,
    org_role user_role NOT NULL DEFAULT 'member',
    status membership_status NOT NULL DEFAULT 'invited',
    invited_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON archon_org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON archon_org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON archon_org_memberships(org_role);
CREATE INDEX IF NOT EXISTS idx_org_memberships_status ON archon_org_memberships(status);

CREATE TRIGGER update_org_memberships_updated_at
    BEFORE UPDATE ON archon_org_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-set joined_at when status changes to active
CREATE OR REPLACE FUNCTION set_joined_at_on_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        NEW.joined_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_org_membership_joined_at
    BEFORE UPDATE ON archon_org_memberships
    FOR EACH ROW
    EXECUTE FUNCTION set_joined_at_on_active();

-- =====================================================
-- 7. Project Memberships
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_project_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    project_role user_role NOT NULL DEFAULT 'member',
    assigned_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_memberships_user ON archon_project_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_project ON archon_project_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_role ON archon_project_memberships(project_role);

CREATE TRIGGER update_project_memberships_updated_at
    BEFORE UPDATE ON archon_project_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Permissions Matrix
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
    scope permission_scope NOT NULL DEFAULT 'own',
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_role ON archon_permissions(role);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON archon_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON archon_permissions(action);

-- =====================================================
-- 9. Role Assignments (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS archon_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('org', 'project')),
    scope_id UUID NOT NULL,
    assigned_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON archon_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_scope ON archon_role_assignments(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_active ON archon_role_assignments(user_id, scope_type, scope_id)
    WHERE revoked_at IS NULL;

-- =====================================================
-- 10. Default Permissions Data
-- =====================================================
-- Seed the permission matrix based on the documented role hierarchy

-- Owner permissions (Level 7) - full access
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('owner', 'project', 'create', 'org'),
    ('owner', 'project', 'read', 'org'),
    ('owner', 'project', 'update', 'org'),
    ('owner', 'project', 'delete', 'org'),
    ('owner', 'task', 'create', 'org'),
    ('owner', 'task', 'read', 'org'),
    ('owner', 'task', 'update', 'org'),
    ('owner', 'task', 'delete', 'org'),
    ('owner', 'member', 'create', 'org'),
    ('owner', 'member', 'read', 'org'),
    ('owner', 'member', 'update', 'org'),
    ('owner', 'member', 'delete', 'org'),
    ('owner', 'settings', 'read', 'org'),
    ('owner', 'settings', 'update', 'org'),
    ('owner', 'sprint', 'create', 'org'),
    ('owner', 'sprint', 'read', 'org'),
    ('owner', 'sprint', 'update', 'org'),
    ('owner', 'sprint', 'delete', 'org')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Admin permissions (Level 6) - everything except transferring ownership
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('admin', 'project', 'create', 'org'),
    ('admin', 'project', 'read', 'org'),
    ('admin', 'project', 'update', 'org'),
    ('admin', 'project', 'delete', 'org'),
    ('admin', 'task', 'create', 'org'),
    ('admin', 'task', 'read', 'org'),
    ('admin', 'task', 'update', 'org'),
    ('admin', 'task', 'delete', 'org'),
    ('admin', 'member', 'create', 'org'),
    ('admin', 'member', 'read', 'org'),
    ('admin', 'member', 'update', 'org'),
    ('admin', 'member', 'delete', 'org'),
    ('admin', 'settings', 'read', 'org'),
    ('admin', 'settings', 'update', 'org'),
    ('admin', 'sprint', 'create', 'org'),
    ('admin', 'sprint', 'read', 'org'),
    ('admin', 'sprint', 'update', 'org'),
    ('admin', 'sprint', 'delete', 'org')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Manager permissions (Level 5) - project management
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('manager', 'project', 'create', 'org'),
    ('manager', 'project', 'read', 'org'),
    ('manager', 'project', 'update', 'project'),
    ('manager', 'task', 'create', 'project'),
    ('manager', 'task', 'read', 'project'),
    ('manager', 'task', 'update', 'project'),
    ('manager', 'task', 'delete', 'project'),
    ('manager', 'member', 'create', 'project'),
    ('manager', 'member', 'read', 'project'),
    ('manager', 'member', 'update', 'project'),
    ('manager', 'sprint', 'create', 'project'),
    ('manager', 'sprint', 'read', 'project'),
    ('manager', 'sprint', 'update', 'project'),
    ('manager', 'sprint', 'delete', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Lead permissions (Level 4) - team leadership
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('lead', 'project', 'read', 'project'),
    ('lead', 'task', 'create', 'project'),
    ('lead', 'task', 'read', 'project'),
    ('lead', 'task', 'update', 'project'),
    ('lead', 'member', 'read', 'project'),
    ('lead', 'sprint', 'read', 'project'),
    ('lead', 'sprint', 'update', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Member permissions (Level 3) - own work
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('member', 'project', 'read', 'project'),
    ('member', 'task', 'create', 'project'),
    ('member', 'task', 'read', 'project'),
    ('member', 'task', 'update', 'own'),
    ('member', 'member', 'read', 'project'),
    ('member', 'sprint', 'read', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Viewer permissions (Level 2) - read only
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('viewer', 'project', 'read', 'project'),
    ('viewer', 'task', 'read', 'project'),
    ('viewer', 'member', 'read', 'project'),
    ('viewer', 'sprint', 'read', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Agent permissions (Level 1) - limited creation, own task movement
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    ('agent', 'project', 'read', 'project'),
    ('agent', 'task', 'create', 'project'),
    ('agent', 'task', 'read', 'project'),
    ('agent', 'task', 'update', 'own'),
    ('agent', 'sprint', 'read', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- =====================================================
-- 11. Effective Role Resolution Function
-- =====================================================
CREATE OR REPLACE FUNCTION get_effective_role(
    p_user_id UUID,
    p_project_id UUID
)
RETURNS user_role AS $$
DECLARE
    v_org_role user_role;
    v_project_role user_role;
    v_org_id UUID;
BEGIN
    -- Get the org that owns this project (for now, use first org membership)
    SELECT om.org_role INTO v_org_role
    FROM archon_org_memberships om
    WHERE om.user_id = p_user_id
      AND om.status = 'active'
    ORDER BY role_level(om.org_role) DESC
    LIMIT 1;

    -- Get project-specific role
    SELECT pm.project_role INTO v_project_role
    FROM archon_project_memberships pm
    WHERE pm.user_id = p_user_id
      AND pm.project_id = p_project_id;

    -- Return the higher of the two roles
    IF v_org_role IS NULL AND v_project_role IS NULL THEN
        RETURN NULL;
    ELSIF v_org_role IS NULL THEN
        RETURN v_project_role;
    ELSIF v_project_role IS NULL THEN
        RETURN v_org_role;
    ELSIF role_level(v_org_role) >= role_level(v_project_role) THEN
        RETURN v_org_role;
    ELSE
        RETURN v_project_role;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 12. Permission Check Function
-- =====================================================
CREATE OR REPLACE FUNCTION check_permission(
    p_user_id UUID,
    p_project_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_effective_role user_role;
    v_has_permission BOOLEAN;
BEGIN
    -- Resolve effective role
    v_effective_role := get_effective_role(p_user_id, p_project_id);

    IF v_effective_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check permission matrix
    SELECT EXISTS (
        SELECT 1
        FROM archon_permissions
        WHERE role = v_effective_role
          AND resource = p_resource
          AND action = p_action
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 13. RLS Policies
-- =====================================================

-- Users profile
ALTER TABLE archon_users_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on users_profile" ON archon_users_profile
    FOR ALL USING (auth.role() = 'service_role');

-- Organizations
ALTER TABLE archon_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on organizations" ON archon_organizations
    FOR ALL USING (auth.role() = 'service_role');

-- Departments
ALTER TABLE archon_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on departments" ON archon_departments
    FOR ALL USING (auth.role() = 'service_role');

-- Teams
ALTER TABLE archon_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on teams" ON archon_teams
    FOR ALL USING (auth.role() = 'service_role');

-- Org memberships
ALTER TABLE archon_org_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on org_memberships" ON archon_org_memberships
    FOR ALL USING (auth.role() = 'service_role');

-- Project memberships
ALTER TABLE archon_project_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on project_memberships" ON archon_project_memberships
    FOR ALL USING (auth.role() = 'service_role');

-- Permissions
ALTER TABLE archon_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on permissions" ON archon_permissions
    FOR ALL USING (auth.role() = 'service_role');

-- Role assignments
ALTER TABLE archon_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on role_assignments" ON archon_role_assignments
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 14. Track this migration
-- =====================================================
INSERT INTO archon_migrations (version, migration_name) VALUES
    ('0.1.0', '014_phase1_foundation')
ON CONFLICT (version, migration_name) DO NOTHING;
