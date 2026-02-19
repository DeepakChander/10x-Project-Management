-- ============================================================================
-- RLS Policies for org-isolated tables + shared trigger function
-- Version: 0.1.0
-- Description: Adds Row Level Security policies to enforce data isolation
--              for archon_projects (org-level) and archon_user_agent_config
--              (user-level). Supabase service role bypasses RLS automatically.
--              Also ensures update_updated_at_column() trigger function exists
--              (required by migrations 014–033 which use it but don't define it).
-- ============================================================================

-- ── Shared trigger function (idempotent) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── archon_projects: org isolation ──────────────────────────────────────────
-- Enable RLS (idempotent)
ALTER TABLE archon_projects ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (safe re-run)
DROP POLICY IF EXISTS projects_org_isolation ON archon_projects;
DROP POLICY IF EXISTS projects_service_role ON archon_projects;

-- Service role (used by backend) bypasses RLS automatically via Supabase.
-- This policy covers any direct Postgres role access via app_user or similar.
CREATE POLICY projects_org_isolation ON archon_projects
    FOR ALL
    USING (
        -- Allow if org_id matches current user's org OR org_id is null (legacy)
        org_id IS NULL
        OR org_id IN (
            SELECT org_id FROM archon_org_memberships
            WHERE user_id = current_setting('app.user_id', true)::uuid
              AND status = 'active'
        )
    );


-- ── archon_user_agent_config: per-user isolation ────────────────────────────
ALTER TABLE archon_user_agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_agent_config_owner_only ON archon_user_agent_config;

CREATE POLICY user_agent_config_owner_only ON archon_user_agent_config
    FOR ALL
    USING (user_id = current_setting('app.user_id', true)::uuid);


-- ── Record migration ─────────────────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '037_rls_policies')
ON CONFLICT DO NOTHING;
