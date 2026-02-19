-- Migration 036: Per-user AI agent configuration
-- Stores each user's personal LLM API key for the unified "10x Agent"
-- API key is stored Fernet-encrypted using the same method as credential_service.py

CREATE TABLE IF NOT EXISTS archon_user_agent_config (
  user_id UUID PRIMARY KEY REFERENCES archon_users_profile(id) ON DELETE CASCADE,
  llm_provider TEXT NOT NULL DEFAULT 'openai',
  api_key TEXT,
  model TEXT DEFAULT 'openai:gpt-4o-mini',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '036_user_agent_config')
ON CONFLICT DO NOTHING;
