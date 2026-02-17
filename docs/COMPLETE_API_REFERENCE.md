# 10x PM - Complete API Reference

**Total Endpoints: 85+**

All endpoints require `X-User-Id` header unless marked as "Public"

---

## Phase 1: Organizations & Roles (26 endpoints)

### Organizations
```
GET    /api/organizations                    - List all organizations
POST   /api/organizations                    - Create organization
GET    /api/organizations/{id}               - Get organization details
PUT    /api/organizations/{id}               - Update organization
DELETE /api/organizations/{id}               - Delete organization
GET    /api/organizations/{id}/members       - List organization members
```

### Departments
```
POST   /api/organizations/{org_id}/departments   - Create department
GET    /api/organizations/{org_id}/departments   - List departments
GET    /api/departments/{id}                     - Get department details
PUT    /api/departments/{id}                     - Update department
DELETE /api/departments/{id}                     - Delete department
GET    /api/departments/{id}/members             - List department members
```

### Teams
```
POST   /api/departments/{dept_id}/teams      - Create team
GET    /api/departments/{dept_id}/teams      - List teams
GET    /api/teams/{id}                       - Get team details
PUT    /api/teams/{id}                       - Update team
DELETE /api/teams/{id}                       - Delete team
GET    /api/teams/{id}/members               - List team members
```

### Roles & Permissions
```
GET    /api/roles                            - List all roles
GET    /api/roles/hierarchy                  - Get role hierarchy
GET    /api/permissions                      - List all permissions
GET    /api/permissions/matrix               - Get permission matrix
POST   /api/roles/assign                     - Assign role to user
GET    /api/users/{id}/roles                 - Get user's roles
GET    /api/users/{id}/effective-role        - Get effective role (max of org + project)
```

---

## Phase 2: Sprint Management (9 endpoints)

```
POST   /api/projects/{id}/sprints            - Create sprint
GET    /api/projects/{id}/sprints            - List sprints (filter by status)
GET    /api/sprints/{id}                     - Get sprint details
PUT    /api/sprints/{id}                     - Update sprint (inc. status changes)
DELETE /api/sprints/{id}                     - Delete sprint
GET    /api/sprints/{id}/capacity            - Get sprint capacity summary
GET    /api/projects/{id}/sprints/active     - Get active sprint
PUT    /api/tasks/{id}/sprint                - Assign task to sprint
DELETE /api/tasks/{id}/sprint                - Remove task from sprint
```

---

## Phase 3: Notifications (5 endpoints)

```
GET    /api/notifications                    - Get user notifications (filter: unread_only, limit)
GET    /api/notifications/unread-count       - Get unread notification count
PUT    /api/notifications/{id}/read          - Mark notification as read
PUT    /api/notifications/read-all           - Mark all notifications as read
DELETE /api/notifications/{id}               - Delete notification
```

---

## Projects & Tasks (Existing + Enhanced - 15 endpoints)

### Projects
```
GET    /api/projects                         - List all projects
POST   /api/projects                         - Create project
GET    /api/projects/{id}                    - Get project details
PUT    /api/projects/{id}                    - Update project
DELETE /api/projects/{id}                    - Delete project
GET    /api/projects/{id}/features           - Get project features
GET    /api/projects/{id}/tasks              - List project tasks (with ETag)
GET    /api/projects/task-counts             - Get task counts for all projects
```

### Tasks
```
GET    /api/tasks                            - List all tasks (with filters)
POST   /api/tasks                            - Create task
GET    /api/tasks/{id}                       - Get task details
PUT    /api/tasks/{id}                       - Update task
DELETE /api/tasks/{id}                       - Delete/archive task
PUT    /api/mcp/tasks/{id}/status            - Update task status (MCP optimized)
GET    /api/tasks/{id}/dependencies          - Get task dependencies
POST   /api/tasks/{id}/dependencies          - Add dependency
DELETE /api/dependencies/{id}                - Remove dependency
```

---

## Phase 5-6: AI Features (6 endpoints)

```
POST   /api/ai/tasks/{id}/estimate           - AI task estimation (story points, duration)
POST   /api/ai/projects/{id}/plan-sprint     - AI sprint planning recommendations
POST   /api/ai/tasks/{id}/detect-dependencies - AI dependency detection
GET    /api/ai/suggestions                   - Get AI suggestions (filter: pending/accepted)
PUT    /api/ai/suggestions/{id}/accept       - Accept AI suggestion
GET    /api/ai/providers                     - List AI providers (Claude, OpenAI, Ollama)
```

---

## Phase 7: Analytics (4 endpoints)

```
GET    /api/analytics/sprints/{id}/burndown        - Sprint burndown chart data
GET    /api/analytics/projects/{id}/velocity       - Velocity trends (last N sprints)
GET    /api/analytics/projects/{id}/team-performance - Team member performance metrics
GET    /api/analytics/projects/{id}/dashboard      - Complete analytics dashboard (all metrics)
```

---

## Phase 8: User Management & Auth (10 endpoints)

### Invitations
```
POST   /api/invitations/{org_id}             - Create invitation (send email)
GET    /api/invitations/{org_id}             - List invitations (filter by status)
GET    /api/invitations/token/{token}        - Get invitation details [Public]
POST   /api/invitations/accept/{token}       - Accept invitation [Public]
DELETE /api/invitations/{id}                 - Revoke invitation
```

### Authentication
```
POST   /api/auth/signup                      - Sign up + create org [Public]
POST   /api/auth/login                       - Login with email/password [Public]
POST   /api/auth/logout                      - Logout (invalidate session)
```

### Users
```
GET    /api/users/{id}                       - Get user profile
PUT    /api/users/{id}                       - Update user profile
```

---

## Phase 9: Agent Workflow (6 endpoints)

### Agent Task Management
```
POST   /api/agent/tasks/{id}/acknowledge     - Agent acknowledges task receipt
POST   /api/agent/tasks/{id}/accept          - Agent accepts task → moves to "doing"
POST   /api/agent/tasks/{id}/decline         - Agent declines task with reason
POST   /api/agent/tasks/{id}/submit-review   - Agent submits work for supervisor review
POST   /api/agent/tasks/{id}/approve         - Supervisor approves agent work → "done"
```

### API Keys
```
POST   /api/api-keys/generate                - Generate API key for agent (returns key once)
```

---

## Knowledge Base (Existing - 10 endpoints)

```
POST   /api/knowledge-items/search           - Semantic search (RAG-powered)
GET    /api/knowledge-items                  - List all knowledge items
POST   /api/knowledge-items/crawl            - Crawl website
POST   /api/knowledge-items/upload           - Upload document
DELETE /api/knowledge-items/{id}             - Delete knowledge item
GET    /api/rag/sources                      - Get RAG sources
GET    /api/rag/pages                        - List pages for source
POST   /api/rag/read-page                    - Read full page content
GET    /api/database/metrics                 - Get database metrics
GET    /api/code-examples/search             - Search code examples
```

---

## Documents & Versions (Existing - 8 endpoints)

```
GET    /api/documents                        - List documents
POST   /api/documents                        - Create document
GET    /api/documents/{id}                   - Get document details
PUT    /api/documents/{id}                   - Update document (auto-version)
DELETE /api/documents/{id}                   - Delete document
GET    /api/documents/{id}/versions          - List document versions
POST   /api/versions/restore/{id}            - Restore version
GET    /api/versions/{id}                    - Get version details
```

---

## System & Utilities (Existing - 10 endpoints)

```
GET    /api/health                           - Health check
GET    /api/settings                         - Get settings
PUT    /api/settings                         - Update settings
GET    /api/progress/active                  - Get active operations
GET    /api/progress/{id}                    - Get operation status
GET    /api/mcp/status                       - MCP server status
POST   /api/mcp/execute                      - Execute MCP tool
GET    /api/version                          - Get system version
GET    /api/migrations                       - List migrations
POST   /api/bug-report                       - Submit bug report
```

---

## TOTAL ENDPOINTS BY CATEGORY

| Category | Endpoints | Phase |
|----------|-----------|-------|
| Organizations & Roles | 26 | Phase 1 |
| Sprints | 9 | Phase 2 |
| Notifications | 5 | Phase 3 |
| Projects & Tasks | 15 | Existing + Phase 2 |
| AI Features | 6 | Phase 5-6 |
| Analytics | 4 | Phase 7 |
| User Management | 10 | Phase 8 |
| Agent Workflow | 6 | Phase 9 |
| Knowledge Base | 10 | Existing |
| Documents | 8 | Existing |
| System | 10 | Existing |

**TOTAL: 109 API Endpoints** 🎯

---

## Authentication

**All endpoints require (except marked [Public]):**
```
Headers:
  X-User-Id: user-uuid
  Content-Type: application/json
```

**Public endpoints:**
- /api/health
- /api/auth/signup
- /api/auth/login
- /api/invitations/token/{token}
- /api/invitations/accept/{token}
- /api/ai/providers

---

## Permission Levels

**Endpoints check permissions based on:**
- Resource (task, sprint, project, org)
- Action (create, read, update, delete)
- User's effective role (max of org_role + project_role)

**Example:** Deleting sprints requires "manager" role (level 5+)

---

**You have 109 production-ready API endpoints!** 🚀

Now about the email - check SendGrid dashboard or spam folder!
