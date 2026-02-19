-- ============================================================================
-- Fix: Agent Workflow UUID vs TEXT Mismatch
-- Version: 0.1.0
-- Description: Change agent_id from UUID to TEXT to match task assignee field
-- ============================================================================

-- The issue: archon_tasks.assignee is TEXT (can be "User", "Archon", agent names, or UUIDs)
-- But agent workflow tables use UUID with foreign key constraints
-- This causes failures when workflows try to use assignee values like "Archon" or "User"

-- Fix 1: Drop foreign key constraints and change agent_id to TEXT in acknowledgements table
ALTER TABLE archon_task_acknowledgements
DROP CONSTRAINT IF EXISTS archon_task_acknowledgements_agent_id_fkey;

ALTER TABLE archon_task_acknowledgements
ALTER COLUMN agent_id TYPE TEXT USING agent_id::TEXT;

-- Fix 2: Drop foreign key constraints and change agent_id to TEXT in reviews table
ALTER TABLE archon_agent_task_reviews
DROP CONSTRAINT IF EXISTS archon_agent_task_reviews_agent_id_fkey;

ALTER TABLE archon_agent_task_reviews
ALTER COLUMN agent_id TYPE TEXT USING agent_id::TEXT;

-- Fix 3: Drop foreign key constraints and change agent_id to TEXT in webhooks table
ALTER TABLE archon_agent_webhooks
DROP CONSTRAINT IF EXISTS archon_agent_webhooks_agent_id_fkey;

ALTER TABLE archon_agent_webhooks
ALTER COLUMN agent_id TYPE TEXT USING agent_id::TEXT;

-- Update indexes to work with TEXT instead of UUID
DROP INDEX IF EXISTS idx_task_ack_agent;
CREATE INDEX IF NOT EXISTS idx_task_ack_agent ON archon_task_acknowledgements(agent_id);

DROP INDEX IF EXISTS idx_agent_reviews_agent;
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent ON archon_agent_task_reviews(agent_id);

DROP INDEX IF EXISTS idx_agent_webhooks_agent;
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_agent ON archon_agent_webhooks(agent_id);

-- Ensure archon_migrations table exists before tracking
CREATE TABLE IF NOT EXISTS archon_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(32),
  UNIQUE(version, migration_name)
);

-- Track migration
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '027_fix_agent_workflow_uuid_mismatch')
ON CONFLICT DO NOTHING;
