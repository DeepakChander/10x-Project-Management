---
name: 10x-pm
description: Complete 10x PM integration for AI-powered project management. Provides sprint management, task tracking, AI estimation, self-learning intelligence, real-time analytics, notifications, team management, and knowledge base search. Use for all project management operations, from creating tasks to analyzing team velocity.
---

# 10x PM — AI-Powered Project Management

Complete project management system with AI self-learning, sprint analytics, and team collaboration.

---

## ⚠️ CRITICAL — First Use Setup (Always Run This)

### Step 1 — Get Base URL

Ask the user:
> "What's your 10x PM server URL?"
> - Local development: `http://localhost:8181`
> - AWS deployment: `http://<EC2-PUBLIC-IP>:8181`
> - Default if no answer: `http://localhost:8181`

Store as `BASE_URL`. Strip trailing slash. All API calls use `{BASE_URL}/api/...`.

The **UI** runs on port **3737**, but the **API** runs on port **8181**. Always call `{BASE_URL}` (port 8181) directly.

### Step 2 — Check Authentication

After getting the base URL, immediately check if the user is authenticated:

```python
# Try to get current user profile
GET {BASE_URL}/api/auth/me
# If no auth stored yet, this will return 401 or fail
```

**If the server returns 401 or you have no stored User-Id:**
Ask the user:
> "Are you already signed up, or do you need to create an account?"

**Option A — Login (existing account):**
```python
POST {BASE_URL}/api/auth/login
Content-Type: application/json

{
  "email": "<ask user for email>",
  "password": "<ask user for password>"
}

# Response:
# {
#   "user": { "id": "uuid", "display_name": "...", "email": "..." },
#   "session_token": "..."
# }
```
Store `user.id` as `USER_ID`. This is your `X-User-Id` header for all subsequent calls.

**Option B — Create New Account (first-time user):**
```python
POST {BASE_URL}/api/auth/signup
Content-Type: application/json

{
  "email": "<ask for email>",
  "display_name": "<ask for name>",
  "password": "<ask for password — min 8 chars>",
  "org_name": "<ask for organization name>",
  "company_domain": "<optional — their company domain>"
}

# Response:
# {
#   "user": { "id": "uuid", "display_name": "...", "email": "..." },
#   "organization": { "id": "org-uuid", "name": "..." }
# }
```
Store `user.id` as `USER_ID`. The first user automatically becomes **Owner** of the organization.

### Step 3 — Verify Connection

```python
GET {BASE_URL}/api/projects
X-User-Id: {USER_ID}

# Should return list of projects (empty array if new account)
# If this works, setup is complete!
```

Confirm to the user:
> "Connected to 10x PM at {BASE_URL}. Logged in as {display_name}. Ready!"

---

## All Requests Use These Headers

```
X-User-Id: {USER_ID}
Content-Type: application/json
```

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

**Create project:**
```python
POST /api/projects
{
  "title": "Mobile App Redesign",
  "description": "Complete UI/UX overhaul with new design system",
  "features": ["Authentication", "Dashboard", "Reports"]
}
```

---

### 📋 Tasks

**Task Statuses:** `backlog` → `todo` → `doing` → `review` → `done`

```
GET    /api/tasks                       - List all tasks
POST   /api/tasks                       - Create task
GET    /api/tasks/{id}                  - Get task details
PUT    /api/tasks/{id}                  - Update task
DELETE /api/tasks/{id}                  - Delete/archive task
GET    /api/projects/{id}/tasks         - List project tasks
PUT    /api/mcp/tasks/{id}/status       - Update task status (MCP optimized)
```

**Valid Transitions:**
- `backlog` → `todo`
- `todo` → `doing` (blocked if unresolved dependencies exist)
- `doing` → `review`
- `review` → `done` or `todo` (reject back for rework)
- Any status → `backlog` (reset path, always allowed)

**Auto-Timestamps:**
- `started_at` — set automatically when status → `doing`
- `completed_at` — set automatically when status → `done`

**Create task (full fields):**
```python
POST /api/tasks
{
  "project_id": "uuid",
  "title": "Implement OAuth2",
  "description": "Add OAuth2 authentication flow",
  "status": "backlog",
  "assignee": "Sarah Johnson",        # or "Coding Agent"
  "priority": "high",                 # critical, high, medium, low
  "story_points": 5,                  # Fibonacci: 1,2,3,5,8,13
  "due_date": "2026-03-15",
  "reviewer_id": "reviewer-uuid",
  "created_by": "creator-uuid",
  "task_type": "feature",             # feature, bug, docs, testing
  "estimated_hours": 8
}
```

---

### 🔗 Task Dependencies

```
GET    /api/projects/{id}/dependencies  - Get all dependencies in a project
GET    /api/tasks/{id}/dependencies     - Get dependencies for one task
POST   /api/tasks/{id}/dependencies     - Add blocking dependency
DELETE /api/dependencies/{id}           - Remove dependency
```

**Rules:**
- Tasks can only depend on tasks in the same project
- Circular dependencies are rejected (DFS algorithm)
- Moving blocked task to `doing` is rejected until blocker is `done`

```python
# Mark task B as blocked by task A
POST /api/tasks/{task_b_id}/dependencies
{ "depends_on_id": "task_a_id" }

# Response when blocking:
# Error 400: { "detail": "Task is blocked by: Setup Auth Module (todo)" }
```

---

### 🏃 Sprints

```
POST   /api/projects/{id}/sprints          - Create sprint
GET    /api/projects/{id}/sprints          - List sprints (filter by status)
GET    /api/sprints/{id}                   - Get sprint details
PUT    /api/sprints/{id}                   - Update sprint
DELETE /api/sprints/{id}                   - Delete sprint
GET    /api/sprints/{id}/capacity          - Capacity summary
GET    /api/projects/{id}/sprints/active   - Active sprint
PUT    /api/tasks/{id}/sprint              - Assign task to sprint
```

**Sprint Statuses:** `planning` → `active` → `completed` / `cancelled`

```python
# Create sprint
POST /api/projects/{project_id}/sprints
{
  "name": "Foundation Sprint",
  "goal": "Core authentication and design system",
  "start_date": "2026-02-19",
  "end_date": "2026-03-04",
  "capacity_hours": 160
}

# Start sprint
PUT /api/sprints/{sprint_id}
{ "status": "active" }

# Complete sprint (triggers velocity auto-recording)
PUT /api/sprints/{sprint_id}
{ "status": "completed" }
```

---

### 🤖 AI Features

**Classic AI:**
```
POST   /api/ai/tasks/{id}/estimate              - AI task estimation
POST   /api/ai/projects/{id}/plan-sprint        - AI sprint planning
POST   /api/ai/tasks/{id}/detect-dependencies   - Detect dependencies
GET    /api/ai/providers                        - List available AI providers
```

**AI Self-Learning (Magic Moment):**
```
POST   /api/ai/projects/{id}/suggest-setup      - Generate task suggestions for new project
POST   /api/ai/suggestions/{id}/feedback        - Record user feedback on suggestions
GET    /api/ai/learn/status                     - Learning system status
POST   /api/ai/learn                            - Process pending observations
GET    /api/ai/team-intelligence                - Team intelligence profiles
GET    /api/ai/quality-patterns                 - Quality patterns by task type
GET    /api/ai/accuracy                         - Model accuracy over time
```

**Magic Moment:**
```python
# After creating a project, trigger AI task suggestions
POST /api/ai/projects/{project_id}/suggest-setup
{
  "title": "E-Commerce Mobile App",
  "description": "React Native shopping app with payments, auth, and catalog"
}

# Response:
# {
#   "project_id": "uuid",
#   "suggestion_id": "uuid",
#   "needs_description": false,
#   "confidence": 0.82,
#   "suggested_tasks": [
#     { "title": "Setup authentication flow", "priority": "high", "story_points": 5 },
#     ...
#   ]
# }

# Record feedback
POST /api/ai/suggestions/{suggestion_id}/feedback
{ "user_response": "accepted_all" }   # or "accepted_with_modifications", "rejected"
```

---

### 📊 Analytics

```
GET    /api/analytics/sprints/{id}/burndown           - Sprint burndown chart
GET    /api/analytics/projects/{id}/velocity          - Velocity trends
GET    /api/analytics/projects/{id}/team-performance  - Team metrics
GET    /api/analytics/projects/{id}/dashboard         - Complete analytics dashboard
```

---

### 🔔 Notifications

```
GET    /api/notifications                   - Get user notifications
GET    /api/notifications/unread-count      - Get unread count
PUT    /api/notifications/{id}/read         - Mark as read
PUT    /api/notifications/read-all          - Mark all as read
DELETE /api/notifications/{id}              - Delete notification
```

---

### 👥 Team Management

```
POST   /api/invitations/{org_id}           - Invite team member
GET    /api/invitations/{org_id}           - List invitations
POST   /api/invitations/accept/{token}     - Accept invitation
DELETE /api/invitations/{id}               - Revoke invitation
GET    /api/organizations/{id}/members     - List org members
```

**Role Hierarchy:** Owner (7) > Admin (6) > Manager (5) > Lead (4) > Member (3) > Viewer (2) > Agent (1)

```python
# Invite team member
POST /api/invitations/{org_id}
{
  "email": "john@company.com",
  "role": "lead",
  "personal_message": "Welcome to the team!"
}
```

---

### 🔐 Authentication

```
POST   /api/auth/signup     - Create account + organization (public, no auth needed)
POST   /api/auth/login      - Login with email/password (public, no auth needed)
POST   /api/auth/logout     - Logout / invalidate session
GET    /api/auth/me         - Get current user profile
```

---

### 🤖 Agent Workflow

```
POST   /api/agent/tasks/{id}/acknowledge    - Agent confirms task receipt
POST   /api/agent/tasks/{id}/accept         - Agent accepts → "doing"
POST   /api/agent/tasks/{id}/decline        - Agent declines with reason
POST   /api/agent/tasks/{id}/submit-review  - Agent submits for review
POST   /api/agent/tasks/{id}/approve        - Supervisor approves → "done"
POST   /api/agent/tasks/{id}/reject         - Supervisor rejects → "doing"
```

**Approve agent work:**
```python
POST /api/agent/tasks/{task_id}/approve
{
  "quality_score": 8,
  "comments": "Good structure, covers all requirements"
}
```

---

### 💬 Comments & Status History

```
POST   /api/tasks/{id}/comments          - Add comment to task
GET    /api/tasks/{id}/comments          - Get all task comments
GET    /api/tasks/{id}/status-history    - Get status change history
```

---

### 📊 Admin Dashboard

```
GET    /api/admin/dashboard/stats        - Real-time org statistics
GET    /api/admin/team/members           - All organization members with roles
```

---

### 📚 Knowledge Base

```
POST   /api/knowledge-items/search       - Semantic search (RAG)
GET    /api/knowledge-items              - List all items
POST   /api/knowledge-items/crawl        - Crawl website
POST   /api/knowledge-items/upload       - Upload document
GET    /api/rag/sources                  - Get RAG sources
```

---

## AWS Deployment URLs

When running on AWS EC2, all URLs use the public IP:

```
Frontend UI:   http://<EC2-IP>:3737
Backend API:   http://<EC2-IP>:8181   ← BASE_URL
MCP Server:    http://<EC2-IP>:8051
Agents:        http://<EC2-IP>:8052
```

Example `.mcp.json` for Claude Code (local → AWS):
```json
{
  "mcpServers": {
    "10x": {
      "type": "sse",
      "url": "http://<EC2-IP>:8051/sse"
    }
  }
}
```

---

## MCP Tool Functions

**Available in Claude Code / Cursor / Windsurf:**

### Task Dependency Tools
- `find_task_dependencies(task_id?, project_id?)` — Query blocks/blocked_by
- `manage_task_dependency(action, task_id?, depends_on_id?, dependency_id?)` — Add/remove

### Sprint Tools
- `find_sprints(project_id, status?)` — List sprints
- `manage_sprint(action, sprint_id?, name?, status?, capacity_hours?)` — Create/update/delete
- `get_sprint_capacity(sprint_id)` — Capacity metrics
- `assign_task_to_sprint(task_id, sprint_id)` — Assign task to sprint

### AI Self-Learning Tools
- `suggest_project_setup(project_id, title, description)` — Magic Moment task suggestions
- `get_team_intelligence(person_id?, task_type?)` — Team profiles
- `get_quality_patterns(task_type?, min_rejection_rate?)` — Quality patterns
- `manage_ai_learning(action, batch_size?)` — Actions: status, learn, accuracy

### Classic AI Tools
- `estimate_task(task_id, project_id)` — AI story point and hour estimation
- `plan_sprint(project_id, capacity_hours)` — AI sprint planning

### Analytics Tools
- `get_sprint_burndown(sprint_id)` — Burndown chart data
- `get_project_analytics(project_id)` — Complete dashboard
- `get_velocity_chart(project_id, limit?)` — Velocity trends

### Project Tools
- `find_projects(query?, project_id?)` — Search or list projects
- `manage_project(action, title?, description?)` — Create/update/delete

### Task Tools
- `find_tasks(query?, filter_by?, filter_value?, task_id?)` — Search/filter/get
- `manage_task(action, task_id?, title?, status?, assignee?, story_points?, due_date?, priority?)` — Create/update/delete

### Knowledge Base Tools
- `rag_search_knowledge_base(query, source_id?, match_count?)` — Semantic search
- `rag_search_code_examples(query, match_count?)` — Code snippet search
- `rag_get_available_sources()` — List all indexed sources
- `rag_list_pages_for_source(source_id)` — Browse documentation structure
- `rag_read_full_page(page_id)` — Read full page content

---

## Permission System

**7 Roles:**
1. **Owner** — Full access, created organization
2. **Admin** — System administration
3. **Manager** — Department management
4. **Lead** — Team and task management
5. **Member** — Task execution
6. **Viewer** — Read-only
7. **Agent** — AI agent (limited, cannot approve/delete/grant roles)

**Security layers:**
- UI hides unauthorized actions
- API middleware checks permissions (72 rules)
- Service layer enforces WIP limits, transitions, dependencies
- PostgreSQL Row-Level Security on all tables

---

## Error Reference

```json
// Permission denied
{ "detail": "Permission denied", "required_role": "lead", "effective_role": "member" }

// Blocked by dependency
{ "detail": "Task is blocked by: Setup Auth Module (todo)" }

// WIP limit reached
{ "detail": "WIP limit reached: 'Sarah Johnson' already has 3 task(s) in progress" }

// AI unavailable
{ "detail": "AI task generation is unavailable: ... Configure your LLM API key in Settings → AI Agent" }

// Invalid transition
{ "detail": "Invalid status transition from 'done' to 'todo'" }
```

---

## Quick Reference by Goal

**Create project with AI tasks:**
```
1. POST /api/projects
2. POST /api/ai/projects/{id}/suggest-setup
3. POST /api/tasks (for each accepted suggestion)
4. POST /api/ai/suggestions/{id}/feedback
```

**Run a sprint:**
```
1. POST /api/projects/{id}/sprints
2. PUT /api/tasks/{id}/sprint (assign tasks)
3. PUT /api/sprints/{id} { "status": "active" }
4. GET /api/analytics/sprints/{id}/burndown
5. PUT /api/sprints/{id} { "status": "completed" }
```

**Assign task to AI agent:**
```
1. POST /api/tasks { "assignee": "Coding Agent" }
2. Wait ~30s — dispatcher auto-claims it
3. Task moves: backlog → doing → review (automatic)
4. POST /api/agent/tasks/{id}/approve (human supervisor)
```

**Monitor AI learning:**
```
1. GET /api/ai/learn/status
2. POST /api/ai/learn (process pending observations)
3. GET /api/ai/team-intelligence
4. GET /api/ai/quality-patterns
5. GET /api/ai/accuracy
```

---

## Real-Time Features

- **Notifications**: Smart polling every 10s, pauses in background tab
- **Analytics**: Live burndown, velocity auto-updated on sprint completion
- **AI Self-Learning**: DB triggers auto-capture task events, background processing updates knowledge stores
- **Task Dispatcher**: Background asyncio task polls every 30s for agent-assigned tasks

---

**Total: 123 API endpoints | 17 MCP tools | 4 Docker services | 41 DB tables**
