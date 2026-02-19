-- ============================================================================
-- AI Self-Learning Module — 9 Knowledge Store Tables
-- Version: 0.1.0
-- Description: Powers the AI intelligence system that learns from every
--              project, task, and decision your organization makes.
--
-- Tables created:
--   ai_project_templates    - Learned project patterns from past projects
--   ai_task_blueprints      - Task patterns per template
--   ai_dependency_patterns  - What blocks what (learned from past)
--   ai_duration_estimates   - Per-person/team/complexity durations
--   ai_team_intelligence    - Skills, WIP, velocity, collaboration maps
--   ai_quality_patterns     - Review rejection reasons + prevention tips
--   ai_feedback_loop        - What users accepted/modified/rejected
--   ai_observations         - Raw events before pattern extraction
--   ai_model_accuracy       - AI improvement tracking over time
-- ============================================================================

-- ── Add task_type column to archon_tasks for pattern learning ───────────────
-- Stores the semantic type of a task (e.g. "blog_post", "design_mockup")
-- Used by the AI to learn duration and quality patterns per task type.
ALTER TABLE archon_tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
CREATE INDEX IF NOT EXISTS idx_archon_tasks_task_type ON archon_tasks(task_type);

-- ── Extend ai_suggestion_type enum with self-learning types ─────────────────
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'project_setup';     -- Magic Moment: full project task suggestion
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'task_blueprint';    -- Suggest subtasks/duration from blueprint
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'team_assignment';   -- Skill-matched assignee recommendation
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'stall_warning';     -- Task taking longer than average
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'quality_tip';       -- Rejection pattern detected
ALTER TYPE ai_suggestion_type ADD VALUE IF NOT EXISTS 'retrospective';     -- Post-project summary and learnings


-- ============================================================================
-- 1. ai_project_templates
--    Learned project structures built from past completed projects.
--    Each template captures the typical phases, durations, team size,
--    risks, and success rates for a given project category.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,                             -- "Marketing Campaign"
    description TEXT,                               -- What this template is for
    category TEXT NOT NULL,                         -- "marketing", "engineering", "design"
    tags TEXT[] DEFAULT '{}',                       -- ["campaign", "content", "social", "brand"]

    -- Source projects this template was learned from
    learned_from_projects UUID[] DEFAULT '{}',      -- Array of archon_projects.id
    sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),

    -- Typical structure
    -- [{name: "Research", duration_days: 3, avg_task_count: 3, frequency: 1.0}]
    typical_phases JSONB DEFAULT '[]',

    -- Duration range
    typical_duration_days_min INTEGER,
    typical_duration_days_max INTEGER,

    -- Task count range
    typical_task_count_min INTEGER,
    typical_task_count_max INTEGER,

    -- Team size range
    typical_team_size_min INTEGER,
    typical_team_size_max INTEGER,

    -- Risk factors learned from past projects
    -- [{description: "Legal review adds 2–5 days", occurrence_rate: 0.6}]
    risk_factors JSONB DEFAULT '[]',

    -- Success metrics
    success_rate DECIMAL(5,2) CHECK (success_rate >= 0 AND success_rate <= 100),  -- % on-time delivery

    -- Confidence system (0.0 = no data, 0.95 = expert)
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),
    auto_generated BOOLEAN DEFAULT TRUE,    -- false = user-created template

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_project_templates_category ON ai_project_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_project_templates_confidence ON ai_project_templates(confidence);
CREATE INDEX IF NOT EXISTS idx_ai_project_templates_tags ON ai_project_templates USING GIN(tags);

CREATE TRIGGER update_ai_project_templates_updated_at
    BEFORE UPDATE ON ai_project_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 2. ai_task_blueprints
--    Individual task patterns linked to a project template.
--    Captures what tasks typically appear in which project type,
--    how long they take, who should do them, and whether an AI agent
--    can handle them reliably.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_task_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent template (nullable — blueprint can exist without a template)
    template_id UUID REFERENCES ai_project_templates(id) ON DELETE CASCADE,

    -- Task identity
    phase TEXT NOT NULL,                            -- "Content Creation"
    task_title TEXT NOT NULL,                       -- "Write blog post"
    task_type TEXT NOT NULL,                        -- "blog_post", "research", "design_mockup"
    category TEXT NOT NULL,                         -- "content_creation", "research", "design"

    -- Typical properties
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    avg_duration_days DECIMAL(6,2),
    frequency DECIMAL(3,2) CHECK (frequency >= 0 AND frequency <= 1),  -- 0.90 = appears in 90% of projects

    -- Who typically does this task
    typical_skills TEXT[] DEFAULT '{}',             -- ["writing", "seo"]
    typical_assignee_role TEXT,                     -- "member", "lead", "agent"

    -- Subtasks and definition of done
    suggested_subtasks TEXT[] DEFAULT '{}',         -- ["Analyze competitors", "Survey demographics"]
    success_criteria TEXT,                          -- "Research doc approved by lead"
    common_blockers TEXT[] DEFAULT '{}',            -- ["No access to analytics tool"]

    -- AI agent suitability
    agent_suitable BOOLEAN DEFAULT FALSE,
    agent_confidence DECIMAL(3,2) CHECK (agent_confidence >= 0 AND agent_confidence <= 1),
    agent_avg_duration_minutes INTEGER,             -- how fast agent completes it

    -- Dependencies within the same template (task_type strings, not IDs)
    depends_on TEXT[] DEFAULT '{}',                 -- ["research_target_audience"]

    -- Quality history
    avg_review_cycles DECIMAL(4,2),
    -- [{reason: "Missing SEO keywords", percentage: 0.40, count: 17}]
    common_rejection_reasons JSONB DEFAULT '[]',

    -- Metadata
    sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_task_blueprints_template ON ai_task_blueprints(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_blueprints_task_type ON ai_task_blueprints(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_task_blueprints_category ON ai_task_blueprints(category);
CREATE INDEX IF NOT EXISTS idx_ai_task_blueprints_agent ON ai_task_blueprints(agent_suitable) WHERE agent_suitable = TRUE;

CREATE TRIGGER update_ai_task_blueprints_updated_at
    BEFORE UPDATE ON ai_task_blueprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 3. ai_dependency_patterns
--    Learned dependency relationships between task types.
--    Tracks how often one task type blocks another, how long the wait
--    is, and whether they could safely run in parallel.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_dependency_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent template
    template_id UUID REFERENCES ai_project_templates(id) ON DELETE CASCADE,

    -- The dependency relationship (task types, not task IDs)
    from_task_type TEXT NOT NULL,                   -- "content_strategy" (the blocker)
    to_task_type TEXT NOT NULL,                     -- "blog_writing" (the blocked task)

    -- How often this dependency exists in real projects
    frequency DECIMAL(3,2) NOT NULL CHECK (frequency >= 0 AND frequency <= 1),
    avg_wait_days DECIMAL(6,2),                     -- how long blocked task waits on average

    -- Optimization opportunities
    parallel_possible BOOLEAN DEFAULT FALSE,        -- can they overlap?
    parallel_overlap_days DECIMAL(6,2),             -- days of safe overlap if parallel
    optimization_note TEXT,                         -- "Start Design Brief after Content Strategy, not Blog Post"

    -- Critical path flag
    is_critical_path BOOLEAN DEFAULT FALSE,

    -- Metadata
    sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(template_id, from_task_type, to_task_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_dependency_patterns_template ON ai_dependency_patterns(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_dependency_patterns_from ON ai_dependency_patterns(from_task_type);
CREATE INDEX IF NOT EXISTS idx_ai_dependency_patterns_to ON ai_dependency_patterns(to_task_type);
CREATE INDEX IF NOT EXISTS idx_ai_dependency_patterns_critical ON ai_dependency_patterns(is_critical_path) WHERE is_critical_path = TRUE;

CREATE TRIGGER update_ai_dependency_patterns_updated_at
    BEFORE UPDATE ON ai_dependency_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 4. ai_duration_estimates
--    Learned duration data for each task type, broken down by person,
--    team, and complexity. Powers accurate time predictions.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_duration_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task classification
    task_type TEXT NOT NULL,                        -- "blog_post"
    category TEXT NOT NULL,                         -- "content_creation"

    -- Global statistics across all people and teams
    global_avg_days DECIMAL(6,2),
    global_median_days DECIMAL(6,2),
    global_min_days DECIMAL(6,2),
    global_max_days DECIMAL(6,2),

    -- Per-person breakdown
    -- {user_id: {display_name: "Maya", avg_days: 2.5, task_count: 12}}
    by_person JSONB DEFAULT '{}',

    -- Per-complexity breakdown
    -- {"simple": {avg_days: 1.5, description: "500 words"},
    --  "medium": {avg_days: 3.0, description: "1000 words"},
    --  "complex": {avg_days: 5.0, description: "2000+ words"}}
    by_complexity JSONB DEFAULT '{}',

    -- Factors that increase duration
    -- [{factor: "No brief provided", days_added: 1.5, occurrence_rate: 0.3}]
    time_increase_factors JSONB DEFAULT '[]',

    -- Factors that decrease duration
    -- [{factor: "Template available", days_saved: 0.5, occurrence_rate: 0.4}]
    time_decrease_factors JSONB DEFAULT '[]',

    -- Metadata
    sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(task_type, category)
);

CREATE INDEX IF NOT EXISTS idx_ai_duration_estimates_task_type ON ai_duration_estimates(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_duration_estimates_category ON ai_duration_estimates(category);

CREATE TRIGGER update_ai_duration_estimates_updated_at
    BEFORE UPDATE ON ai_duration_estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 5. ai_team_intelligence
--    One row per team member. Tracks skills, capacity, work patterns,
--    collaboration preferences, and quality trends over time.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_team_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The team member this profile belongs to
    person_id UUID NOT NULL REFERENCES archon_users_profile(id) ON DELETE CASCADE,

    -- Skills profile
    skills_strong TEXT[] DEFAULT '{}',              -- Fast, high quality: ["blog_writing", "social_copy"]
    skills_learning TEXT[] DEFAULT '{}',            -- Improving: ["seo_optimization"]
    skills_avoid TEXT[] DEFAULT '{}',               -- Not suited: ["technical_writing"]

    -- Capacity
    optimal_wip INTEGER DEFAULT 3,                  -- Best number of concurrent tasks
    sprint_velocity_min INTEGER,                    -- Tasks per sprint (low end)
    sprint_velocity_max INTEGER,                    -- Tasks per sprint (high end)
    avg_story_points_per_sprint DECIMAL(6,2),

    -- Work patterns (derived from task completion timestamps)
    peak_hours_start INTEGER CHECK (peak_hours_start >= 0 AND peak_hours_start <= 23),
    peak_hours_end INTEGER CHECK (peak_hours_end >= 0 AND peak_hours_end <= 23),
    preferred_task_types TEXT[] DEFAULT '{}',       -- Task types they do well and enjoy

    -- Collaboration map (arrays of user IDs)
    works_well_with UUID[] DEFAULT '{}',            -- Who they collaborate best with
    frequent_reviewers UUID[] DEFAULT '{}',         -- Who most often reviews their work
    mentors UUID[] DEFAULT '{}',                    -- Who they learn from

    -- Quality metrics
    first_review_approval_rate DECIMAL(5,2) CHECK (first_review_approval_rate >= 0 AND first_review_approval_rate <= 100),
    avg_review_cycles DECIMAL(4,2),
    common_feedback_themes TEXT[] DEFAULT '{}',     -- Recurring reviewer feedback
    quality_trend TEXT DEFAULT 'stable' CHECK (quality_trend IN ('improving', 'stable', 'declining')),

    -- Preferences
    prefers_detailed_briefs BOOLEAN DEFAULT FALSE,
    prefers_subtasks BOOLEAN DEFAULT FALSE,

    -- Metadata
    data_points INTEGER DEFAULT 0 CHECK (data_points >= 0),     -- Total tasks analyzed
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(person_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_team_intelligence_person ON ai_team_intelligence(person_id);
CREATE INDEX IF NOT EXISTS idx_ai_team_intelligence_confidence ON ai_team_intelligence(confidence);

CREATE TRIGGER update_ai_team_intelligence_updated_at
    BEFORE UPDATE ON ai_team_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 6. ai_quality_patterns
--    Tracks why tasks get rejected during review, aggregated by task type.
--    Used to proactively suggest checklists and improvements before
--    tasks are submitted for review.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_quality_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task classification
    task_type TEXT NOT NULL,                        -- "blog_post"
    category TEXT NOT NULL,                         -- "content_creation"

    -- Rejection analysis (sorted by frequency, highest first)
    -- [{reason: "Missing SEO keywords", percentage: 40, count: 17}]
    rejection_reasons JSONB DEFAULT '[]',

    -- Actionable prevention tips
    prevention_tips TEXT[] DEFAULT '{}',            -- ["Add SEO keyword checklist to task description"]

    -- What makes tasks succeed on first review
    success_factors TEXT[] DEFAULT '{}',            -- ["Detailed brief provided", "Template used"]

    -- Before/after data for interventions
    -- {intervention: "Added SEO checklist", before_rate: 0.40, after_rate: 0.26, improvement: 0.35}
    impact_data JSONB DEFAULT '{}',

    -- Aggregate counters
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    total_rejections INTEGER DEFAULT 0 CHECK (total_rejections >= 0),
    rejection_rate DECIMAL(5,2) CHECK (rejection_rate >= 0 AND rejection_rate <= 100),

    -- Metadata
    sample_size INTEGER DEFAULT 0 CHECK (sample_size >= 0),
    confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 0.95),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(task_type, category)
);

CREATE INDEX IF NOT EXISTS idx_ai_quality_patterns_task_type ON ai_quality_patterns(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_quality_patterns_category ON ai_quality_patterns(category);
CREATE INDEX IF NOT EXISTS idx_ai_quality_patterns_rejection_rate ON ai_quality_patterns(rejection_rate);

CREATE TRIGGER update_ai_quality_patterns_updated_at
    BEFORE UPDATE ON ai_quality_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 7. ai_feedback_loop
--    Records exactly what users did with each AI suggestion — what they
--    kept, removed, added, and modified. This is the richest source
--    of learning because every modification teaches the AI something.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_feedback_loop (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What type of suggestion was made
    suggestion_type TEXT NOT NULL,                  -- "task_creation", "sprint_planning", "team_assignment"

    -- What triggered this suggestion
    context JSONB DEFAULT '{}',                     -- {project_title, project_category, team_size, ...}

    -- The full suggestion that was presented
    suggestion_content JSONB DEFAULT '{}',          -- Full suggestion payload

    -- AI's confidence at the time of suggestion
    confidence_at_suggestion DECIMAL(3,2),

    -- How the user responded
    user_response TEXT NOT NULL CHECK (user_response IN ('accepted_all', 'accepted_with_modifications', 'rejected')),
    responded_by UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Breakdown of what happened to each suggested item
    items_suggested INTEGER DEFAULT 0,
    items_kept INTEGER DEFAULT 0,
    -- [{item_title, reason: "Not relevant for internal campaigns"}]
    items_removed JSONB DEFAULT '[]',
    -- [{item_title, item_type}] — things user added that AI didn't suggest
    items_added JSONB DEFAULT '[]',
    -- [{item_title, field_changed, original_value, new_value}]
    items_modified JSONB DEFAULT '[]',

    -- Overall accuracy for this suggestion
    accuracy_score DECIMAL(5,2),                    -- (items_kept / items_suggested) * 100

    -- What the AI learned from this feedback
    -- [{learning: "Remove 'Print materials' from marketing templates", applied_to: "template_id"}]
    learnings_extracted JSONB DEFAULT '[]',
    applied_to_templates UUID[] DEFAULT '{}',       -- Template IDs that were updated

    -- Links to source records
    suggestion_id UUID REFERENCES archon_ai_suggestions(id) ON DELETE SET NULL,
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_loop_suggestion_type ON ai_feedback_loop(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_loop_project ON ai_feedback_loop(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_loop_user_response ON ai_feedback_loop(user_response);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_loop_accuracy ON ai_feedback_loop(accuracy_score);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_loop_created_at ON ai_feedback_loop(created_at DESC);


-- ============================================================================
-- 8. ai_observations
--    Raw event capture — every significant event gets recorded here
--    before being processed into the 6 knowledge stores above.
--    Think of this as an event log that feeds the learning engine.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What kind of event happened
    event_type TEXT NOT NULL CHECK (event_type IN (
        'task_completed',       -- Task moved to done
        'task_rejected',        -- Task sent back from review
        'task_approved',        -- Task approved on first review attempt
        'task_stalled',         -- Task in doing longer than avg duration
        'sprint_started',       -- Sprint began
        'sprint_completed',     -- Sprint ended (success or partial)
        'project_completed',    -- Project marked done
        'dependency_blocked',   -- Task blocked because dependency not resolved
        'agent_task_completed'  -- AI agent completed a task
    )),

    -- Context links
    project_id UUID REFERENCES archon_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES archon_tasks(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES archon_sprints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES archon_users_profile(id) ON DELETE SET NULL,

    -- Full context captured at event time
    -- For task_completed: {task_title, task_type, assignee_id, duration_actual_days,
    --                      story_points, review_cycles, reviewer_id, ...}
    -- For sprint_completed: {planned_points, completed_points, team_size, ...}
    event_data JSONB NOT NULL DEFAULT '{}',

    -- Results of pattern extraction (filled by learning engine)
    patterns_extracted JSONB DEFAULT '[]',          -- What was learned
    applied_to TEXT[] DEFAULT '{}',                 -- Which knowledge stores were updated

    -- Processing state
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_observations_event_type ON ai_observations(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_observations_project ON ai_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_task ON ai_observations(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_unprocessed ON ai_observations(processed, created_at) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_observations_created_at ON ai_observations(created_at DESC);


-- ============================================================================
-- 9. ai_model_accuracy
--    Tracks AI suggestion accuracy over time, broken down by period
--    and suggestion type. Powers the improvement trend charts.
--    Answers: "Is the AI getting better?"
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_model_accuracy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time period
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
    period_label TEXT NOT NULL,                     -- "2026-Q1", "2026-Feb", "2026-W07"
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Which type of suggestion
    suggestion_type TEXT NOT NULL,                  -- "task_creation", "sprint_planning", etc.

    -- Volume counts
    total_suggestions INTEGER DEFAULT 0 CHECK (total_suggestions >= 0),
    accepted_all_count INTEGER DEFAULT 0 CHECK (accepted_all_count >= 0),
    accepted_modified_count INTEGER DEFAULT 0 CHECK (accepted_modified_count >= 0),
    rejected_count INTEGER DEFAULT 0 CHECK (rejected_count >= 0),

    -- Accuracy metrics
    avg_accuracy_score DECIMAL(5,2),               -- Weighted average across all suggestions
    avg_confidence_at_suggestion DECIMAL(3,2),     -- Avg confidence when suggestions were made

    -- Trend vs previous period
    accuracy_trend TEXT DEFAULT 'stable' CHECK (accuracy_trend IN ('improving', 'stable', 'declining')),
    trend_change_percent DECIMAL(5,2),             -- e.g. +8.5% means improved by 8.5 points

    -- Scope
    project_count INTEGER DEFAULT 0,               -- How many projects contributed to this period

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(period_type, period_label, suggestion_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_model_accuracy_period ON ai_model_accuracy(period_type, period_label);
CREATE INDEX IF NOT EXISTS idx_ai_model_accuracy_suggestion_type ON ai_model_accuracy(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_accuracy_period_start ON ai_model_accuracy(period_start DESC);


-- ============================================================================
-- Automatic Observation Capture Triggers
--
-- These triggers fire on core project events and insert rows into
-- ai_observations so the learning engine can process them.
-- ============================================================================

-- Trigger: capture when a task is completed (moved to 'done')
CREATE OR REPLACE FUNCTION ai_capture_task_completed()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when status changes TO 'done'
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        INSERT INTO ai_observations (
            event_type,
            project_id,
            task_id,
            event_data
        ) VALUES (
            'task_completed',
            NEW.project_id,
            NEW.id,
            jsonb_build_object(
                'task_title', NEW.title,
                'task_type', COALESCE(NEW.task_type, 'general'),
                'priority', NEW.priority,
                'story_points', NEW.story_points,
                'assignee', NEW.assignee,
                'reviewer_id', NEW.reviewer_id,
                'started_at', NEW.started_at,
                'completed_at', NEW.completed_at,
                'duration_actual_days',
                    CASE
                        WHEN NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 86400.0
                        ELSE NULL
                    END,
                'previous_status', OLD.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_observe_task_completed ON archon_tasks;
CREATE TRIGGER ai_observe_task_completed
    AFTER UPDATE ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION ai_capture_task_completed();


-- Trigger: capture when a task is sent back from review (rejected)
CREATE OR REPLACE FUNCTION ai_capture_task_rejected()
RETURNS TRIGGER AS $$
BEGIN
    -- Review rejection: status moves FROM 'review' to 'doing' or 'todo'
    IF OLD.status = 'review' AND NEW.status IN ('doing', 'todo') THEN
        INSERT INTO ai_observations (
            event_type,
            project_id,
            task_id,
            event_data
        ) VALUES (
            'task_rejected',
            NEW.project_id,
            NEW.id,
            jsonb_build_object(
                'task_title', NEW.title,
                'task_type', COALESCE(NEW.task_type, 'general'),
                'priority', NEW.priority,
                'assignee', NEW.assignee,
                'reviewer_id', NEW.reviewer_id,
                'rejected_back_to', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_observe_task_rejected ON archon_tasks;
CREATE TRIGGER ai_observe_task_rejected
    AFTER UPDATE ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION ai_capture_task_rejected();


-- Trigger: capture when a task is approved (moved from review → done)
CREATE OR REPLACE FUNCTION ai_capture_task_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'review' AND NEW.status = 'done' THEN
        INSERT INTO ai_observations (
            event_type,
            project_id,
            task_id,
            event_data
        ) VALUES (
            'task_approved',
            NEW.project_id,
            NEW.id,
            jsonb_build_object(
                'task_title', NEW.title,
                'task_type', COALESCE(NEW.task_type, 'general'),
                'assignee', NEW.assignee,
                'reviewer_id', NEW.reviewer_id,
                'story_points', NEW.story_points
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_observe_task_approved ON archon_tasks;
CREATE TRIGGER ai_observe_task_approved
    AFTER UPDATE ON archon_tasks
    FOR EACH ROW
    EXECUTE FUNCTION ai_capture_task_approved();


-- ============================================================================
-- Row Level Security
-- All tables use service_role access (backend reads/writes via service key)
-- ============================================================================

ALTER TABLE ai_project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_dependency_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_duration_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_team_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quality_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_loop ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_accuracy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to ai_project_templates" ON ai_project_templates;
CREATE POLICY "Service role full access to ai_project_templates"
    ON ai_project_templates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_task_blueprints" ON ai_task_blueprints;
CREATE POLICY "Service role full access to ai_task_blueprints"
    ON ai_task_blueprints FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_dependency_patterns" ON ai_dependency_patterns;
CREATE POLICY "Service role full access to ai_dependency_patterns"
    ON ai_dependency_patterns FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_duration_estimates" ON ai_duration_estimates;
CREATE POLICY "Service role full access to ai_duration_estimates"
    ON ai_duration_estimates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_team_intelligence" ON ai_team_intelligence;
CREATE POLICY "Service role full access to ai_team_intelligence"
    ON ai_team_intelligence FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_quality_patterns" ON ai_quality_patterns;
CREATE POLICY "Service role full access to ai_quality_patterns"
    ON ai_quality_patterns FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_feedback_loop" ON ai_feedback_loop;
CREATE POLICY "Service role full access to ai_feedback_loop"
    ON ai_feedback_loop FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_observations" ON ai_observations;
CREATE POLICY "Service role full access to ai_observations"
    ON ai_observations FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to ai_model_accuracy" ON ai_model_accuracy;
CREATE POLICY "Service role full access to ai_model_accuracy"
    ON ai_model_accuracy FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- Track migration
-- ============================================================================
INSERT INTO archon_migrations (version, migration_name)
VALUES ('0.1.0', '033_ai_self_learning')
ON CONFLICT DO NOTHING;
