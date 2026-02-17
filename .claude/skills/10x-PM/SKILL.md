---
name: 10x-pm
description: Complete 10x PM integration for AI-powered project management. Provides sprint management, task tracking, AI estimation, real-time analytics, notifications, team management, and knowledge base search. Use for all project management operations, from creating tasks to analyzing team velocity.
---

# 10x PM - AI-Powered Project Management

Complete project management system with AI, analytics, and team collaboration capabilities.

---

## ⚠️ CRITICAL - First Use Setup

**MANDATORY STEPS:**

1. **Ask for host URL:** "What's your 10x PM server URL?" (default: `http://localhost:3737`)
2. **Verify connection:** `GET /api/projects`
3. **Check available features:** Use endpoints below

---

## Complete API Reference

### 📊 Projects

```
GET    /api/projects                    - List all projects
POST   /api/projects                    - Create project
GET    /api/projects/{id}               - Get project details
PUT    /api/projects/{id}               - Update project
DELETE /api/projects/{id}               - Delete project
GET    /api/projects/{id}/features      - Get project features
GET    /api/projects/task-counts        - Get task counts for all projects
```

**Example:**
```python
# Create project
POST /api/projects
{
  "title": "Mobile App Redesign",
  "description": "Complete UI/UX overhaul",
  "features": ["Authentication", "Dashboard", "Reports"]
}
```

---

### 📋 Tasks

```
GET    /api/tasks                       - List all tasks
POST   /api/tasks                       - Create task
GET    /api/tasks/{id}                  - Get task details
PUT    /api/tasks/{id}                  - Update task
DELETE /api/tasks/{id}                  - Delete/archive task
GET    /api/projects/{id}/tasks         - List project tasks
PUT    /api/mcp/tasks/{id}/status       - Update task status (MCP optimized)
GET    /api/tasks/{id}/dependencies     - Get task dependencies
POST   /api/tasks/{id}/dependencies     - Add dependency
```

**Task Statuses:** `backlog`, `todo`, `doing`, `review`, `done`

**Example:**
```python
# Create task
POST /api/tasks
{
  "project_id": "uuid",
  "title": "Implement OAuth2",
  "description": "Add OAuth2 authentication flow",
  "status": "todo",
  "assignee": "Sarah Johnson",
  "priority": "high",
  "story_points": 5
}
```

---

### 🏃 Sprints (NEW!)

```
POST   /api/projects/{id}/sprints          - Create sprint
GET    /api/projects/{id}/sprints          - List sprints (filter by status)
GET    /api/sprints/{id}                   - Get sprint details
PUT    /api/sprints/{id}                   - Update sprint
DELETE /api/sprints/{id}                   - Delete sprint
GET    /api/sprints/{id}/capacity          - Get capacity summary
GET    /api/projects/{id}/sprints/active   - Get active sprint
PUT    /api/tasks/{id}/sprint              - Assign task to sprint
```

**Sprint Statuses:** `planning`, `active`, `completed`, `cancelled`

**Example:**
```python
# Create and start sprint
POST /api/projects/{project_id}/sprints
{
  "name": "Sprint 1 - Foundation",
  "goal": "Setup core features",
  "start_date": "2026-02-17",
  "end_date": "2026-03-03",
  "capacity_hours": 160
}

# Start sprint
PUT /api/sprints/{sprint_id}
{ "status": "active" }

# Assign task to sprint
PUT /api/tasks/{task_id}/sprint
{ "sprint_id": "sprint-uuid" }
```

---

### 🤖 AI Features (NEW!)

```
POST   /api/ai/tasks/{id}/estimate              - AI task estimation
POST   /api/ai/projects/{id}/plan-sprint        - AI sprint planning
POST   /api/ai/tasks/{id}/detect-dependencies   - Detect dependencies
GET    /api/ai/suggestions                      - Get AI suggestions
PUT    /api/ai/suggestions/{id}/accept          - Accept suggestion
GET    /api/ai/providers                        - List AI providers (Claude, OpenAI, Ollama)
```

**Example:**
```python
# Get AI estimation
POST /api/ai/tasks/{task_id}/estimate?project_id={project_id}
# Response: {
#   "story_points": 5,
#   "duration_hours": 8,
#   "confidence": 0.85,
#   "reasoning": "Based on description complexity..."
# }

# AI sprint planning
POST /api/ai/projects/{project_id}/plan-sprint
{
  "sprint_capacity_hours": 160,
  "current_velocity": 42.0
}
# Response: {
#   "recommended_tasks": ["task-1", "task-2", ...],
#   "total_story_points": 42,
#   "capacity_utilization": 0.78,
#   "warnings": []
# }
```

---

### 📊 Analytics (NEW!)

```
GET    /api/analytics/sprints/{id}/burndown        - Sprint burndown chart
GET    /api/analytics/projects/{id}/velocity       - Velocity trends
GET    /api/analytics/projects/{id}/team-performance - Team metrics
GET    /api/analytics/projects/{id}/dashboard      - Complete analytics dashboard
```

**Example:**
```python
# Get sprint burndown
GET /api/analytics/sprints/{sprint_id}/burndown
# Response: {
#   "sprint_name": "Sprint 1",
#   "snapshots": [{
#     "snapshot_date": "2026-02-17",
#     "remaining_tasks": 8,
#     "remaining_story_points": 42,
#     "completed_today_tasks": 2
#   }],
#   "ideal_line": [{"day": 0, "ideal_remaining": 50}, ...]
# }

# Get complete dashboard
GET /api/analytics/projects/{project_id}/dashboard
# Returns: burndown, velocity, active sprint, all metrics
```

---

### 🔔 Notifications (NEW!)

```
GET    /api/notifications                   - Get user notifications
GET    /api/notifications/unread-count      - Get unread count
PUT    /api/notifications/{id}/read         - Mark notification as read
PUT    /api/notifications/read-all          - Mark all as read
DELETE /api/notifications/{id}              - Delete notification
```

**Notification Types:**
- `task_assigned`, `task_status_changed`, `task_comment`
- `sprint_started`, `sprint_ending`, `sprint_completed`
- `dependency_resolved`, `mention`, `review_requested`, `review_completed`

**Example:**
```python
# Get unread notifications
GET /api/notifications?unread_only=true&limit=20

# Mark as read
PUT /api/notifications/{notification_id}/read
```

---

### 👥 Team Management (NEW!)

```
POST   /api/invitations/{org_id}           - Create invitation
GET    /api/invitations/{org_id}           - List invitations
GET    /api/invitations/token/{token}      - Get invitation by token
POST   /api/invitations/accept/{token}     - Accept invitation
DELETE /api/invitations/{id}               - Revoke invitation
GET    /api/organizations/{id}/members     - List org members
```

**Example:**
```python
# Invite team member
POST /api/invitations/{org_id}
{
  "email": "john@company.com",
  "role": "lead",  # owner, admin, manager, lead, member, viewer, agent
  "personal_message": "Welcome to the team!"
}

# Accept invitation
POST /api/invitations/accept/{token}
{
  "display_name": "John Doe",
  "password": "SecurePass123"
}
```

---

### 🏢 Organizations & Roles

```
GET    /api/organizations                  - List organizations
POST   /api/organizations                  - Create organization
GET    /api/organizations/{id}             - Get org details
GET    /api/organizations/{id}/members     - List members
POST   /api/organizations/{id}/departments - Create department
GET    /api/organizations/{id}/departments - List departments
POST   /api/departments/{id}/teams         - Create team
GET    /api/departments/{id}/teams         - List teams
```

**Role Hierarchy:** Owner (7) > Admin (6) > Manager (5) > Lead (4) > Member (3) > Viewer (2) > Agent (1)

---

### 📚 Knowledge Base (Existing)

```
POST   /api/knowledge-items/search         - Search knowledge base
GET    /api/knowledge-items                - List all items
POST   /api/knowledge-items/crawl          - Crawl website
POST   /api/knowledge-items/upload         - Upload document
GET    /api/rag/sources                    - Get RAG sources
GET    /api/database/metrics               - Get database metrics
```

---

## Complete Workflow Examples

### Example 1: Full Sprint Workflow

```python
# 1. Create project
project = POST /api/projects
{
  "title": "Q1 2026 Mobile App",
  "description": "iOS and Android redesign"
}

# 2. Create sprint
sprint = POST /api/projects/{project.id}/sprints
{
  "name": "Sprint 1 - Foundation",
  "capacity_hours": 160,
  "start_date": "2026-02-17",
  "end_date": "2026-03-03"
}

# 3. Create tasks
task1 = POST /api/tasks
{
  "project_id": project.id,
  "title": "Design login screen",
  "priority": "high"
}

# 4. Get AI estimation
estimation = POST /api/ai/tasks/{task1.id}/estimate?project_id={project.id}
# Returns: 5 points, 8 hours, 85% confidence

# 5. AI sprint planning
plan = POST /api/ai/projects/{project.id}/plan-sprint
{ "sprint_capacity_hours": 160 }
# Returns: recommended 8 tasks, 42 points, 78% capacity

# 6. Assign tasks to sprint
for task_id in plan.recommended_tasks:
    PUT /api/tasks/{task_id}/sprint
    { "sprint_id": sprint.id }

# 7. Start sprint
PUT /api/sprints/{sprint.id}
{ "status": "active" }
# Triggers notification to all team members

# 8. View real-time analytics
GET /api/analytics/projects/{project.id}/dashboard
# Returns: burndown, velocity, predictions

# 9. Move task to doing
PUT /api/tasks/{task1.id}
{ "status": "doing" }
# Triggers notification to assignee

# 10. Check notifications
GET /api/notifications?unread_only=true
```

### Example 2: Team Collaboration

```python
# 1. Invite team member
POST /api/invitations/{org_id}
{
  "email": "developer@company.com",
  "role": "member",
  "personal_message": "Join our mobile app project!"
}
# Email sent via SendGrid

# 2. Assign task to team member
PUT /api/tasks/{task_id}
{
  "assignee": "developer@company.com"
}
# Notification sent automatically

# 3. Check sprint capacity
GET /api/sprints/{sprint_id}/capacity
# Returns: {
#   "total_tasks": 8,
#   "completed_tasks": 3,
#   "total_story_points": 42,
#   "capacity_utilization": 78%
# }
```

### Example 3: Analytics & Insights

```python
# 1. Get sprint burndown
GET /api/analytics/sprints/{sprint_id}/burndown
# Returns: daily snapshots, ideal vs actual

# 2. Get velocity trends
GET /api/analytics/projects/{project_id}/velocity?limit=5
# Returns: last 5 sprints with velocity data

# 3. Get complete dashboard
GET /api/analytics/projects/{project_id}/dashboard
# Returns: {
#   "active_sprint": {...},
#   "burndown": {...},
#   "velocity_summary": {...},
#   "velocity_chart": {...}
# }
```

---

## Authentication

**All requests require:** `X-User-Id` header

```python
headers = {
    "X-User-Id": "user-uuid-here",
    "Content-Type": "application/json"
}
```

**For development:** Use dev user `00000000-0000-0000-0000-000000000001`

**For production:** Obtain from login API

---

## System Capabilities

**What 10x PM Can Do:**

1. **Project Management**
   - Multi-project tracking
   - Hierarchical tasks
   - Feature organization
   - Document management

2. **Sprint Management**
   - Agile sprint planning
   - Capacity tracking
   - Task-sprint assignments
   - Sprint lifecycle (planning → active → completed)

3. **AI-Powered Features**
   - Task estimation (story points, duration)
   - Sprint planning (task selection, capacity)
   - Dependency detection
   - Multi-provider (Claude, OpenAI, Ollama)

4. **Analytics & Insights**
   - Sprint burndown charts
   - Velocity tracking
   - Timeline predictions
   - Capacity warnings
   - Team performance metrics

5. **Team Collaboration**
   - User invitations (email)
   - Role-based permissions (7 levels)
   - Real-time notifications
   - Activity logging

6. **Knowledge Management**
   - RAG-powered search
   - Website crawling
   - Document upload
   - Code example extraction

---

## Quick Reference by Use Case

### "Create a new sprint with AI planning"
```python
1. POST /api/projects/{id}/sprints - Create sprint
2. POST /api/ai/projects/{id}/plan-sprint - Get AI recommendations
3. PUT /api/tasks/{id}/sprint - Assign recommended tasks
4. PUT /api/sprints/{id} - Start sprint (status: active)
5. GET /api/analytics/sprints/{id}/burndown - View progress
```

### "Estimate a task"
```python
1. POST /api/tasks - Create task
2. POST /api/ai/tasks/{id}/estimate - Get AI estimation
3. PUT /api/tasks/{id} - Update with estimated story points
```

### "Invite team member"
```python
1. POST /api/invitations/{org_id} - Send invitation
2. # User receives email with link
3. POST /api/invitations/accept/{token} - User accepts
4. GET /api/organizations/{org_id}/members - Verify member added
```

### "View sprint progress"
```python
1. GET /api/analytics/sprints/{id}/burndown - Burndown chart
2. GET /api/sprints/{id}/capacity - Capacity metrics
3. GET /api/notifications?unread_only=true - Recent updates
```

---

## MCP Tool Functions

**Available in Claude Code/Cursor:**

### Sprint Tools
- `find_sprints(project_id, status)` - List sprints
- `manage_sprint(action, sprint_id, name, status, capacity_hours)` - Create/update/delete
- `get_sprint_capacity(sprint_id)` - Get capacity metrics
- `assign_task_to_sprint(task_id, sprint_id)` - Assign task

### AI Tools
- `estimate_task(task_id, project_id)` - Get AI estimation
- `plan_sprint(project_id, capacity_hours)` - AI sprint planning

### Analytics Tools
- `get_sprint_burndown(sprint_id)` - Burndown data
- `get_project_analytics(project_id)` - Complete dashboard
- `get_velocity_chart(project_id, limit)` - Velocity trends

### Project Tools (Existing)
- `find_projects(query, project_id)` - Search/list projects
- `manage_project(action, title, description)` - Create/update/delete

### Task Tools (Existing)
- `find_tasks(query, filter_by, filter_value)` - Search/filter tasks
- `manage_task(action, task_id, title, status, assignee)` - Create/update/delete

### Knowledge Tools (Existing)
- `rag_search_knowledge_base(query, source_id, match_count)` - Semantic search
- `rag_get_available_sources()` - List knowledge sources

---

## Permission System

**7 Role Levels:**
1. **Owner** (7) - Created organization, full access
2. **Admin** (6) - System administration
3. **Manager** (5) - Department management
4. **Lead** (4) - Team management
5. **Member** (3) - Task execution
6. **Viewer** (2) - Read-only
7. **Agent** (1) - AI assistant (limited permissions)

**Permission Check:** Every endpoint checks user role against required permission.

**Example:** Deleting tasks requires "lead" role (level 4+)

---

## Real-Time Features

**Notifications:**
- Auto-created on task/sprint events
- Database triggers
- 10-second polling
- Mark as read/delete

**Analytics:**
- Live burndown charts
- Real-time capacity tracking
- Velocity calculations
- Progress predictions

---

## Error Handling

**Standard Response Format:**

**Success:**
```json
{
  "message": "Task created successfully",
  "task": { /* task object */ }
}
```

**Error:**
```json
{
  "detail": "Permission denied",
  "error": "Insufficient role level",
  "required_role": "lead",
  "effective_role": "member"
}
```

**Common Errors:**
- `401` - Authentication required (missing X-User-Id)
- `403` - Permission denied (insufficient role)
- `404` - Resource not found
- `400` - Invalid request data

---

## Configuration

**Host URL:** Obtained from user (e.g., `http://localhost:3737`)

**Headers Required:**
```
X-User-Id: user-uuid
Content-Type: application/json
```

**Environment Variables** (server-side):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-key
EMAIL_PROVIDER=sendgrid
SMTP_PASSWORD=your-sendgrid-key
AI_PROVIDER=claude  # claude, openai, or ollama
```

---

## When to Use This Skill

**Always use 10x PM for:**
- ✅ Task management and tracking
- ✅ Sprint planning and execution
- ✅ AI-powered estimations
- ✅ Team collaboration
- ✅ Progress analytics
- ✅ Knowledge base search

**Example prompts:**
- "Create a sprint for Q1 2026 with AI-selected tasks"
- "What's our team velocity for the last 3 sprints?"
- "Estimate how long this task will take"
- "Show me the burndown for the current sprint"
- "Invite john@company.com as a team lead"

---

## Production-Ready Features

✅ Multi-user with invitations
✅ Role-based security (72 permission rules)
✅ AI-powered estimation and planning
✅ Real-time notifications
✅ Visual analytics and predictions
✅ Email integration (SendGrid)
✅ Sprint management with capacity tracking
✅ Complete audit logging

**Scale:** Supports 5-5,000 users, unlimited projects

---

## System Architecture

**Backend:** FastAPI + Python 3.12
**Database:** PostgreSQL + Supabase (26 tables, 10+ triggers)
**Frontend:** React 18 + TypeScript
**AI:** Multi-provider (Claude, OpenAI, Ollama)
**Email:** SendGrid SMTP
**Real-time:** Smart polling with ETag caching

---

Ready for enterprise deployment! 🚀

### 🔐 Authentication (Phase 8)

```
POST   /api/auth/signup                     - Sign up (create user + org) [Public]
POST   /api/auth/login                      - Login with email/password [Public]
POST   /api/auth/logout                     - Logout (invalidate session)
```

**Example:**
```python
# Sign up (first user becomes owner)
POST /api/auth/signup
{
  "email": "sarah@company.com",
  "display_name": "Sarah Johnson",
  "password": "SecurePass123!",
  "org_name": "Acme Corp",
  "company_domain": "acme.com"
}
# Returns: {user: {...}, organization: {...}}

# Login
POST /api/auth/login
{
  "email": "sarah@company.com",
  "password": "SecurePass123!"
}
# Returns: {user: {...}, session_token: "..."}
```

---

### 🤖 Agent Workflow (Phase 9)

```
POST   /api/agent/tasks/{id}/acknowledge    - Agent confirms task receipt
POST   /api/agent/tasks/{id}/accept         - Agent accepts → moves to "doing"
POST   /api/agent/tasks/{id}/decline        - Agent declines with reason
POST   /api/agent/tasks/{id}/submit-review  - Agent submits for supervisor review
POST   /api/agent/tasks/{id}/approve        - Supervisor approves → "done"
POST   /api/api-keys/generate               - Generate agent API key
```

**Agent Workflow Example:**
```python
# 1. Agent acknowledges (within 5 seconds of assignment)
POST /api/agent/tasks/{task_id}/acknowledge
{
  "response_time_ms": 1200,
  "message": "Task received. Evaluating..."
}

# 2a. Agent ACCEPTS
POST /api/agent/tasks/{task_id}/accept
{
  "message": "Task accepted. Starting work.",
  "conditions": null  # or conditions for conditional acceptance
}
# → Task moves to "doing"

# 2b. OR Agent DECLINES
POST /api/agent/tasks/{task_id}/decline
{
  "reason": "Missing API specification document",
  "suggestion": "Please provide API spec before assigning"
}
# → Task stays in "todo", supervisor notified

# 3. Agent completes work and submits
POST /api/agent/tasks/{task_id}/submit-review
{
  "submission_data": {
    "output": "Generated documentation",
    "files": ["api-docs.md"]
  },
  "confidence_score": 0.87,
  "flagged_items": ["Section 3.2 needs human review"],
  "message": "Work complete. 87% confident. Please review Section 3.2."
}
# → Task moves to "review", supervisor notified

# 4. Supervisor reviews and approves
POST /api/agent/tasks/{task_id}/approve?agent_id={agent_id}
{
  "quality_score": 9,
  "comments": "Excellent work! Minor edits to Section 3.2."
}
# → Task moves to "done"
```

**Agent Registration:**
```python
# Generate API key for agent
POST /api/api-keys/generate
{
  "agent_user_id": "agent-uuid",
  "key_name": "Claude Code Production",
  "webhook_url": "https://your-agent.com/webhooks/10x-pm",
  "capabilities": {
    "can_create_tasks": true,
    "can_update_tasks": true,
    "can_delete_tasks": false,
    "can_approve": false
  },
  "supervisor_id": "supervisor-uuid"
}
# Returns: {api_key: "10x_ag_...", key_prefix: "10x_ag_abc"}
# ⚠️ Save API key - shown only once!
```

---

