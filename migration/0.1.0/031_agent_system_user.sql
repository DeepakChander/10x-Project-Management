-- Migration 031: Seed system agent user
-- Creates a global "Coding Agent" user in archon_users_profile.
-- This user is referenced when the agent posts task comments.
-- The fixed UUID ensures consistent behavior across all org setups.

-- Insert the global Coding Agent system user (user_type = 'agent')
INSERT INTO archon_users_profile (id, email, display_name, user_type, status)
VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'coding-agent@system.internal',
    'Coding Agent',
    'agent',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Also seed the "Archon" agent (same system)
INSERT INTO archon_users_profile (id, email, display_name, user_type, status)
VALUES (
    '00000000-0000-0000-0000-000000000011'::uuid,
    'archon-agent@system.internal',
    'Archon',
    'agent',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Record this migration
INSERT INTO archon_migrations (version, name, applied_at)
VALUES ('0.1.0', '031_agent_system_user', NOW())
ON CONFLICT (version, name) DO NOTHING;
