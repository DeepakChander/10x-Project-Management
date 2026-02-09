# Permission Management - 4-Layer Defense-in-Depth Security

## Overview

Permission Management in 10x PM follows a "Defense in Depth" strategy with 4 independent security layers. Every action must pass through ALL 4 layers before it's allowed. If any single layer says "No", the action is blocked.

## The 4 Security Layers

```
User Action (e.g., "Delete this task")
         |
         v
+------------------+
| LAYER 1: UI      |  <-- "Can you even SEE the button?"
| (What you see)   |
+------------------+
         |
         v
+------------------+
| LAYER 2: API     |  <-- "Is this request valid?"
| (Request check)  |
+------------------+
         |
         v
+------------------+
| LAYER 3: SERVICE |  <-- "Do you have permission for this?"
| (Business logic) |
+------------------+
         |
         v
+------------------+
| LAYER 4: DATABASE|  <-- "Does the data allow this?"
| (Data level)     |
+------------------+
         |
         v
    Action Executed
    (or Rejected)
```

## Real-World Analogy: Building Security

Think of it like entering a secure building:

```
Layer 1 (UI) = Reception Desk
  "Can you see the elevator to the 5th floor?"
  If you're a visitor, you don't even see floors 3-5 on the directory.

Layer 2 (API) = Door Security Guard
  "Do you have a valid ID badge? Is it expired?"
  Checks if your request is properly formatted and authenticated.

Layer 3 (Service) = Office Manager
  "Are you authorized to enter THIS specific room?"
  Checks your role against the specific resource you want.

Layer 4 (Database) = File Cabinet Lock
  "Even if you're in the room, can you open THIS drawer?"
  Row-level security ensures you only see YOUR data.
```

**Why 4 layers?** Because if a hacker bypasses one layer (like injecting a button in the UI), the API layer still blocks them. If they bypass the API, the service layer blocks them. If they bypass that, the database blocks them. ALL 4 must agree.

## Master Permission Matrix

```
+--------------------+-------+-------+---------+------+--------+--------+-------+
| Action             | Owner | Admin | Manager | Lead | Member | Viewer | Agent |
+--------------------+-------+-------+---------+------+--------+--------+-------+
| Create Project     |  Yes  |  Yes  |   Yes   |  No  |   No   |   No   |  No   |
| Delete Project     |  Yes  |  Yes  |   No    |  No  |   No   |   No   |  No   |
| Create Task        |  Yes  |  Yes  |   Yes   | Yes  |  Yes   |   No   |  Yes  |
| Assign Task        |  Yes  |  Yes  |   Yes   | Yes  |   No   |   No   |  No   |
| Delete Task        |  Yes  |  Yes  |   Yes   |  No  |   No   |   No   |  No   |
| Move Task Stage    |  Yes  |  Yes  |   Yes   | Yes  |  Own   |   No   | Own   |
| Approve/Review     |  Yes  |  Yes  |   Yes   | Yes  |   No   |   No   |  No   |
| View Tasks         |  Yes  |  Yes  |   Yes   | Yes  |  Yes   |  Yes   | Scope |
| Manage Sprints     |  Yes  |  Yes  |   Yes   | Yes  |   No   |   No   |  No   |
| Manage Members     |  Yes  |  Yes  |   Yes   |  No  |   No   |   No   |  No   |
| System Settings    |  Yes  |  Yes  |   No    |  No  |   No   |   No   |  No   |
| Manage Roles       |  Yes  |  Yes  |   No    |  No  |   No   |   No   |  No   |
| View Reports       |  Yes  |  Yes  |   Yes   | Yes  |  Own   |   No   |  No   |
| AI Suggestions     |  Yes  |  Yes  |   Yes   | Yes  |  Yes   |   No   |  Yes  |
| Final Approval     |  Yes  |  Yes  |   Yes   | Yes  |   No   |   No   |  No*  |
+--------------------+-------+-------+---------+------+--------+--------+-------+

* AI Agents can NEVER give final approval - humans only
```

## Layer Details

### Layer 1: UI Layer
**What it does**: Controls what the user can see on screen.

```
Manager's View:                    Member's View:
+-----------------------+          +-----------------------+
| Project Dashboard     |          | Project Dashboard     |
| [+ New Task]          |          | [+ New Task]          |
| [Manage Sprint]       |          |                       |
| [Team Settings]       |          |                       |
| [Delete Project]      |          |                       |
+-----------------------+          +-----------------------+

Manager sees 4 buttons                Member sees 1 button
```

**How it works**:
- React components check user role
- Buttons, menu items, pages are conditionally rendered
- Navigation items filtered by permission
- Even URLs are role-gated

### Layer 2: API Layer
**What it does**: Validates every incoming request.

```
Request arrives:
POST /api/projects/123/tasks

API Layer checks:
  1. Is the user authenticated? (valid token?)
  2. Is the token expired?
  3. Is the request format valid?
  4. Rate limiting: Too many requests?
  5. Does project 123 exist?

If ANY check fails:
  -> 401 Unauthorized
  -> 403 Forbidden
  -> 400 Bad Request
  -> 429 Too Many Requests
```

### Layer 3: Service Layer
**What it does**: Checks business rules and role permissions.

```
Service receives validated request:
"User 456 wants to delete Task 789 in Project 123"

Service checks:
  1. What is User 456's role in Project 123?
     -> Role: "Member"
  2. Can "Member" role delete tasks?
     -> Check permission matrix -> NO
  3. REJECT: "Members cannot delete tasks"

Another example:
"User 456 wants to move Task 789 to DOING"
  1. Role: "Member"
  2. Can "Member" move tasks? -> Only OWN tasks
  3. Is Task 789 assigned to User 456? -> YES
  4. Is the transition valid? (Todo -> Doing) -> YES
  5. ALLOW
```

### Layer 4: Database Layer
**What it does**: Row-level security at the data level.

```
Database policies:

Policy: "users_see_own_org_data"
  -> Users can only SELECT rows where org_id matches their org

Policy: "members_update_own_tasks"
  -> Members can only UPDATE tasks where assignee_id = their user_id

Policy: "viewers_read_only"
  -> Viewer role has no INSERT, UPDATE, DELETE permissions

Even if someone bypasses all 3 layers above,
the database itself refuses unauthorized operations.
```

## Scope Boundaries

### Organization vs Project Permissions

```
Organization Level:              Project Level:
+------------------------+      +------------------------+
| Controls:              |      | Controls:              |
| - Who joins the org    |      | - Who works on project |
| - Department structure |      | - Task permissions     |
| - Global settings      |      | - Sprint management    |
| - Billing              |      | - Review assignments   |
| - AI configuration     |      | - Document access      |
+------------------------+      +------------------------+

Effective Role = HIGHER of (Org Role, Project Role)

Example:
  Org Role: Member
  Project Role: Lead
  Effective Role: Lead (higher wins)
```

### Cross-Project Isolation

```
Project A                    Project B
+-----------+                +-----------+
| Team:     |                | Team:     |
| - Alice   |                | - Alice   |  (same person,
| - Bob     |                | - Charlie |   different role)
| - Carol   |                | - Dave    |
|           |                |           |
| Alice:    |                | Alice:    |
| Role=Lead |                | Role=     |
|           |                | Member    |
+-----------+                +-----------+

Alice is Lead in Project A but Member in Project B.
Her permissions are DIFFERENT in each project.
```

## AI Agent Permission Rules

```
AI Agent Permissions:
+----------------------------+----------+
| Action                     | Allowed? |
+----------------------------+----------+
| Create tasks (backlog)     | Yes      |
| Suggest priority           | Yes      |
| Move own tasks             | Yes      |
| Assign tasks to others     | No       |
| Approve/reject reviews     | NEVER    |
| Access assigned scope only | Yes      |
| View all project data      | No*      |
| Modify settings            | No       |
| Delete anything            | No       |
+----------------------------+----------+

* Agents only see data within their assigned scope
```

**Human-Only Gates**:
```
These actions ALWAYS require a human:
  1. Final approval of any deliverable
  2. Deleting projects or critical data
  3. Changing role assignments
  4. Modifying security settings
  5. Approving budget/resource changes
  6. Overriding AI recommendations

AI can SUGGEST these but cannot EXECUTE them.
```

## Permission Check Flow

```
User clicks "Delete Task"
         |
         v
[Layer 1: UI]
Does user's role show delete button?
         |
    Yes --+--> No --> Button not visible (stop)
         |
         v
[Layer 2: API]
DELETE /api/tasks/789
- Valid token? Valid format?
         |
    Yes --+--> No --> 401/400 error (stop)
         |
         v
[Layer 3: Service]
- User role in this project?
- Can this role delete tasks?
- Is this their task or any task?
         |
    Yes --+--> No --> 403 Forbidden (stop)
         |
         v
[Layer 4: Database]
- Row-level policy allows delete?
- Org isolation check?
         |
    Yes --+--> No --> Database error (stop)
         |
         v
Task Deleted Successfully
```

## Data Model

### Permissions Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| role             | Role name         |
| resource         | Resource type     |
| action           | CRUD action       |
| scope            | own/team/project/ |
|                  | org               |
| conditions       | JSON conditions   |
| created_at       | Timestamp         |
+------------------+-------------------+
```

### Role Assignments Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| user_id          | FK to users       |
| role             | Assigned role     |
| scope_type       | org/project       |
| scope_id         | Org or Project ID |
| assigned_by      | Who assigned      |
| assigned_at      | When assigned     |
| expires_at       | Optional expiry   |
+------------------+-------------------+
```

## Key Principles

1. **Deny by default**: If not explicitly allowed, it's denied
2. **Least privilege**: Give minimum permissions needed
3. **Defense in depth**: 4 independent layers
4. **No bypass**: Even admins go through all 4 layers
5. **Audit everything**: Every permission check is logged
6. **Human gates**: Critical actions always need human approval
