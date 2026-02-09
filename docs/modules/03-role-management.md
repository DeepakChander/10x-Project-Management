# Role Management - 7-Level Hierarchy & Organization Structure

## Overview

Role Management answers the fundamental question: **"Who is this person, and what can they do?"** The system uses a 7-level hierarchy with dual role scoping (Organization + Project) to provide precise access control.

## The 7-Role Hierarchy

```
+-------------------------------------------+
|              OWNER (Level 7)               |
|  The CEO / Founder / Organization Creator  |
+-------------------------------------------+
                    |
+-------------------------------------------+
|              ADMIN (Level 6)               |
|  CTO, VP, Senior Directors                 |
+-------------------------------------------+
                    |
+-------------------------------------------+
|             MANAGER (Level 5)              |
|  Project Managers, Department Heads        |
+-------------------------------------------+
                    |
+-------------------------------------------+
|               LEAD (Level 4)               |
|  Team Leads, Tech Leads, Supervisors       |
+-------------------------------------------+
                    |
+-------------------------------------------+
|              MEMBER (Level 3)              |
|  Developers, Designers, Regular Staff      |
+-------------------------------------------+
                    |
+-------------------------------------------+
|              VIEWER (Level 2)              |
|  Stakeholders, Clients, Read-only Users    |
+-------------------------------------------+
                    |
+-------------------------------------------+
|              AGENT (Level 1)               |
|  AI Assistants, Bots, Automated Tools      |
+-------------------------------------------+
```

## How 10x Identifies "Who is Who"

### 4-Step Identity Flow

```
Step 1: Authentication (WHO are you?)
+------------------------------------------+
| User logs in with:                        |
|   - Email + Password                      |
|   - SSO (Google, Microsoft, etc.)         |
|   - API Key (for agents)                  |
|                                           |
| Result: Verified Identity                 |
|   user_id: "usr_abc123"                   |
|   email: "sarah@company.com"             |
+------------------------------------------+
              |
              v
Step 2: Organization Context (WHERE do you belong?)
+------------------------------------------+
| System checks:                            |
|   - Which organization?                   |
|   - Which department?                     |
|   - Which team?                           |
|                                           |
| Result: Org Context                       |
|   org: "NexaBrand Inc"                    |
|   dept: "Engineering"                     |
|   team: "Frontend Team"                   |
+------------------------------------------+
              |
              v
Step 3: Role Resolution (WHAT can you do?)
+------------------------------------------+
| System resolves:                          |
|   - Organization role: Member             |
|   - Project roles:                        |
|     * "Website Redesign": Lead            |
|     * "Mobile App": Member                |
|                                           |
| Result: Role Map                          |
|   org_role: "member"                      |
|   project_roles: { proj_1: "lead",        |
|                    proj_2: "member" }      |
+------------------------------------------+
              |
              v
Step 4: Effective Permission (WHAT actually applies?)
+------------------------------------------+
| For any specific action:                  |
|   Effective Role = MAX(org_role,          |
|                       project_role)        |
|                                           |
| Example: Sarah in "Website Redesign"      |
|   org_role: Member (Level 3)              |
|   project_role: Lead (Level 4)            |
|   effective_role: Lead (Level 4 wins)     |
+------------------------------------------+
```

## Organization Structure

```
NexaBrand Inc (Organization)
|
+-- Engineering Department
|   |
|   +-- Frontend Team
|   |   +-- Sarah (Lead)
|   |   +-- Mike (Member)
|   |   +-- Alex (Member)
|   |
|   +-- Backend Team
|   |   +-- David (Lead)
|   |   +-- Lisa (Member)
|   |
|   +-- QA Team
|       +-- Emma (Lead)
|       +-- Tom (Member)
|
+-- Marketing Department
|   |
|   +-- Content Team
|   |   +-- Rachel (Lead)
|   |   +-- James (Member)
|   |
|   +-- Design Team
|       +-- Chris (Lead)
|       +-- Anna (Member)
|
+-- AI Agents (Special Department)
    +-- Code Assistant (Agent)
    +-- Doc Generator (Agent)
    +-- Test Runner (Agent)
```

## Two Types of Roles

### Organization Roles
```
Assigned at the company level:
+------------------------------------------+
| Sarah's Org Role: MEMBER                  |
|                                           |
| This means:                               |
| - She can access the organization         |
| - She can view general dashboards         |
| - She belongs to Engineering > Frontend   |
| - This is her BASE permission level       |
+------------------------------------------+
```

### Project Roles
```
Assigned per project:
+------------------------------------------+
| Sarah's Project Roles:                    |
|                                           |
| Project: "Website Redesign"              |
| Role: LEAD                               |
| -> She leads this project's frontend     |
|                                           |
| Project: "Mobile App"                    |
| Role: MEMBER                            |
| -> She's a regular contributor here      |
|                                           |
| Project: "Internal Tools"               |
| Role: (none - no access)                |
+------------------------------------------+
```

### Effective Role Calculation
```
For any action in a specific project:

Effective Role = MAX(Org Role, Project Role)

Examples:
+------------------+-----------+---------------+-----------------+
| Person           | Org Role  | Project Role  | Effective Role  |
+------------------+-----------+---------------+-----------------+
| Sarah            | Member(3) | Lead(4)       | Lead(4)         |
| Admin User       | Admin(6)  | (none)        | Admin(6)        |
| New Hire         | Member(3) | Member(3)     | Member(3)       |
| Guest Client     | Viewer(2) | Viewer(2)     | Viewer(2)       |
| AI Bot           | Agent(1)  | Agent(1)      | Agent(1)        |
+------------------+-----------+---------------+-----------------+

Note: Org role can NEVER be downgraded by project role.
An Admin is always at least Admin, even in projects where
they have no explicit role.
```

## Role Assignment Rules

### Who Can Assign Whom?

```
RULE: You can only assign roles BELOW your own level.

Owner (7)   -> Can assign: Admin, Manager, Lead, Member, Viewer, Agent
Admin (6)   -> Can assign: Manager, Lead, Member, Viewer, Agent
Manager (5) -> Can assign: Lead, Member, Viewer
Lead (4)    -> Can assign: Member, Viewer
Member (3)  -> Cannot assign roles
Viewer (2)  -> Cannot assign roles
Agent (1)   -> Cannot assign roles
```

### Assignment Flow
```
Manager wants to add Sarah as Lead:
         |
         v
+-------------------+
| System checks:    |
| 1. Is requestor   |
|    Manager+?  YES  |
| 2. Is target role |
|    below Manager?  |
|    Lead < Manager  |
|    YES             |
| 3. Is Sarah in    |
|    this org?  YES  |
+-------------------+
         |
         v
+-------------------+
| Assignment made:  |
| Sarah -> Lead     |
| in Project X      |
| Assigned by:      |
| Manager John      |
+-------------------+
         |
         v
+-------------------+
| Notifications:    |
| - Sarah notified  |
| - Admin notified  |
| - Audit logged    |
+-------------------+
```

## AI Agent Registration

```
AI Agent Onboarding:
+-------------------------------------------+
| 1. Admin registers new agent              |
|    - Name: "Code Assistant"               |
|    - Type: "code_review"                  |
|    - Capabilities: ["review", "suggest"]  |
|    - Scope: Project "Website Redesign"    |
+-------------------------------------------+
         |
         v
+-------------------------------------------+
| 2. System creates agent identity          |
|    - agent_id: "agt_xyz789"               |
|    - Role: AGENT (Level 1 - always)       |
|    - API key generated                    |
|    - Rate limits configured               |
+-------------------------------------------+
         |
         v
+-------------------------------------------+
| 3. Agent permissions set                  |
|    - Can: create tasks, suggest changes   |
|    - Cannot: approve, delete, assign      |
|    - Scope: Only assigned project(s)      |
|    - Supervisor: Lead Sarah               |
+-------------------------------------------+
         |
         v
+-------------------------------------------+
| 4. Agent begins operating                 |
|    - All actions logged                   |
|    - Supervisor notified of activities    |
|    - Human approval required for final    |
|      decisions                            |
+-------------------------------------------+
```

## Role Lifecycle

```
+----------+     +----------+     +--------+
| INVITED  | --> | ACCEPTED | --> | ACTIVE |
+----------+     +----------+     +--------+
                                      |
                         +------------+------------+
                         |            |            |
                    +---------+  +--------+  +-------------+
                    |PROMOTED |  | MOVED  |  |DEACTIVATED  |
                    |         |  |(dept/  |  |(left company |
                    | Member  |  | team)  |  | or project)  |
                    | -> Lead |  |        |  |              |
                    +---------+  +--------+  +-------------+
```

### Lifecycle Details

**Invited**:
- Person receives invitation email
- Can see organization name and role offered
- Invitation expires after 7 days

**Accepted**:
- Person accepts invitation
- Account created or linked
- Default org role assigned

**Active**:
- Full access based on role
- Can be assigned to projects
- Participates in daily operations

**Promoted**:
- Role level increases (e.g., Member -> Lead)
- Only someone ABOVE can promote
- Previous permissions automatically expanded

**Moved**:
- Department or team change
- Role may or may not change
- Project assignments may be updated

**Deactivated**:
- Person leaves company or project
- Access immediately revoked
- Data and history preserved (not deleted)
- Can be reactivated if they return

## Role Discovery Scenarios

### Scenario 1: New Employee Joins
```
1. Admin sends invitation
2. Employee creates account
3. Assigned: Org Role = Member
4. Assigned to Department: Engineering
5. Assigned to Team: Frontend
6. Manager assigns to projects with specific roles
7. Employee sees their personalized dashboard
```

### Scenario 2: Promotion
```
1. Manager recommends promotion
2. Admin/Owner approves
3. Role updated: Member -> Lead
4. Permissions automatically expand
5. New capabilities appear in UI
6. Notification sent to team
7. AI learns new team structure
```

### Scenario 3: Cross-Project Work
```
1. Sarah is Lead in Project A
2. Manager assigns Sarah to Project B as Member
3. Sarah now has TWO project roles
4. In Project A: effective role = Lead
5. In Project B: effective role = Member
6. Dashboard shows both projects with different views
```

## Role-Based Dashboard Views

```
Owner/Admin Dashboard:
+--------------------------------------------------+
| Organization Overview                              |
| - All departments, all projects                   |
| - Financial metrics                               |
| - Team utilization across org                     |
| - AI performance metrics                          |
| - Security audit logs                             |
+--------------------------------------------------+

Manager Dashboard:
+--------------------------------------------------+
| My Projects                                        |
| - Projects I manage                               |
| - Team performance metrics                        |
| - Sprint progress                                 |
| - Pending approvals                               |
| - Resource allocation                             |
+--------------------------------------------------+

Lead Dashboard:
+--------------------------------------------------+
| My Team                                            |
| - Team member workload                            |
| - Sprint board                                    |
| - Pending reviews                                 |
| - Blocked tasks                                   |
+--------------------------------------------------+

Member Dashboard:
+--------------------------------------------------+
| My Work                                            |
| - My assigned tasks                               |
| - My sprint items                                 |
| - Upcoming deadlines                              |
| - Notifications                                   |
+--------------------------------------------------+

Viewer Dashboard:
+--------------------------------------------------+
| Project Status                                     |
| - Read-only project progress                      |
| - Milestone tracking                              |
| - Published reports                               |
+--------------------------------------------------+
```

## Data Model

### Users Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| email            | Unique email      |
| display_name     | Full name         |
| avatar_url       | Profile picture   |
| user_type        | human/agent       |
| status           | active/inactive   |
| created_at       | Registration date |
| last_active_at   | Last login        |
+------------------+-------------------+
```

### Organizations Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| name             | Company name      |
| slug             | URL-safe name     |
| owner_id         | FK to users       |
| settings         | JSON config       |
| created_at       | Creation date     |
+------------------+-------------------+
```

### Departments Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| org_id           | FK to orgs        |
| name             | Department name   |
| head_id          | FK to users       |
| created_at       | Creation date     |
+------------------+-------------------+
```

### Teams Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| department_id    | FK to departments |
| name             | Team name         |
| lead_id          | FK to users       |
| created_at       | Creation date     |
+------------------+-------------------+
```

### Org Memberships Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| user_id          | FK to users       |
| org_id           | FK to orgs        |
| department_id    | FK to departments |
| team_id          | FK to teams       |
| org_role         | Role at org level |
| status           | invited/active/   |
|                  | deactivated       |
| invited_by       | FK to users       |
| joined_at        | Join timestamp    |
+------------------+-------------------+
```

### Project Memberships Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| user_id          | FK to users       |
| project_id       | FK to projects    |
| project_role     | Role in project   |
| assigned_by      | FK to users       |
| assigned_at      | Assignment date   |
+------------------+-------------------+
```
