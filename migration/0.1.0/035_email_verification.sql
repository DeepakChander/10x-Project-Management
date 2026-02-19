-- Migration 035: Email verification system
-- Adds email_verified flag to users and a token table for secure email confirmation links

ALTER TABLE archon_users_profile
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS archon_email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verify_token ON archon_email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verify_user ON archon_email_verification_tokens(user_id);

INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '035_email_verification')
ON CONFLICT DO NOTHING;
