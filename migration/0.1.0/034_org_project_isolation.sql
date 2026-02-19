-- Migration 034: Add org_id to archon_projects for organization-level project isolation
-- Projects without an org_id remain accessible without org filter (backward compat)

ALTER TABLE archon_projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES archon_organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_org ON archon_projects(org_id);

INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '034_org_project_isolation')
ON CONFLICT DO NOTHING;
