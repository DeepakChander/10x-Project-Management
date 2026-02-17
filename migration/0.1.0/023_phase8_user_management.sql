-- ============================================================================
-- Phase 8: User Management & Invitations
-- Version: 0.1.0
-- Description: Invitation system, user onboarding, and authentication
-- ============================================================================

-- ── Invitation Status Enum ─────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM (
        'pending',   -- Sent, waiting for acceptance
        'accepted',  -- User clicked link, account created
        'expired',   -- 7 days passed without acceptance
        'revoked'    -- Cancelled by admin before acceptance
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Invitations Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization context
    org_id UUID NOT NULL REFERENCES archon_organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES archon_teams(id) ON DELETE SET NULL,
    department_id UUID REFERENCES archon_departments(id) ON DELETE SET NULL,

    -- Invitation details
    email TEXT NOT NULL,
    invited_role user_role NOT NULL,
    invited_by UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Invite link
    invite_token TEXT UNIQUE NOT NULL,  -- Secure random token for link
    invite_link TEXT NOT NULL,  -- Full URL with token

    -- Status
    status invitation_status NOT NULL DEFAULT 'pending',

    -- Acceptance tracking
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,  -- 7 days from creation

    -- Optional message
    personal_message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT check_expires_at CHECK (expires_at > created_at)
);

-- ── User Sessions (for authentication) ─────────────────────────
CREATE TABLE IF NOT EXISTS archon_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Session details
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,

    -- Device/location info
    user_agent TEXT,
    ip_address INET,
    device_name TEXT,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── API Keys (for agents and programmatic access) ──────────────
CREATE TABLE IF NOT EXISTS archon_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Key details
    key_name TEXT NOT NULL,  -- User-friendly name
    key_hash TEXT UNIQUE NOT NULL,  -- Hashed API key
    key_prefix TEXT NOT NULL,  -- First 8 chars for identification

    -- For AI agents
    is_agent_key BOOLEAN DEFAULT FALSE,
    agent_capabilities JSONB DEFAULT '{}',
    supervisor_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,

    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 100,
    requests_today INTEGER DEFAULT 0,
    last_request_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Expiration
    expires_at TIMESTAMPTZ,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    total_requests INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT check_supervisor CHECK (
        NOT is_agent_key OR supervisor_id IS NOT NULL
    )
);

-- ── User Activity Log (for audit) ──────────────────────────────
CREATE TABLE IF NOT EXISTS archon_user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    org_id UUID REFERENCES archon_organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,

    -- Action details
    action_type TEXT NOT NULL,  -- 'login', 'task_created', 'role_changed', etc.
    action_description TEXT NOT NULL,

    -- Context
    resource_type TEXT,  -- 'task', 'project', 'sprint', etc.
    resource_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Request info
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invitations_email ON archon_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON archon_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON archon_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON archon_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON archon_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON archon_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON archon_user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON archon_user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON archon_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON archon_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON archon_api_keys(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON archon_user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON archon_user_activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON archon_user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON archon_user_activity_log(action_type);

-- ── Auto-expire invitations function ───────────────────────────
CREATE OR REPLACE FUNCTION auto_expire_invitations()
RETURNS void AS $$
BEGIN
    UPDATE archon_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ── Auto-cleanup expired sessions ──────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM archon_user_sessions
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to invitations" ON archon_invitations;
CREATE POLICY "Service role full access to invitations"
    ON archon_invitations FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to sessions" ON archon_user_sessions;
CREATE POLICY "Service role full access to sessions"
    ON archon_user_sessions FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to api keys" ON archon_api_keys;
CREATE POLICY "Service role full access to api keys"
    ON archon_api_keys FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to activity log" ON archon_user_activity_log;
CREATE POLICY "Service role full access to activity log"
    ON archon_user_activity_log FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '023_phase8_user_management')
ON CONFLICT DO NOTHING;
