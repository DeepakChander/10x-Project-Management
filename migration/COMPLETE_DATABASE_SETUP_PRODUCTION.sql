-- =============================================================================
-- 10x PROJECT MANAGEMENT - COMPLETE DATABASE SETUP (PRODUCTION)
-- =============================================================================
-- This script creates ALL tables, functions, triggers, enums, and policies
-- Run this ONCE in a fresh Supabase project for complete setup
--
-- Tables Created: 44 tables + views + functions
-- Features: User management, Organizations, Projects, Tasks, Sprints, Analytics,
--           Knowledge Base, Invitations, Notifications, Agent Workflows
-- =============================================================================

-- =============================
-- STEP 0: ENABLE REQUIRED EXTENSIONS
-- =============================
-- CRITICAL: Must enable pgvector extension first!
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search

-- =============================
-- STEP 1: UTILITY FUNCTIONS
-- =============================

-- Generic trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================
-- STEP 2: ENUMS
-- =============================

-- User role hierarchy (7 levels)
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Role level comparison function
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

-- Membership status
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('invited', 'active', 'deactivated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permission scope
DO $$ BEGIN
    CREATE TYPE permission_scope AS ENUM ('own', 'team', 'project', 'org');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invitation status
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sprint status
DO $$ BEGIN
    CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'task_assigned',
        'task_status_changed',
        'task_comment',
        'sprint_started',
        'sprint_ending',
        'sprint_completed',
        'dependency_resolved',
        'mention',
        'review_requested',
        'review_completed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification channels
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'webhook');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI suggestion types
DO $$ BEGIN
    CREATE TYPE ai_suggestion_type AS ENUM (
        'task_estimation',
        'sprint_planning',
        'priority_suggestion',
        'dependency_detection',
        'capacity_warning'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================
-- STEP 3: CORE SETTINGS & CONFIGURATION
-- =============================

CREATE TABLE IF NOT EXISTS archon_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    encrypted_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_settings_key ON archon_settings(key);
CREATE INDEX IF NOT EXISTS idx_archon_settings_category ON archon_settings(category);

-- =============================
-- STEP 4: USER MANAGEMENT
-- =============================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS archon_users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    user_type TEXT NOT NULL DEFAULT 'human' CHECK (user_type IN ('human', 'agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    password_hash TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_profile_email ON archon_users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON archon_users_profile(status);
CREATE INDEX IF NOT EXISTS idx_users_profile_type ON archon_users_profile(user_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_email_login ON archon_users_profile(email) WHERE password_hash IS NOT NULL;

CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON archon_users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- STEP 5: ORGANIZATIONS
-- =============================

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

-- =============================
-- STEP 6: DEPARTMENTS & TEAMS
-- =============================

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

-- =============================
-- STEP 7: MEMBERSHIPS
-- =============================

-- Organization memberships
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

-- =============================
-- STEP 8: PERMISSIONS & ROLES
-- =============================

-- Permissions matrix
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

-- Role assignments audit trail
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

-- =============================
-- STEP 9: INVITATIONS & SESSIONS
-- =============================

-- Invitations
CREATE TABLE IF NOT EXISTS archon_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES archon_organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES archon_teams(id) ON DELETE SET NULL,
    department_id UUID REFERENCES archon_departments(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    invited_role user_role NOT NULL,
    invited_by UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    invite_token TEXT UNIQUE NOT NULL,
    invite_link TEXT NOT NULL,
    status invitation_status NOT NULL DEFAULT 'pending',
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    personal_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_expires_at CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON archon_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON archon_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON archon_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON archon_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON archon_invitations(expires_at);

-- User sessions
CREATE TABLE IF NOT EXISTS archon_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    user_agent TEXT,
    ip_address INET,
    device_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON archon_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON archon_user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON archon_user_sessions(expires_at);

-- API keys
CREATE TABLE IF NOT EXISTS archon_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    is_agent_key BOOLEAN DEFAULT FALSE,
    agent_capabilities JSONB DEFAULT '{}',
    supervisor_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    rate_limit_per_hour INTEGER DEFAULT 100,
    requests_today INTEGER DEFAULT 0,
    last_request_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    total_requests INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_supervisor CHECK (NOT is_agent_key OR supervisor_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON archon_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON archon_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON archon_api_keys(is_active) WHERE is_active = TRUE;

-- User activity log
CREATE TABLE IF NOT EXISTS archon_user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    org_id UUID REFERENCES archon_organizations(id) ON DELETE CASCADE,
    project_id UUID,
    action_type TEXT NOT NULL,
    action_description TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON archon_user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON archon_user_activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON archon_user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON archon_user_activity_log(action_type);

-- =============================
-- STEP 10: KNOWLEDGE BASE TABLES
-- =============================

CREATE TABLE IF NOT EXISTS archon_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,
    source_display_name TEXT,
    knowledge_type TEXT DEFAULT 'documentation',
    crawl_status TEXT DEFAULT 'pending',
    last_crawled_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_sources_url ON archon_sources(source_url);
CREATE INDEX IF NOT EXISTS idx_archon_sources_status ON archon_sources(crawl_status);

CREATE TABLE IF NOT EXISTS archon_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_documents_source ON archon_documents(source_id);

CREATE TABLE IF NOT EXISTS archon_code_examples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    language TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    content_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content || ' ' || COALESCE(summary, ''))) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_examples_source ON archon_code_examples(source_id);
CREATE INDEX IF NOT EXISTS idx_code_examples_language ON archon_code_examples(language);
CREATE INDEX IF NOT EXISTS idx_code_examples_content_search ON archon_code_examples USING GIN (content_search_vector);
CREATE INDEX IF NOT EXISTS idx_code_examples_content_trgm ON archon_code_examples USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_code_examples_summary_trgm ON archon_code_examples USING GIN (summary gin_trgm_ops);

CREATE TABLE IF NOT EXISTS archon_page_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    page_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, url)
);

CREATE INDEX IF NOT EXISTS idx_archon_page_metadata_source ON archon_page_metadata(source_id);
CREATE INDEX IF NOT EXISTS idx_archon_page_metadata_url ON archon_page_metadata(url);

CREATE TABLE IF NOT EXISTS archon_crawled_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES archon_sources(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    content_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', COALESCE(content, ''))) STORED,
    metadata JSONB DEFAULT '{}'::jsonb,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, url)
);

CREATE INDEX IF NOT EXISTS idx_crawled_pages_source ON archon_crawled_pages(source_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_content_search ON archon_crawled_pages USING GIN (content_search_vector);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_content_trgm ON archon_crawled_pages USING GIN (content gin_trgm_ops);

-- =============================
-- STEP 11: PROJECT MANAGEMENT TABLES
-- =============================

CREATE TABLE IF NOT EXISTS archon_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES archon_organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    github_repo VARCHAR(500),
    features JSONB DEFAULT '[]'::jsonb,
    docs JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '[]'::jsonb,
    technical_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
    business_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
    pinned BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_projects_org ON archon_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_archon_projects_pinned ON archon_projects(pinned);
CREATE INDEX IF NOT EXISTS idx_archon_projects_archived ON archon_projects(archived);

-- Project memberships
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

-- Project sources
CREATE TABLE IF NOT EXISTS archon_project_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES archon_sources(id) ON DELETE CASCADE,
    source_type VARCHAR(50) CHECK (source_type IN ('technical', 'business')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_project_sources_project ON archon_project_sources(project_id);

-- =============================
-- STEP 12: SPRINTS
-- =============================

CREATE TABLE IF NOT EXISTS archon_sprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT DEFAULT '',
    status sprint_status NOT NULL DEFAULT 'planning',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    capacity_hours INTEGER DEFAULT 0,
    velocity INTEGER DEFAULT 0,
    completed_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_sprint_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON archon_sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON archon_sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON archon_sprints(start_date, end_date);

CREATE OR REPLACE FUNCTION update_sprint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sprint_updated_at ON archon_sprints;
CREATE TRIGGER update_sprint_updated_at
    BEFORE UPDATE ON archon_sprints
    FOR EACH ROW
    EXECUTE FUNCTION update_sprint_timestamp();

-- =============================
-- STEP 13: TASK MANAGEMENT TABLES
-- =============================

CREATE TABLE IF NOT EXISTS archon_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES archon_tasks(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'doing', 'review', 'done')),
    assignee VARCHAR(255) DEFAULT 'User',
    task_order INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    feature TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    code_examples JSONB DEFAULT '[]'::jsonb,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE SET NULL,
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archived_by TEXT,
    reviewer_id TEXT,
    story_points INTEGER,
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by TEXT DEFAULT 'User',
    estimated_hours NUMERIC(6,2),
    actual_hours NUMERIC(6,2),
    tags TEXT[] DEFAULT '{}',
    wip_limit_violations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_tasks_project ON archon_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_status ON archon_tasks(status);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_assignee ON archon_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_sprint ON archon_tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_archon_tasks_parent ON archon_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON archon_tasks USING GIN (tags);

-- Task dependencies
CREATE TABLE IF NOT EXISTS archon_task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    depends_on_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_id),
    CHECK (task_id != depends_on_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON archon_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON archon_task_dependencies(depends_on_id);

-- Task status history
CREATE TABLE IF NOT EXISTS archon_task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    time_in_previous_status INTERVAL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_history_task ON archon_task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON archon_task_status_history(created_at DESC);

-- Task comments
CREATE TABLE IF NOT EXISTS archon_task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    mentions UUID[],
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_comment_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON archon_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON archon_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON archon_task_comments(created_at DESC);

-- Status change tracking trigger
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
    current_user_id UUID;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        time_in_status := NOW() - OLD.updated_at;

        -- Use system placeholder UUID (created_by is TEXT, cannot COALESCE with UUID literal)
        current_user_id := '00000000-0000-0000-0000-000000000001'::uuid;

        INSERT INTO archon_task_status_history (
            task_id, user_id, old_status, new_status, time_in_previous_status
        ) VALUES (
            NEW.id, current_user_id, OLD.status, NEW.status, time_in_status
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

-- =============================
-- STEP 14: NOTIFICATIONS
-- =============================

CREATE TABLE IF NOT EXISTS archon_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_read_at CHECK (read = FALSE OR read_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON archon_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON archon_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON archon_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON archon_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON archon_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_project ON archon_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task ON archon_notifications(task_id);

-- Notification preferences
CREATE TABLE IF NOT EXISTS archon_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    webhook_enabled BOOLEAN DEFAULT FALSE,
    batch_enabled BOOLEAN DEFAULT FALSE,
    batch_interval_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON archon_notification_preferences(user_id);

CREATE TRIGGER update_notification_prefs_updated_at
    BEFORE UPDATE ON archon_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notification history
CREATE TABLE IF NOT EXISTS archon_notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES archon_notifications(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_notif ON archon_notification_history(notification_id);

-- Auto-set read_at when read=true
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

-- =============================
-- STEP 15: ANALYTICS TABLES
-- =============================

-- Sprint burndown snapshots
CREATE TABLE IF NOT EXISTS archon_sprint_burndown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    remaining_story_points INTEGER NOT NULL DEFAULT 0,
    remaining_tasks INTEGER NOT NULL DEFAULT 0,
    completed_today_points INTEGER DEFAULT 0,
    completed_today_tasks INTEGER DEFAULT 0,
    total_scope_points INTEGER NOT NULL DEFAULT 0,
    total_scope_tasks INTEGER NOT NULL DEFAULT 0,
    ideal_remaining_points DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(sprint_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_burndown_sprint ON archon_sprint_burndown(sprint_id);
CREATE INDEX IF NOT EXISTS idx_burndown_date ON archon_sprint_burndown(snapshot_date);

-- Velocity history
CREATE TABLE IF NOT EXISTS archon_velocity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    sprint_name TEXT NOT NULL,
    sprint_start_date TIMESTAMPTZ,
    sprint_end_date TIMESTAMPTZ,
    planned_story_points INTEGER DEFAULT 0,
    completed_story_points INTEGER DEFAULT 0,
    planned_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    velocity_points DECIMAL(6,2),
    velocity_tasks DECIMAL(6,2),
    completion_rate DECIMAL(5,2),
    sprint_status TEXT CHECK (sprint_status IN ('completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, sprint_id)
);

CREATE INDEX IF NOT EXISTS idx_velocity_history_project ON archon_velocity_history(project_id);
CREATE INDEX IF NOT EXISTS idx_velocity_history_sprint ON archon_velocity_history(sprint_id);

-- Member performance
CREATE TABLE IF NOT EXISTS archon_member_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    tasks_completed INTEGER DEFAULT 0,
    story_points_completed INTEGER DEFAULT 0,
    tasks_first_time_right INTEGER DEFAULT 0,
    tasks_required_rework INTEGER DEFAULT 0,
    avg_task_duration_hours DECIMAL(6,2),
    total_active_hours DECIMAL(8,2),
    tasks_reviewed INTEGER DEFAULT 0,
    helpful_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, project_id, sprint_id)
);

CREATE INDEX IF NOT EXISTS idx_member_performance_user ON archon_member_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_sprint ON archon_member_performance(sprint_id);

CREATE TRIGGER update_member_performance_updated_at
    BEFORE UPDATE ON archon_member_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Daily metrics
CREATE TABLE IF NOT EXISTS archon_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,
    story_points_added INTEGER DEFAULT 0,
    story_points_completed INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    active_contributors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_project ON archon_daily_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON archon_daily_metrics(metric_date);

-- =============================
-- STEP 16: AI INTEGRATION
-- =============================

-- AI suggestions
CREATE TABLE IF NOT EXISTS archon_ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,
    type ai_suggestion_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    suggestion_data JSONB NOT NULL DEFAULT '{}',
    accepted BOOLEAN DEFAULT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    model_used TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_project ON archon_ai_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_task ON archon_ai_suggestions(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_sprint ON archon_ai_suggestions(sprint_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON archon_ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_pending ON archon_ai_suggestions(accepted) WHERE accepted IS NULL;

-- AI learning data
CREATE TABLE IF NOT EXISTS archon_ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    predicted_story_points INTEGER,
    predicted_duration_hours INTEGER,
    predicted_priority TEXT,
    actual_story_points INTEGER,
    actual_duration_hours INTEGER,
    actual_priority TEXT,
    estimation_error DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_task ON archon_ai_learning_data(task_id);

-- Team velocity
CREATE TABLE IF NOT EXISTS archon_team_velocity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,
    planned_story_points INTEGER NOT NULL DEFAULT 0,
    completed_story_points INTEGER NOT NULL DEFAULT 0,
    planned_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    team_size INTEGER DEFAULT 1,
    sprint_days INTEGER DEFAULT 10,
    hours_per_day DECIMAL(4,2) DEFAULT 6.0,
    velocity_points_per_sprint DECIMAL(6,2),
    velocity_tasks_per_sprint DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, sprint_id)
);

CREATE INDEX IF NOT EXISTS idx_team_velocity_project ON archon_team_velocity(project_id);
CREATE INDEX IF NOT EXISTS idx_team_velocity_sprint ON archon_team_velocity(sprint_id);

CREATE TRIGGER update_team_velocity_updated_at
    BEFORE UPDATE ON archon_team_velocity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- STEP 17: DOCUMENT VERSIONING
-- =============================

CREATE TABLE IF NOT EXISTS archon_document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    author UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    commit_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_project ON archon_document_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON archon_document_versions(project_id, document_id);

-- =============================
-- STEP 18: AGENT WORKFLOW TABLES
-- =============================

CREATE TABLE IF NOT EXISTS archon_task_acknowledgements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(task_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_task_ack_task ON archon_task_acknowledgements(task_id);
CREATE INDEX IF NOT EXISTS idx_task_ack_agent ON archon_task_acknowledgements(agent_id);

CREATE TABLE IF NOT EXISTS archon_agent_task_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    review_status VARCHAR(50) CHECK (review_status IN ('approved', 'changes_requested', 'commented')),
    review_text TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_task ON archon_agent_task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent ON archon_agent_task_reviews(agent_id);

CREATE TABLE IF NOT EXISTS archon_agent_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL UNIQUE,
    webhook_url TEXT NOT NULL,
    events TEXT[] DEFAULT ARRAY['task_assigned', 'task_updated']::TEXT[],
    secret_key TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_webhooks_agent ON archon_agent_webhooks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_active ON archon_agent_webhooks(active);

-- =============================
-- STEP 19: PROMPTS LIBRARY
-- =============================

CREATE TABLE IF NOT EXISTS archon_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    category VARCHAR(100),
    description TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archon_prompts_category ON archon_prompts(category);

-- =============================
-- STEP 20: MIGRATION TRACKING
-- =============================

CREATE TABLE IF NOT EXISTS archon_migrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    migration_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(32),
    UNIQUE(version, migration_name)
);

CREATE INDEX IF NOT EXISTS idx_archon_migrations_version ON archon_migrations(version);
CREATE INDEX IF NOT EXISTS idx_archon_migrations_applied ON archon_migrations(applied_at DESC);

-- =============================
-- STEP 21: PERMISSION MATRIX DATA
-- =============================

-- Seed default permissions for each role
INSERT INTO archon_permissions (role, resource, action, scope) VALUES
    -- Owner (Level 7) - Full access
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
    ('owner', 'sprint', 'delete', 'org'),

    -- Admin (Level 6)
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
    ('admin', 'sprint', 'delete', 'org'),

    -- Manager (Level 5)
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
    ('manager', 'sprint', 'delete', 'project'),

    -- Lead (Level 4)
    ('lead', 'project', 'read', 'project'),
    ('lead', 'task', 'create', 'project'),
    ('lead', 'task', 'read', 'project'),
    ('lead', 'task', 'update', 'project'),
    ('lead', 'member', 'read', 'project'),
    ('lead', 'sprint', 'read', 'project'),
    ('lead', 'sprint', 'update', 'project'),

    -- Member (Level 3)
    ('member', 'project', 'read', 'project'),
    ('member', 'task', 'create', 'project'),
    ('member', 'task', 'read', 'project'),
    ('member', 'task', 'update', 'own'),
    ('member', 'member', 'read', 'project'),
    ('member', 'sprint', 'read', 'project'),

    -- Viewer (Level 2)
    ('viewer', 'project', 'read', 'project'),
    ('viewer', 'task', 'read', 'project'),
    ('viewer', 'member', 'read', 'project'),
    ('viewer', 'sprint', 'read', 'project'),

    -- Agent (Level 1)
    ('agent', 'project', 'read', 'project'),
    ('agent', 'task', 'create', 'project'),
    ('agent', 'task', 'read', 'project'),
    ('agent', 'task', 'update', 'own'),
    ('agent', 'sprint', 'read', 'project')
ON CONFLICT (role, resource, action) DO NOTHING;

-- =============================
-- STEP 22: PERMISSION FUNCTIONS
-- =============================

-- Get effective role for a user in a project
CREATE OR REPLACE FUNCTION get_effective_role(
    p_user_id UUID,
    p_project_id UUID
)
RETURNS user_role AS $$
DECLARE
    v_org_role user_role;
    v_project_role user_role;
BEGIN
    -- Get org role
    SELECT om.org_role INTO v_org_role
    FROM archon_org_memberships om
    WHERE om.user_id = p_user_id
      AND om.status = 'active'
    ORDER BY role_level(om.org_role) DESC
    LIMIT 1;

    -- Get project role
    SELECT pm.project_role INTO v_project_role
    FROM archon_project_memberships pm
    WHERE pm.user_id = p_user_id
      AND pm.project_id = p_project_id;

    -- Return higher role
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

-- Check if user has permission
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
    v_effective_role := get_effective_role(p_user_id, p_project_id);

    IF v_effective_role IS NULL THEN
        RETURN FALSE;
    END IF;

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

-- Auto-expire invitations
CREATE OR REPLACE FUNCTION auto_expire_invitations()
RETURNS void AS $$
BEGIN
    UPDATE archon_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM archon_user_sessions
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================
-- STEP 23: ANALYTICS VIEWS
-- =============================

-- Sprint capacity summary
CREATE OR REPLACE VIEW sprint_capacity_summary AS
SELECT
    s.id AS sprint_id,
    s.project_id,
    s.name AS sprint_name,
    s.status AS sprint_status,
    s.capacity_hours,
    COALESCE(SUM(t.story_points), 0) AS total_story_points,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'doing') AS active_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('backlog', 'todo')) AS pending_tasks
FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = false
GROUP BY s.id, s.project_id, s.name, s.status, s.capacity_hours;

-- Current sprint burndown
CREATE OR REPLACE VIEW current_sprint_burndown AS
SELECT
    s.id as sprint_id,
    s.project_id,
    s.name as sprint_name,
    s.start_date,
    s.end_date,
    s.capacity_hours,
    COUNT(t.id) FILTER (WHERE t.status != 'done') as remaining_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status != 'done'), 0) as remaining_points,
    COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0) as completed_points,
    COUNT(t.id) as total_tasks,
    COALESCE(SUM(t.story_points), 0) as total_points,
    CASE
        WHEN COUNT(t.id) > 0 THEN
            ROUND((COUNT(t.id) FILTER (WHERE t.status = 'done')::DECIMAL / COUNT(t.id)) * 100, 2)
        ELSE 0
    END as progress_percentage
FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id AND t.archived = false
WHERE s.status = 'active'
GROUP BY s.id, s.project_id, s.name, s.start_date, s.end_date, s.capacity_hours;

-- Project velocity summary
CREATE OR REPLACE VIEW project_velocity_summary AS
SELECT
    p.id as project_id,
    p.title as project_name,
    COUNT(DISTINCT vh.sprint_id) as sprints_completed,
    ROUND(AVG(vh.velocity_points), 2) as avg_velocity_points,
    ROUND(AVG(vh.completion_rate), 2) as avg_completion_rate,
    ROUND(AVG(vh.velocity_points) FILTER (
        WHERE vh.created_at >= NOW() - INTERVAL '90 days'
    ), 2) as recent_velocity_points
FROM archon_projects p
LEFT JOIN archon_velocity_history vh ON vh.project_id = p.id
GROUP BY p.id, p.title;

-- =============================
-- STEP 24: ROW LEVEL SECURITY (RLS)
-- =============================

-- Enable RLS on all tables
ALTER TABLE archon_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_code_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_page_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_crawled_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_project_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_sprint_burndown ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_velocity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_member_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_team_velocity ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_agent_task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_agent_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_migrations ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'archon_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', table_name);
        EXECUTE format('CREATE POLICY "Service role full access" ON %I FOR ALL USING (auth.role() = ''service_role'')', table_name);
    END LOOP;
END $$;

-- Authenticated users can read most tables (except sensitive ones)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'archon_%'
        AND tablename NOT IN ('archon_settings', 'archon_notifications', 'archon_user_sessions', 'archon_api_keys')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated read access" ON %I', table_name);
        EXECUTE format('CREATE POLICY "Authenticated read access" ON %I FOR SELECT TO authenticated USING (true)', table_name);
    END LOOP;
END $$;

-- =============================
-- =============================
-- STEP 25a: SEED GLOBAL AGENT USERS
-- These system users allow the task dispatcher to post comments
-- automatically when tasks are assigned to "Coding Agent" or "Archon".
-- The server creates them on startup too (idempotent), so this is a
-- safety net for fresh database installations.
-- =============================

INSERT INTO archon_users_profile (id, email, display_name, user_type, status)
VALUES
    ('00000000-0000-0000-0000-000000000010'::uuid, 'coding-agent@system.internal', 'Coding Agent', 'agent', 'active'),
    ('00000000-0000-0000-0000-000000000011'::uuid, 'archon-agent@system.internal', 'Archon', 'agent', 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================
-- STEP 25: RECORD MIGRATION
-- =============================

INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', 'COMPLETE_DATABASE_SETUP_PRODUCTION')
ON CONFLICT DO NOTHING;

-- =============================
-- SUCCESS MESSAGE
-- =============================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '         10x PROJECT MANAGEMENT - SETUP COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created 41 database tables:';
    RAISE NOTICE '';
    RAISE NOTICE 'USER MANAGEMENT (12 tables):';
    RAISE NOTICE '  ✅ archon_users_profile';
    RAISE NOTICE '  ✅ archon_organizations';
    RAISE NOTICE '  ✅ archon_departments';
    RAISE NOTICE '  ✅ archon_teams';
    RAISE NOTICE '  ✅ archon_org_memberships';
    RAISE NOTICE '  ✅ archon_project_memberships';
    RAISE NOTICE '  ✅ archon_permissions';
    RAISE NOTICE '  ✅ archon_role_assignments';
    RAISE NOTICE '  ✅ archon_invitations';
    RAISE NOTICE '  ✅ archon_user_sessions';
    RAISE NOTICE '  ✅ archon_api_keys';
    RAISE NOTICE '  ✅ archon_user_activity_log';
    RAISE NOTICE '';
    RAISE NOTICE 'KNOWLEDGE BASE (6 tables):';
    RAISE NOTICE '  ✅ archon_settings';
    RAISE NOTICE '  ✅ archon_sources';
    RAISE NOTICE '  ✅ archon_documents (with vector embeddings)';
    RAISE NOTICE '  ✅ archon_code_examples (with tsvector search)';
    RAISE NOTICE '  ✅ archon_page_metadata';
    RAISE NOTICE '  ✅ archon_crawled_pages (with tsvector search)';
    RAISE NOTICE '';
    RAISE NOTICE 'PROJECT MANAGEMENT (7 tables):';
    RAISE NOTICE '  ✅ archon_projects';
    RAISE NOTICE '  ✅ archon_project_sources';
    RAISE NOTICE '  ✅ archon_sprints';
    RAISE NOTICE '  ✅ archon_tasks';
    RAISE NOTICE '  ✅ archon_task_dependencies';
    RAISE NOTICE '  ✅ archon_task_status_history';
    RAISE NOTICE '  ✅ archon_task_comments';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTIFICATIONS (3 tables):';
    RAISE NOTICE '  ✅ archon_notifications';
    RAISE NOTICE '  ✅ archon_notification_preferences';
    RAISE NOTICE '  ✅ archon_notification_history';
    RAISE NOTICE '';
    RAISE NOTICE 'ANALYTICS (4 tables):';
    RAISE NOTICE '  ✅ archon_sprint_burndown';
    RAISE NOTICE '  ✅ archon_velocity_history';
    RAISE NOTICE '  ✅ archon_member_performance';
    RAISE NOTICE '  ✅ archon_daily_metrics';
    RAISE NOTICE '';
    RAISE NOTICE 'AI INTEGRATION (3 tables):';
    RAISE NOTICE '  ✅ archon_ai_suggestions';
    RAISE NOTICE '  ✅ archon_ai_learning_data';
    RAISE NOTICE '  ✅ archon_team_velocity';
    RAISE NOTICE '';
    RAISE NOTICE 'DOCUMENTS & WORKFLOWS (5 tables):';
    RAISE NOTICE '  ✅ archon_document_versions';
    RAISE NOTICE '  ✅ archon_task_acknowledgements';
    RAISE NOTICE '  ✅ archon_agent_task_reviews';
    RAISE NOTICE '  ✅ archon_agent_webhooks';
    RAISE NOTICE '  ✅ archon_prompts';
    RAISE NOTICE '';
    RAISE NOTICE 'SYSTEM (1 table):';
    RAISE NOTICE '  ✅ archon_migrations';
    RAISE NOTICE '';
    RAISE NOTICE 'Also created:';
    RAISE NOTICE '  ✅ 8 ENUMs (user_role, notification_type, ai_suggestion_type, etc.)';
    RAISE NOTICE '  ✅ 3 Analytics Views (sprint_capacity, burndown, velocity)';
    RAISE NOTICE '  ✅ 9 Database Functions (permissions, notifications, auto-expire)';
    RAISE NOTICE '  ✅ 15+ Auto-update Triggers';
    RAISE NOTICE '  ✅ Full-text Search (tsvector + trigram indexes)';
    RAISE NOTICE '  ✅ Vector Search (pgvector with 1536 dimensions)';
    RAISE NOTICE '  ✅ Row Level Security (RLS) on all tables';
    RAISE NOTICE '  ✅ Default permission matrix (7 roles × 4 actions)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update .env with your Supabase credentials';
    RAISE NOTICE '  2. Run: docker compose up -d';
    RAISE NOTICE '  3. Open: http://localhost:3737';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
END $$;
