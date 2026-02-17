---
name: 10x-pm
description: Complete 10x PM integration via REST API. Project management with AI-powered features, sprint management, analytics, notifications, and team collaboration. Use for task management, sprint planning, AI estimation, analytics, and team coordination.
---

# 10x PM MCP Skill

Complete project management system with AI, analytics, and team collaboration.

---

## Quick Endpoint Reference

```
Sprints:
  POST   /api/projects/{id}/sprints          - Create sprint
  GET    /api/projects/{id}/sprints          - List sprints
  GET    /api/sprints/{id}                   - Get sprint details
  PUT    /api/sprints/{id}                   - Update sprint
  DELETE /api/sprints/{id}                   - Delete sprint
  GET    /api/sprints/{id}/capacity          - Get capacity summary
  PUT    /api/tasks/{id}/sprint              - Assign task to sprint

AI Features:
  POST   /api/ai/tasks/{id}/estimate         - AI task estimation
  POST   /api/ai/projects/{id}/plan-sprint   - AI sprint planning
  GET    /api/ai/suggestions                 - Get AI suggestions
  PUT    /api/ai/suggestions/{id}/accept     - Accept AI suggestion
  GET    /api/ai/providers                   - List AI providers

Analytics:
  GET    /api/analytics/sprints/{id}/burndown        - Sprint burndown chart
  GET    /api/analytics/projects/{id}/velocity       - Velocity trends
  GET    /api/analytics/projects/{id}/dashboard      - Complete analytics

Notifications:
  GET    /api/notifications                  - Get notifications
  GET    /api/notifications/unread-count     - Get unread count
  PUT    /api/notifications/{id}/read        - Mark as read
  PUT    /api/notifications/read-all         - Mark all as read

Team Management:
  POST   /api/invitations/{org_id}           - Create invitation
  GET    /api/invitations/{org_id}           - List invitations
  POST   /api/invitations/accept/{token}     - Accept invitation
  GET    /api/organizations/{id}/members     - List org members

Projects & Tasks:
  GET    /api/projects                       - List projects
  POST   /api/projects                       - Create project
  GET    /api/projects/{id}/tasks            - List tasks
  POST   /api/tasks                          - Create task
  PUT    /api/tasks/{id}                     - Update task
```

---

## MCP Tool Functions

Use these functions in Claude Code/Cursor:

### Sprint Management

```python
# Create sprint
find_sprints(project_id="uuid")  # List sprints
manage_sprint(action="create", project_id="uuid", name="Sprint 1", capacity_hours=160)
manage_sprint(action="update", sprint_id="uuid", status="active")
get_sprint_capacity(sprint_id="uuid")  # Get metrics
assign_task_to_sprint(task_id="uuid", sprint_id="uuid")
```

### AI Features

```python
# Task estimation
estimate_task(task_id="uuid", project_id="uuid")
# Returns: {story_points: 5, duration_hours: 8, confidence: 0.85}

# Sprint planning
plan_sprint(project_id="uuid", capacity_hours=160)
# Returns: {recommended_tasks: [...], total_story_points: 42}
```

### Analytics

```python
# Burndown chart
get_sprint_burndown(sprint_id="uuid")
# Velocity trends
get_velocity_chart(project_id="uuid", limit=5)
# Complete dashboard
get_project_analytics(project_id="uuid")
```

### Notifications

```python
# Get unread notifications
get_notifications(unread_only=True)
# Mark as read
mark_notification_read(notification_id="uuid")
```

---

## Complete Demo Workflow

```python
# 1. Create project
project = manage_project(action="create", title="Mobile App", description="iOS + Android redesign")

# 2. Create sprint
sprint = manage_sprint(action="create", project_id=project['id'], name="Sprint 1", capacity_hours=160)

# 3. Create tasks
task1 = manage_task(action="create", project_id=project['id'], title="Design login screen", priority="high")

# 4. Get AI estimation
estimation = estimate_task(task_id=task1['id'], project_id=project['id'])
# AI suggests: 5 story points, 8 hours

# 5. AI sprint planning
plan = plan_sprint(project_id=project['id'], capacity_hours=160)
# AI recommends: 8 tasks, 42 story points, 78% capacity

# 6. Assign tasks to sprint
for task_id in plan['recommended_tasks']:
    assign_task_to_sprint(task_id=task_id, sprint_id=sprint['id'])

# 7. Start sprint
manage_sprint(action="update", sprint_id=sprint['id'], status="active")
# Triggers notification to all team members

# 8. View analytics
analytics = get_project_analytics(project_id=project['id'])
# Shows: burndown, velocity, predictions

# 9. Check sprint health
capacity = get_sprint_capacity(sprint_id=sprint['id'])
# Shows: 8 tasks, 42 points, 78% utilization
```

---

## System Features

**Roles:** Owner, Admin, Manager, Lead, Member, Viewer, Agent
**Security:** 4-layer defense, 72 permission rules
**AI:** Claude, OpenAI, Ollama support with fallback
**Analytics:** Burndown, velocity, predictions, timeline tracking
**Collaboration:** Real-time notifications, team invitations
**Scale:** Multi-org, multi-project, unlimited users

---

Ready for production deployment!
