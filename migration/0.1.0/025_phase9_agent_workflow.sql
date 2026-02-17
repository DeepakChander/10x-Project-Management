-- ============================================================================
-- Phase 9: AI Agent Acknowledgement Workflow
-- Version: 0.1.0
-- Description: Agent webhooks, task acknowledgement, and review workflow
-- ============================================================================

-- ── Agent Webhook Registration ─────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_agent_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Webhook details
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT,  -- For signature verification

    -- Event subscriptions
    events TEXT[] DEFAULT '{"task_assigned", "task_updated", "sprint_started"}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_delivery_at TIMESTAMPTZ,
    failed_deliveries INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(agent_id, webhook_url)
);

-- ── Task Acknowledgements (Agent Responses) ────────────────────
CREATE TABLE IF NOT EXISTS archon_task_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Acknowledgement details
    status TEXT NOT NULL CHECK (status IN ('acknowledged', 'accepted', 'declined', 'submitted_for_review')),
    response_time_ms INTEGER,  -- Time from assignment to acknowledgement

    -- Accept/Decline details
    decline_reason TEXT,  -- Why agent declined
    conditions TEXT,  -- For conditional acceptance
    agent_message TEXT,  -- Agent's response message

    -- Submission details (for review)
    submission_data JSONB,  -- Work output from agent
    confidence_score DECIMAL(3,2),  -- Agent's confidence (0.0-1.0)
    flagged_items JSONB DEFAULT '[]',  -- Items needing human review

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Agent Task Reviews (Supervisor Approval) ───────────────────
CREATE TABLE IF NOT EXISTS archon_agent_task_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES archon_tasks(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Review decision
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_revision')),
    review_comments TEXT,

    -- Flagged items from agent
    flagged_items_reviewed JSONB,
    corrections_made JSONB,

    -- Quality metrics
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),

    reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Webhook Delivery Log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES archon_agent_webhooks(id) ON DELETE CASCADE,

    -- Delivery details
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,

    -- Response
    status_code INTEGER,
    response_body TEXT,
    error_message TEXT,

    -- Timing
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_agent ON archon_agent_webhooks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_webhooks_active ON archon_agent_webhooks(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_task_ack_task ON archon_task_acknowledgements(task_id);
CREATE INDEX IF NOT EXISTS idx_task_ack_agent ON archon_task_acknowledgements(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_ack_status ON archon_task_acknowledgements(status);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_task ON archon_agent_task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent ON archon_agent_task_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_reviewer ON archon_agent_task_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON archon_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON archon_webhook_deliveries(event_type);

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_agent_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_task_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_agent_task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to agent webhooks" ON archon_agent_webhooks;
CREATE POLICY "Service role full access to agent webhooks"
    ON archon_agent_webhooks FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to task acks" ON archon_task_acknowledgements;
CREATE POLICY "Service role full access to task acks"
    ON archon_task_acknowledgements FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to agent reviews" ON archon_agent_task_reviews;
CREATE POLICY "Service role full access to agent reviews"
    ON archon_agent_task_reviews FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to webhook deliveries" ON archon_webhook_deliveries;
CREATE POLICY "Service role full access to webhook deliveries"
    ON archon_webhook_deliveries FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '025_phase9_agent_workflow')
ON CONFLICT DO NOTHING;
