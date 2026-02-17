-- ============================================================================
-- Add Password Authentication
-- Version: 0.1.0
-- Description: Add password hash column and login functionality
-- ============================================================================

-- Add password_hash column to users
DO $$
BEGIN
    ALTER TABLE archon_users_profile
    ADD COLUMN password_hash TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add last_login tracking
DO $$
BEGIN
    ALTER TABLE archon_users_profile
    ADD COLUMN last_login_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create index on email for login lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_email_login
ON archon_users_profile(email)
WHERE password_hash IS NOT NULL;

-- Track migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '024_add_password_auth')
ON CONFLICT DO NOTHING;
