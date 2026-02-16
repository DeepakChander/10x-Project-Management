-- ============================================================================
-- Phase 5: AI Integration
-- Version: 0.1.0
-- Description: AI-powered features for task estimation and sprint planning
-- ============================================================================

-- ── AI Suggestion Type Enum ─────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE ai_suggestion_type AS ENUM (
        'task_estimation',      -- Story points + duration prediction
        'sprint_planning',      -- Which tasks for next sprint
        'priority_suggestion',  -- Task priority recommendation
        'dependency_detection', -- Implicit dependency detection
        'capacity_warning'      -- Sprint capacity alerts
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── AI Suggestions Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,

    -- Suggestion details
    type ai_suggestion_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),  -- 0.0 to 1.0

    -- Suggested values (JSONB for flexibility)
    suggestion_data JSONB NOT NULL DEFAULT '{}',
    -- Examples:
    -- {"story_points": 5, "duration_hours": 8, "reasoning": "..."}
    -- {"tasks_to_include": ["task-id-1", "task-id-2"], "reasoning": "..."}
    -- {"priority": "high", "reasoning": "..."}

    -- User action
    accepted BOOLEAN DEFAULT NULL,  -- NULL = pending, true = accepted, false = rejected
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,

    -- Metadata
    model_used TEXT,  -- e.g., "gpt-4", "claude-3-sonnet"
    prompt_tokens INTEGER,
    completion_tokens INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── AI Learning Data (for improvement) ──────────────────────────
CREATE TABLE IF NOT EXISTS archon_ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What was predicted
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    predicted_story_points INTEGER,
    predicted_duration_hours INTEGER,
    predicted_priority TEXT,

    -- What actually happened
    actual_story_points INTEGER,
    actual_duration_hours INTEGER,
    actual_priority TEXT,

    -- Accuracy metrics
    estimation_error DECIMAL(5,2),  -- Percentage error

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- ── Team Velocity Tracking ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS archon_team_velocity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES archon_projects(id) ON DELETE CASCADE,
    sprint_id UUID NOT NULL REFERENCES archon_sprints(id) ON DELETE CASCADE,

    -- Velocity metrics
    planned_story_points INTEGER NOT NULL DEFAULT 0,
    completed_story_points INTEGER NOT NULL DEFAULT 0,
    planned_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,

    -- Team composition (for capacity calculation)
    team_size INTEGER DEFAULT 1,
    sprint_days INTEGER DEFAULT 10,
    hours_per_day DECIMAL(4,2) DEFAULT 6.0,

    -- Calculated fields
    velocity_points_per_sprint DECIMAL(6,2),  -- Avg story points per sprint
    velocity_tasks_per_sprint DECIMAL(6,2),   -- Avg tasks per sprint

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(project_id, sprint_id)
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_project ON archon_ai_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_task ON archon_ai_suggestions(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_sprint ON archon_ai_suggestions(sprint_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON archon_ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_pending ON archon_ai_suggestions(accepted) WHERE accepted IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_learning_task ON archon_ai_learning_data(task_id);
CREATE INDEX IF NOT EXISTS idx_team_velocity_project ON archon_team_velocity(project_id);
CREATE INDEX IF NOT EXISTS idx_team_velocity_sprint ON archon_team_velocity(sprint_id);

-- ── Auto-update timestamp trigger ───────────────────────────────
CREATE TRIGGER update_team_velocity_updated_at
    BEFORE UPDATE ON archon_team_velocity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE archon_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_team_velocity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to ai suggestions" ON archon_ai_suggestions;
CREATE POLICY "Service role full access to ai suggestions"
    ON archon_ai_suggestions FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai learning data" ON archon_ai_learning_data;
CREATE POLICY "Service role full access to ai learning data"
    ON archon_ai_learning_data FOR ALL
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to team velocity" ON archon_team_velocity;
CREATE POLICY "Service role full access to team velocity"
    ON archon_team_velocity FOR ALL
    USING (auth.role() = 'service_role');

-- ── Track migration ─────────────────────────────────────────────
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '019_phase5_ai_integration')
ON CONFLICT DO NOTHING;
