-- ============================================================================
-- Demo Seed Data — Run this ONCE in Supabase SQL editor before the demo
-- Purpose: Pre-populate AI learning stats so the AI page looks impressive
--          rather than empty. All data uses a placeholder user/org so it
--          does not conflict with real accounts.
--
-- HOW TO USE:
--   1. Open Supabase → SQL Editor
--   2. Paste and run this entire file
--   3. Verify by visiting /ai in the app — stats should appear immediately
-- ============================================================================

-- ── Demo org and user (safe to run multiple times) ───────────────────────────

INSERT INTO archon_organizations (id, name, slug, owner_id)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '10x Demo Org',
  '10x-demo-org',
  '10000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO archon_users_profile (id, email, display_name, user_type, status, email_verified)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'demo@10x.in',
  'Alex Chen',
  'human',
  'active',
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  'priya@10x.in',
  'Priya Sharma',
  'human',
  'active',
  true
),
(
  '10000000-0000-0000-0000-000000000004',
  'james@10x.in',
  'James Wu',
  'human',
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── AI Team Intelligence profiles ────────────────────────────────────────────

INSERT INTO ai_team_intelligence (
  person_id, person_name, org_id,
  avg_task_duration_hours, approval_rate, rejection_rate,
  skills_strong, skills_developing,
  preferred_task_types, data_points,
  last_updated
) VALUES
(
  '10000000-0000-0000-0000-000000000002',
  'Alex Chen',
  '10000000-0000-0000-0000-000000000001',
  3.2, 0.88, 0.06,
  ARRAY['Backend API', 'Database design', 'Auth systems'],
  ARRAY['React', 'TypeScript'],
  ARRAY['feature', 'bug', 'refactor'],
  47,
  NOW()
),
(
  '10000000-0000-0000-0000-000000000003',
  'Priya Sharma',
  '10000000-0000-0000-0000-000000000001',
  4.8, 0.74, 0.18,
  ARRAY['React', 'UI/UX', 'CSS', 'Accessibility'],
  ARRAY['Testing', 'CI/CD'],
  ARRAY['design', 'frontend', 'documentation'],
  31,
  NOW()
),
(
  '10000000-0000-0000-0000-000000000004',
  'James Wu',
  '10000000-0000-0000-0000-000000000001',
  6.1, 0.62, 0.24,
  ARRAY['DevOps', 'Docker', 'AWS'],
  ARRAY['Python', 'Database optimization'],
  ARRAY['infrastructure', 'deployment', 'monitoring'],
  19,
  NOW()
)
ON CONFLICT (person_id) DO UPDATE SET
  approval_rate = EXCLUDED.approval_rate,
  data_points = EXCLUDED.data_points,
  last_updated = NOW();

-- ── AI Quality Patterns ───────────────────────────────────────────────────────

INSERT INTO ai_quality_patterns (
  org_id, task_type, category,
  rejection_rate, sample_size,
  common_issues, prevention_tips,
  last_updated
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'API Integration',
  'backend',
  0.34, 23,
  ARRAY['Missing error handling', 'No retry logic', 'Hardcoded credentials'],
  ARRAY['Always implement exponential backoff', 'Use environment variables for secrets', 'Write integration tests'],
  NOW()
),
(
  '10000000-0000-0000-0000-000000000001',
  'Database Migration',
  'backend',
  0.28, 18,
  ARRAY['No rollback script', 'Missing index on FK columns', 'Breaking schema changes'],
  ARRAY['Always write a rollback migration', 'Add indexes for foreign keys', 'Test with production-size dataset'],
  NOW()
),
(
  '10000000-0000-0000-0000-000000000001',
  'UI Component',
  'frontend',
  0.19, 41,
  ARRAY['Not mobile-responsive', 'Missing loading states', 'Accessibility issues'],
  ARRAY['Test on 375px viewport first', 'Always add skeleton loaders', 'Run axe-core before PR'],
  NOW()
),
(
  '10000000-0000-0000-0000-000000000001',
  'Documentation',
  'docs',
  0.11, 15,
  ARRAY['Outdated code examples', 'Missing edge cases'],
  ARRAY['Include a tested code snippet', 'Document error responses'],
  NOW()
)
ON CONFLICT DO NOTHING;

-- ── AI Model Accuracy (monthly trend) ────────────────────────────────────────

INSERT INTO ai_model_accuracy (
  org_id, suggestion_type, period_label,
  total_suggestions, accepted_all_count, modified_count, rejected_count,
  avg_accuracy_score,
  recorded_at
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'project_setup',
  'Dec 2025',
  12, 7, 3, 2,
  71.5,
  '2025-12-31'
),
(
  '10000000-0000-0000-0000-000000000001',
  'project_setup',
  'Jan 2026',
  18, 12, 4, 2,
  77.8,
  '2026-01-31'
),
(
  '10000000-0000-0000-0000-000000000001',
  'project_setup',
  'Feb 2026',
  9, 7, 2, 0,
  84.2,
  NOW()
),
(
  '10000000-0000-0000-0000-000000000001',
  'task_blueprint',
  'Jan 2026',
  34, 21, 9, 4,
  73.1,
  '2026-01-31'
),
(
  '10000000-0000-0000-0000-000000000001',
  'task_blueprint',
  'Feb 2026',
  21, 16, 4, 1,
  80.9,
  NOW()
),
(
  '10000000-0000-0000-0000-000000000001',
  'team_assignment',
  'Feb 2026',
  14, 11, 2, 1,
  82.3,
  NOW()
)
ON CONFLICT DO NOTHING;

-- ── AI Project Templates ──────────────────────────────────────────────────────

INSERT INTO ai_project_templates (
  org_id, template_name, description,
  task_count, avg_duration_days,
  success_rate, usage_count,
  tags
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'SaaS Feature Launch',
  'End-to-end feature delivery: design → backend API → frontend → QA → docs → release',
  12, 18, 0.87, 8,
  ARRAY['saas', 'feature', 'full-stack']
),
(
  '10000000-0000-0000-0000-000000000001',
  'API Integration',
  'Third-party API integration with auth, error handling, retries, and monitoring',
  7, 5, 0.91, 12,
  ARRAY['api', 'integration', 'backend']
),
(
  '10000000-0000-0000-0000-000000000001',
  'Bug Sprint',
  'Structured bug triage, root cause analysis, fix, regression test, and deploy',
  5, 3, 0.94, 21,
  ARRAY['bug', 'maintenance', 'hotfix']
)
ON CONFLICT DO NOTHING;

-- ── Done ─────────────────────────────────────────────────────────────────────

SELECT 'Demo seed data inserted successfully' AS status;
