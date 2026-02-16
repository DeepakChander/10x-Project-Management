# 10x PM - Complete Testing Guide 🧪

Use this guide to test all features of your PM system.

---

## 🎯 Feature Testing Checklist

### ✅ Projects

**Test 1: View Projects**
- [ ] Open http://localhost:3737
- [ ] See 2 project cards with task counts
- [ ] Counts show: ToDo (pink), Doing (copper), Done (green)

**Test 2: Pin Project**
- [ ] Click pin icon on a project
- [ ] Card shows "DEFAULT" badge
- [ ] Project moves to left (first position)

**Test 3: Select Project**
- [ ] Click on a project card
- [ ] Card highlights with glow effect
- [ ] Docs/Tasks/Sprint tabs appear below

---

### ✅ Sprint Management

**Test 1: View Sprint**
- [ ] Click "Sprint" tab
- [ ] See sprint selector with "Sprint 1 - Foundation"
- [ ] See capacity card (79% progress, 47 tasks)
- [ ] See Kanban board with 4 columns

**Test 2: Create Sprint**
- [ ] Click "+ New Sprint"
- [ ] Fill in: Name, Goal, Dates, Capacity
- [ ] Click "Create Sprint"
- [ ] New sprint appears in dropdown

**Test 3: Start Sprint**
- [ ] Select a sprint with "planning" status
- [ ] Click "Start Sprint" button
- [ ] Sprint status changes to "active"
- [ ] 🔔 Notification appears: "Sprint started: ..."

**Test 4: Sprint Board**
- [ ] Tasks displayed in correct columns by status
- [ ] Drag task from "To Do" to "Doing"
- [ ] Task updates instantly
- [ ] 🔔 Notification appears: "Task status changed"

---

### ✅ Notifications

**Test 1: View Notifications**
- [ ] Click bell icon in sidebar
- [ ] Notification panel opens (no cutoff!)
- [ ] See list of notifications

**Test 2: Mark as Read**
- [ ] Click on a notification
- [ ] Notification marked as read
- [ ] Badge count decreases
- [ ] Navigate to related task/project

**Test 3: Mark All Read**
- [ ] Click "Mark all read" button
- [ ] All notifications marked as read
- [ ] Badge disappears
- [ ] Toast appears: "X notifications marked as read"

**Test 4: Auto-Notifications**

Via SQL:
```sql
-- Trigger notification by changing task status
UPDATE archon_tasks
SET status = 'review'
WHERE id = (SELECT id FROM archon_tasks LIMIT 1)
RETURNING id, title;
```

- [ ] Wait 10 seconds (poll interval)
- [ ] Bell badge updates
- [ ] New notification appears

---

### ✅ AI Features

**Test 1: Task Estimation**

Via API:
```bash
curl -X POST "http://localhost:8181/api/ai/tasks/TASK_ID/estimate?project_id=PROJECT_ID" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"
```

- [ ] Returns story points + duration
- [ ] Shows confidence score
- [ ] Provides reasoning
- [ ] Suggestion stored in database

**Test 2: Sprint Planning**
- [ ] Click "✨ AI Plan Sprint" button
- [ ] Modal opens with recommendations
- [ ] See:
  - Task count
  - Total story points
  - Capacity utilization %
  - AI reasoning
- [ ] Click "Accept Plan"
- [ ] Toast appears
- [ ] Suggestions panel updates

**Test 3: View AI Suggestions**
- [ ] See "AI Suggestions" panel
- [ ] Shows pending suggestions
- [ ] Displays confidence bars
- [ ] Click "Accept" on suggestion
- [ ] Suggestion marked as accepted
- [ ] Panel updates

---

### ✅ Permissions

**Test 1: Check Permission Matrix**

Via SQL:
```sql
SELECT resource, action, min_role, scope, human_only
FROM archon_permissions
ORDER BY resource, action;
```

- [ ] See 72 permission rules
- [ ] Verify task permissions
- [ ] Verify sprint permissions

**Test 2: API Permission Check**

Without X-User-Id header:
```bash
curl "http://localhost:8181/api/projects"
```

- [ ] Returns 401 Unauthorized
- [ ] Error: "Authentication required"

With header:
```bash
curl "http://localhost:8181/api/projects" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"
```

- [ ] Returns projects successfully

**Test 3: Role Hierarchy**

Via SQL:
```sql
-- Check effective role
SELECT
  u.display_name,
  om.org_role,
  pm.project_role,
  GREATEST(
    role_level(om.org_role::user_role),
    role_level(pm.project_role::user_role)
  ) as effective_level
FROM archon_users_profile u
LEFT JOIN archon_org_memberships om ON om.user_id = u.id
LEFT JOIN archon_project_memberships pm ON pm.user_id = u.id
WHERE u.id = '00000000-0000-0000-0000-000000000001';
```

- [ ] See user roles
- [ ] Verify effective role = MAX(org_role, project_role)

---

## 🐛 Bug Testing

### Edge Cases

**Test 1: No Sprint**
- [ ] Switch to "Course Module" project (no sprint)
- [ ] Click Sprint tab
- [ ] See empty state: "No active sprint"
- [ ] Click "New Sprint" works
- [ ] No errors in console

**Test 2: Over Capacity**
- [ ] Create sprint with capacity: 10 hours
- [ ] Assign 20 tasks (estimated 60 points)
- [ ] Capacity shows >100% (red)
- [ ] Warning appears: "⚠️ Sprint over capacity!"

**Test 3: No Tasks**
- [ ] Create new sprint
- [ ] Don't assign any tasks
- [ ] Board shows: "No tasks in this sprint"
- [ ] Click "New Sprint" still works

**Test 4: Duplicate Active Sprints**

Fix if you have duplicate active sprints:
```sql
-- Should only be ONE active sprint per project
UPDATE archon_sprints
SET status = 'cancelled'
WHERE status = 'active'
AND id != (
  SELECT id FROM archon_sprints
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1
);
```

---

## 📊 Data Validation

### Check Data Integrity

**Sprint Capacity Math:**
```sql
SELECT
  s.name,
  s.capacity_hours,
  COUNT(t.id) as assigned_tasks,
  SUM(COALESCE(t.story_points, 3)) as total_points,
  ROUND(
    (SUM(COALESCE(t.story_points, 3))::DECIMAL / s.capacity_hours) * 100,
    2
  ) as utilization_percent
FROM archon_sprints s
LEFT JOIN archon_tasks t ON t.sprint_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, s.name, s.capacity_hours;
```

**Notification Accuracy:**
```sql
-- Count notifications by type
SELECT
  type,
  COUNT(*) as count,
  AVG(CASE WHEN read THEN 1 ELSE 0 END) as read_rate
FROM archon_notifications
GROUP BY type
ORDER BY count DESC;
```

**Permission Coverage:**
```sql
-- Verify all resources have CRUD permissions
SELECT
  resource,
  array_agg(action ORDER BY action) as actions
FROM archon_permissions
GROUP BY resource
ORDER BY resource;
```

---

## 🎓 User Acceptance Testing

### Scenario 1: New Team Member Onboarding
1. Create new user via SQL
2. Add to organization as "member"
3. Add to project as "member"
4. Verify can:
   - ✅ View tasks
   - ✅ Update own tasks
   - ❌ Delete tasks (requires lead)
   - ❌ Manage sprints (requires lead)

### Scenario 2: Sprint Planning Session
1. PM creates new sprint
2. Clicks "AI Plan Sprint"
3. Reviews AI recommendations
4. Accepts suggested tasks
5. Clicks "Start Sprint"
6. Team members get notifications
7. Tasks appear on sprint board

### Scenario 3: Task Lifecycle
1. Create task (status: backlog)
2. Get AI estimation
3. Move to todo (sprint planning)
4. Assign to sprint
5. Developer moves to doing
6. Notification sent to assignee
7. Move to review
8. Reviewer approves → done
9. Notification sent to team

---

## 🔍 Debugging Guide

**No notifications appearing:**
1. Check triggers exist: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE '%notify%';`
2. Check user_id matches: `'00000000-0000-0000-0000-000000000001'`
3. Check polling interval (Console → Network tab)

**Sprint board empty:**
1. Verify correct project selected
2. Check tasks have sprint_id: `SELECT COUNT(*) FROM archon_tasks WHERE sprint_id IS NOT NULL;`
3. Check console for "SprintBoard Debug" logs
4. Verify API returns sprint_id field

**AI features not working:**
1. Check migration 019 was run
2. Verify AI tables exist
3. Check backend logs for errors
4. Test API directly with curl

---

## ✅ Final Validation

Run this complete system check:

```sql
-- System Health Check
SELECT
  'Tables' as component,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name LIKE 'archon_%'
UNION ALL
SELECT 'Triggers', COUNT(*)
FROM information_schema.triggers
WHERE trigger_name LIKE '%archon%'
UNION ALL
SELECT 'Projects', COUNT(*)
FROM archon_projects
UNION ALL
SELECT 'Tasks', COUNT(*)
FROM archon_tasks
UNION ALL
SELECT 'Sprints', COUNT(*)
FROM archon_sprints
UNION ALL
SELECT 'Notifications', COUNT(*)
FROM archon_notifications
UNION ALL
SELECT 'AI Suggestions', COUNT(*)
FROM archon_ai_suggestions
ORDER BY component;
```

**Expected Results:**
- Tables: 18
- Triggers: 8+
- Projects: 2
- Tasks: 50+
- Sprints: 2
- Notifications: 2+
- AI Suggestions: 1+

---

## 🎉 Success Criteria

Your system is working correctly if:

✅ All tabs load without errors
✅ Task counts display correctly
✅ Sprint board shows tasks
✅ Notifications appear and update
✅ AI suggestions generate successfully
✅ Drag-and-drop works smoothly
✅ No console errors (except expected 404s)
✅ All API endpoints return 200

**Congratulations on building a complete PM system!** 🚀
