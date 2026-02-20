# 10x Project Management — Executive Demo Guide

**Version:** 5.0 — Complete Feature Coverage Including AI Self-Learning
**Duration:** 45–60 min (full) | 20–25 min (condensed)
**Audience:** Executives, investors, customers, engineering leads
**Format:** SAY → DO → SEE for every scene

---

## WHAT WAS BUILT — COMPLETE SYSTEM

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         10x PROJECT MANAGEMENT PLATFORM                        │
├────────────────────────┬───────────────────────┬───────────────────────────────┤
│  FRONTEND :3737        │  BACKEND API :8181     │  AI LAYER                     │
│                        │                        │                               │
│  React 18 + TypeScript │  FastAPI + Python 3.12 │  MCP Server :8051             │
│  TanStack Query v5     │  Supabase (PostgreSQL)  │  • 17 tools for AI IDEs       │
│  Tailwind CSS          │  123 REST endpoints     │  • Claude Code / Cursor /     │
│  5-column Kanban       │  72 permission rules    │    Windsurf integration        │
│  Table view            │  4-layer security       │                               │
│  Drag-and-drop         │  ETag caching (~70% BW) │  Agents Service :8052         │
│  Sprint Analytics      │  Smart polling          │  • Coding Agent (GPT-4o-mini) │
│  Notifications (bell)  │  Task Dispatcher 30s    │  • RAG-grounded responses     │
│  Team Management       │  AI Self-Learning       │  • Auto-dispatch pipeline     │
│  AI Intelligence page  │  Knowledge RAG          │  • Human-in-the-loop approval │
└────────────────────────┴───────────────────────┴───────────────────────────────┘
                                      │
              PostgreSQL + pgvector (Supabase)
              41 tables | 3 analytics views | 15+ triggers
              9 AI learning tables | AI self-learning pipeline
```

---

## MASTER SYSTEM FLOWCHART

```
USER / IDE DEVELOPER
      │
      ├─── Browser ──────────────────────────────────────────────────────────────┐
      │    http://<IP>:3737                                                       │
      │    │                                                                      │
      │    ├── Signup / Login ──► Organization created                            │
      │    ├── Admin Dashboard ──► Live org stats                                 │
      │    ├── Projects View ──► 5-col Kanban + Table View                        │
      │    ├── Task Edit Modal ──► All fields, deps, comments                     │
      │    ├── Sprint Board ──► Burndown, Capacity, Velocity                      │
      │    ├── Knowledge Base ──► Crawl, Upload, Search                           │
      │    ├── Notifications ──► Bell badge, click-to-navigate                    │
      │    ├── Team Management ──► Invite, role assign                            │
      │    └── AI Intelligence ──► Magic Moment, Team profiles, Quality patterns  │
      │                                                                            │
      └─── Claude Code / Cursor / Windsurf                                        │
           MCP Server http://<IP>:8051                                            │
           │                                                                      │
           ├── find_projects / manage_project                                     │
           ├── find_tasks / manage_task                                           │
           ├── manage_sprint / get_sprint_capacity                                │
           ├── find_task_dependencies / manage_task_dependency                   │
           ├── rag_search_knowledge_base / rag_search_code_examples              │
           ├── suggest_project_setup (Magic Moment)                              │
           ├── get_team_intelligence / get_quality_patterns                      │
           └── manage_ai_learning                                                 │
                                                                                  │
                    ┌─────────────────────────────────────────────────────────────┘
                    │
                    ▼
          FastAPI Backend :8181
          ┌──────────────────────────────────────────────────────────────────┐
          │  Permission Middleware (72 rules, 7 roles)                        │
          │       │                                                            │
          │  Service Layer                                                     │
          │  ├── Task Service (transitions, WIP limits, auto-timestamps)      │
          │  ├── Sprint Service (capacity, velocity, burndown)                │
          │  ├── Dependency Service (DFS circular detection)                  │
          │  ├── Notification Service (12+ event types)                       │
          │  ├── AI Learning Service (Magic Moment, team intelligence)        │
          │  ├── AI Provider Factory (OpenAI / Claude / Ollama)               │
          │  └── Task Dispatcher (asyncio 30s poll → Agents :8052)            │
          │       │                                                            │
          │  Database Layer                                                    │
          │  └── Supabase PostgreSQL + pgvector                               │
          │       ├── archon_projects, archon_tasks, archon_sprints           │
          │       ├── archon_task_dependencies, archon_task_comments          │
          │       ├── archon_task_status_history (full audit log)             │
          │       ├── archon_velocity_history (auto on sprint complete)        │
          │       ├── archon_notifications (12+ event triggers)               │
          │       ├── ai_observations, ai_project_templates (9 AI tables)     │
          │       ├── archon_users, archon_org_members (7 roles)              │
          │       └── 15+ DB triggers (status history, velocity, AI capture)  │
          └──────────────────────────────────────────────────────────────────┘
```

---

## TASK LIFECYCLE FLOWCHART

```
                    ┌──────────────────────────────────────────────────────────┐
                    │               5-STAGE TASK LIFECYCLE                      │
                    └──────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌──────┐     ┌───────┐     ┌────────┐     ┌──────┐
    │ BACKLOG │────►│ TODO │────►│ DOING │────►│ REVIEW │────►│ DONE │
    └─────────┘     └──────┘     └───────┘     └────────┘     └──────┘
         ▲              │             │              │
         │              │    ┌────────┘  Reject back │
         │              │    │  (rework)  ◄──────────┘
         └──────────────┴────┴──────────────────────────  ANY → BACKLOG (reset)

    Enforcement rules (server-side, cannot be bypassed):
    ┌────────────────────────────────────────────────────────────────────┐
    │  todo → doing     BLOCKED if task has unresolved dependencies       │
    │  doing → review   Always allowed                                    │
    │  review → done    Always allowed (triggers completed_at stamp)      │
    │  review → doing   Allowed (send back for rework)                   │
    │  ANY → backlog    Always allowed (reset path)                       │
    │                                                                      │
    │  WIP LIMIT: max 3 tasks in "doing" per person (server enforced)     │
    │  started_at    → auto-stamped when status changes to "doing"        │
    │  completed_at  → auto-stamped when status changes to "done"         │
    └────────────────────────────────────────────────────────────────────┘
```

---

## AI AGENT AUTO-EXECUTION PIPELINE

```
    Developer assigns task to "Coding Agent"
              │
              ▼  every 30 seconds
    ┌─────────────────────────────────────────────────────┐
    │  Task Dispatcher (asyncio background task)           │
    │  SELECT * FROM archon_tasks                          │
    │  WHERE assignee IN ('Coding Agent', 'Archon')        │
    │  AND status IN ('backlog', 'todo')                   │
    │  AND archived = false LIMIT 5                        │
    └─────────────────────────────────────────────────────┘
              │  task found
              ▼
    Claim task: UPDATE status = 'doing'
    (optimistic lock — prevents double-pickup)
              │
              ▼
    Post comment: "🤖 Coding Agent accepted this task..."
    Insert row in archon_task_acknowledgements
              │
              ▼
    POST http://agents:8052/agents/execute-task
              │
              ▼
    ┌─────────────────────────────────────────────────────┐
    │  Coding Agent (PydanticAI + GPT-4o-mini)            │
    │  1. Read task title + description                   │
    │  2. Call rag_search_knowledge_base() for context    │
    │  3. Generate implementation / analysis / docs       │
    └─────────────────────────────────────────────────────┘
              │
              ▼
    Post result as comment (attribution: "Coding Agent")
    UPDATE task status → 'review'
    UPDATE archon_task_acknowledgements (submitted_for_review)
              │
              ▼
    HUMAN SUPERVISOR reviews
    ├── APPROVE → status 'done' + quality_score stored
    └── REJECT  → status 'doing' + feedback (agent reworks on next poll)
```

---

## AI SELF-LEARNING PIPELINE

```
    ┌─────────────────────────────────────────────────────────────────┐
    │                  AI SELF-LEARNING MODULE                         │
    └─────────────────────────────────────────────────────────────────┘

    Every task event fires DB triggers:
    ┌────────────────────┐    ┌─────────────────────────┐
    │  task → done       │───►│  ai_observe_task_        │
    │  task approved     │    │  completed/approved/     │──► ai_observations table
    │  task rejected     │───►│  rejected triggers       │
    └────────────────────┘    └─────────────────────────┘
                                          │
                                          ▼
                              POST /api/ai/learn (batch processing)
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                  │ai_project_   │ │ai_team_       │ │ai_quality_   │
                  │templates     │ │intelligence   │ │patterns      │
                  │(learned from │ │(skills,       │ │(rejection    │
                  │past projects)│ │approval rates)│ │rates by type)│
                  └──────────────┘ └──────────────┘ └──────────────┘
                          │
                          ▼
              "Magic Moment" — New Project Created
              POST /api/ai/projects/{id}/suggest-setup
                          │
                          ▼
              ┌────────────────────────────────────────┐
              │  Returns 5-10 suggested tasks with:    │
              │  • titles, priorities, story points    │
              │  • assignee recommendations            │
              │  • agent_suitable flag                 │
              │  • estimated days                      │
              │  • confidence score (0-100%)           │
              └────────────────────────────────────────┘
                          │
              User accepts / modifies / rejects
                          │
              POST /api/ai/suggestions/{id}/feedback
                          │
              Feedback trains model for next suggestion
```

---

## SECURITY ARCHITECTURE

```
    ┌────────────────────────────────────────────────────────────────┐
    │              4-LAYER SECURITY ARCHITECTURE                      │
    └────────────────────────────────────────────────────────────────┘

    Layer 1: UI
    → Hides buttons based on role ("Delete Project" not visible to Members)
    → Greys out unavailable drag targets (WIP limit reached)

    Layer 2: API Permission Middleware
    → 72 rules covering every resource + action combination
    → Returns 403 with required role if insufficient permissions
    → human_only flag: agents CANNOT call approve / delete / grant-role

    Layer 3: Service Business Logic
    → WIP limits: max 3 in-progress per person
    → Status transition validation (VALID_TRANSITIONS map)
    → Dependency enforcement: cannot start blocked task
    → AI key validation before attempting AI calls

    Layer 4: PostgreSQL Row-Level Security
    → RLS policies on every table
    → Direct DB access blocked for unauthorized roles
    → Even service key bypass is scoped per org

    Role Hierarchy:
    ┌────────────────────────────────────────────────────────────┐
    │  Owner (7)   → Full access, created org                    │
    │  Admin (6)   → Manage team, cannot delete org              │
    │  Manager (5) → Manage projects and sprints                 │
    │  Lead (4)    → Manage tasks, approve agent work            │
    │  Member (3)  → Create / update assigned tasks              │
    │  Viewer (2)  → Read-only                                   │
    │  Agent (1)   → Post comments, update status               │
    │                CANNOT approve / delete / grant roles        │
    └────────────────────────────────────────────────────────────┘
```

---

## PRE-DEMO SETUP (30 Minutes Before)

### Required (One-time)

Run this in **Supabase SQL Editor** (fixes status history trigger):

```sql
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_status INTERVAL;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        time_in_status := NOW() - OLD.updated_at;
        INSERT INTO archon_task_status_history (
            task_id, user_id, old_status, new_status, time_in_previous_status
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000001'::uuid,
            OLD.status,
            NEW.status,
            time_in_status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Start All Services

```bash
# Local
docker compose --profile agents up -d

# On AWS EC2 (SSH in first)
docker compose --profile agents up -d --build
```

Verify (all 4 must show healthy):
```
NAME          STATUS
10x-server    Up (healthy)   :8181
10x-mcp       Up (healthy)   :8051
10x-agents    Up (healthy)   :8052
10x-ui        Up (healthy)   :3737
```

### Verify AI Agent

```bash
docker logs 10x-agents 2>&1 | grep -E "coding|Initialized|OPENAI"
# Expected: INFO: Initialized coding agent with model: openai:gpt-4o-mini
```

### Optional: Clean Demo Data

```sql
-- Preserves users and org — removes demo data for fresh start
DELETE FROM archon_agent_task_reviews;
DELETE FROM archon_task_acknowledgements;
DELETE FROM archon_task_status_history;
DELETE FROM archon_task_comments;
DELETE FROM archon_task_dependencies;
DELETE FROM archon_tasks;
DELETE FROM archon_velocity_history;
DELETE FROM archon_sprints;
DELETE FROM archon_project_memberships;
DELETE FROM archon_projects;
DELETE FROM archon_notifications;
```

---

## DEMO SCRIPT — COMPLETE WALKTHROUGH

---

### SCENE 1 — Signup and Organization (2 min)

**SAY:** "We start from zero — no configuration files, no database setup. Under 60 seconds, you have a fully operational enterprise PM platform."

**DO — Open browser → `http://<YOUR-IP>:3737`**

1. Click **"Sign up"**
2. Fill:
   - Name: `Sarah Johnson`
   - Email: `sarah@acmecorp.com`
   - Password: `SecurePass123!`
3. Click Continue
4. Organization Name: `Acme Corporation`
5. Click **"Create Organization"**

**SEE:** Admin Dashboard loads immediately.

**HIGHLIGHT:**
- First user → automatically Owner role
- Full 7-level role hierarchy auto-configured
- Agent system users (Coding Agent, Archon) seeded automatically on every server boot
- Zero SQL or config needed

---

### SCENE 2 — Admin Dashboard (1 min)

**SAY:** "Owners land on the Admin Dashboard — a live snapshot of the entire organization."

**DO — Look at dashboard:**
- Members by role
- Active projects count
- Tasks by status: Backlog / Todo / Doing / Review / Done
- Active and total sprints
- Pending invitations

**HIGHLIGHT:** "Every number is live, auto-refreshing every 10 seconds. Smart polling pauses when you switch tabs — no wasted bandwidth."

---

### SCENE 3 — Connect AI Provider (1 min)

**SAY:** "One API key unlocks AI task suggestions, sprint planning, and agent auto-execution."

**DO — Settings → AI Agent:**
1. Click Settings icon in sidebar
2. Navigate to **AI Agent**
3. Select provider: OpenAI
4. Paste your OpenAI API key
5. Click **Save**

**Verify:**
```bash
curl -s http://<IP>:8181/api/ai/providers
# {"openai": {"available": true, "status": "Ready"}}
```

**HIGHLIGHT:** Multi-provider support — OpenAI GPT-4o-mini (default), GPT-4o, Anthropic Claude, or Ollama for fully private local AI.

---

### SCENE 4 — Invite Team Members (2 min)

**SAY:** "Role-based invitations. One security rule: you can never grant a role equal to or above your own."

**DO — Team → Invite User:**
1. Email: `john.doe@acmecorp.com`
2. Role: `Lead`
3. Click **Send Invitation**

**SEE:** Appears in Pending Invitations. Invitation email sent via SendGrid.

**Role Hierarchy:**
```
Owner > Admin > Manager > Lead > Member > Viewer > AI Agent
```

Each level can only invite roles strictly below their own.

**DO — Accept invitation (simulate John):**
Open new browser tab → navigate to invite URL → fill John's name and password.

**SEE:** John appears in Team Members list with role Lead.

---

### SCENE 5 — Create Project via MCP (2 min)

**SAY:** "Developers never leave their IDE. From Claude Code, they manage the entire project in natural language."

**DO — In Claude Code:**
```
Create a new project called "Mobile App Redesign Q1 2026"
Description: Complete overhaul of iOS and Android apps with new design system and authentication layer
```

**SEE:**
```json
{
  "id": "proj-abc123",
  "title": "Mobile App Redesign Q1 2026",
  "task_counts": { "backlog": 0, "todo": 0, "doing": 0, "review": 0, "done": 0 }
}
```

**DO — Switch to browser → Projects → click "Mobile App Redesign Q1 2026"**

**SEE:** 5-column Kanban board: `Backlog | Todo | Doing | Review | Done`

**HIGHLIGHT:** "Five stages — not three. Backlog → Todo → Doing → Review → Done mirrors real agile. The extra stages aren't cosmetic — each triggers different business rules and auto-timestamps."

---

### SCENE 6 — AI Magic Moment: Project Setup (3 min)

**SAY:** "This is the Magic Moment. The AI analyzes your project description and suggests the exact tasks your team needs — organized by priority, with estimates and assignments."

**DO — Browser → AI Page (brain icon in sidebar):**
1. Click **"Start New Project with AI"**
2. Project name: `E-Commerce Platform`
3. Description: `React Native shopping app with payments, product catalog, user auth, and push notifications`
4. Click **"Generate AI Tasks"**

**SEE — Modal opens:**
```
🤖 AI Task Suggestions — 8 tasks suggested for E-Commerce Platform

Priority  Task                           Points  Assignee        Agent?
────────  ─────────────────────────────  ──────  ──────────────  ──────
CRITICAL  Setup Authentication Flow       8pts   User            No
HIGH      Product Catalog API             5pts   User            No
HIGH      Payment Integration             8pts   User            No
HIGH      Cart & Checkout UI              5pts   Sarah Johnson   No
MEDIUM    Push Notification Service       3pts   User            No
MEDIUM    Write API Documentation         3pts   Coding Agent    ✓
MEDIUM    Performance Testing Plan        2pts   User            No
LOW       Analytics Dashboard             3pts   User            No

Confidence: 78% | Based on similar projects | Accept All / Modify / Skip
```

**HIGHLIGHT:**
- AI identified "Write API Documentation" as agent-suitable (agent_suitable: true)
- Confidence score from pattern matching against historical projects
- One click creates all tasks

**DO:** Click **"Accept All"** → tasks created → now visible on Kanban board.

---

### SCENE 7 — Board View vs Table View (2 min)

**SAY:** "Two views for different work styles. Board for visual thinkers, table for data-driven teams."

**DO — Board View (default):**
Drag "Setup Authentication Flow" from **Backlog** to **Todo**.

**SEE:** Card smoothly moves. Status updates instantly via optimistic update.

**DO — Switch to Table View (grid icon top-right):**

**SEE:** Spreadsheet layout: Title | Status | Priority | Assignee | Story Points | Due Date | Tags

**DO — Inline editing in table:**
1. Click status cell → dropdown appears
2. Click priority → priority selector
3. Click assignee → user/agent dropdown

**HIGHLIGHT:** "Same data, both views stay in perfect sync via TanStack Query. No reload needed."

---

### SCENE 8 — Priority Filter (1 min)

**SAY:** "When you have 30 tasks on the board, one click to focus on what matters."

**DO — Priority dropdown in view controls:**
1. Select **"Critical"** → only critical tasks shown
2. Select **"High"** → only high tasks
3. Select **"All"** → restore all

---

### SCENE 9 — Task Dependencies — The Enforcer (3 min)

**SAY:** "Dependencies prevent teams from starting blocked work. Two layers: the UI prevents the drag, the API rejects the HTTP call. No workarounds."

**DO — Open Task Edit Modal for "Product Catalog API":**
1. Click on the task card
2. Scroll to **Dependencies** section
3. In "Blocked by" ComboBox, search → select "Setup Authentication Flow"
4. The chip appears: "Blocked by: Setup Authentication Flow"

**SEE:** "Product Catalog API" now shows a 🔒 lock badge with "1" on its Kanban card.
Hover → tooltip: "Blocked by: Setup Authentication Flow (todo)"

**DO — Try to drag "Product Catalog API" to Doing column:**

**SEE — Toast message:**
```
Cannot start: 1 blocker must be completed first
• Setup Authentication Flow (todo)
```
Task snaps back. Zero state change.

**DO — Server-side enforcement (show the API):**
```bash
curl -X PUT http://<IP>:8181/api/tasks/<catalog-id> \
  -H "X-User-Id: <user-id>" \
  -d '{"status": "doing"}'
```

**SEE:**
```json
{ "detail": "Task is blocked by: Setup Authentication Flow (todo)" }
```

**HIGHLIGHT:** "Even if someone bypasses the UI and writes a script directly against the API, the server says no."

**DO — Complete the blocker:**
Drag "Setup Authentication Flow" → Doing → Review → Done.

**SEE:** 🔒 lock badge disappears from "Product Catalog API". It can now be dragged to Doing.

---

### SCENE 10 — WIP Limits (1 min)

**SAY:** "Research shows multitasking destroys productivity. WIP limits cap active work at 3 tasks per person — server-side, not just a suggestion."

**DO — Move 3 tasks assigned to Sarah to Doing. Try a 4th:**

```bash
curl -X PUT http://<IP>:8181/api/tasks/<fourth-task-id> \
  -H "X-User-Id: <user-id>" \
  -d '{"status": "doing", "assignee": "Sarah Johnson"}'
```

**SEE:**
```json
{ "detail": "WIP limit reached: 'Sarah Johnson' already has 3 task(s) in progress." }
```

---

### SCENE 11 — Task Comments with @Mentions (1 min)

**SAY:** "Threaded comments on every task. Mention a team member to instantly notify them."

**DO — Click any task → scroll to Comments:**
Type: `@john.doe Please review the auth implementation before Friday. Paying attention to the JWT refresh token flow.`

**SEE:**
- Comment posted with Sarah's name and avatar
- John's bell icon shows +1 unread
- `@john.doe` renders as highlighted mention

---

### SCENE 12 — Sprint Planning (3 min)

**SAY:** "Full agile sprint management. Not just labels — actual capacity planning, burndown tracking, and velocity history."

**DO — Via MCP in Claude Code:**
```
Create a sprint called "Foundation Sprint" for Mobile App Redesign Q1 2026
Goal: Core authentication and initial catalog setup
Start: 2026-02-19   End: 2026-03-04   Capacity: 160 hours
```

**SEE:**
```json
{ "id": "sprint-001", "name": "Foundation Sprint", "status": "planning", "capacity_hours": 160 }
```

**DO — Add tasks to sprint:**
```
Add Setup Authentication Flow, Product Catalog API, and Write API Documentation to Foundation Sprint
```

**DO — Check capacity:**
```
Show me the capacity summary for Foundation Sprint
```

**SEE:**
```json
{
  "sprint_name": "Foundation Sprint",
  "status": "planning",
  "total_story_points": 16,
  "total_estimated_hours": 24,
  "capacity_hours": 160,
  "capacity_utilization_percent": 15.0
}
```

**DO — Start the sprint:**
```
Start Foundation Sprint
```

**SEE:** Sprint status → "active". All project members receive notification: "Foundation Sprint has started."

---

### SCENE 13 — Sprint Analytics: Burndown & Velocity (2 min)

**SAY:** "Predictive analytics. Not just what happened — whether you'll hit your deadline."

**DO — Browser → Project → Analytics tab:**

**Burndown Chart:**
```
Story Points
    16 │╲ ← Ideal burndown (computed from sprint duration)
    12 │ ╲─╮
     8 │   ╲─╮  ← Actual remaining work
     4 │     ╲╯
     0 └──────────────────── Day
              0              14
  Status: ON TRACK — projected complete by Mar 4
```

**Velocity Chart (after first sprint completes):**
```
Story Points Completed per Sprint
│
│    ▓▓▓
│    ▓▓▓  ▓▓▓
│    ▓▓▓  ▓▓▓  ▓▓▓
│    ▓▓▓  ▓▓▓  ▓▓▓
└────────────────────
  Sprint1  Sprint2  Sprint3
  Avg: 14.3 pts/sprint
```

**HIGHLIGHT:** "Velocity is automatically recorded the moment you complete a sprint. Zero manual logging. Your prediction engine grows smarter with every sprint."

---

### SCENE 14 — Notifications System (1 min)

**SAY:** "Every meaningful event becomes a notification. Your team always knows what needs their attention."

**DO — Click bell icon in sidebar:**

**SEE:**
```
🔔 Notifications (4 unread)

● Foundation Sprint has started                    2 min ago
● Sarah mentioned you in "Auth Flow"               5 min ago
● Task "Product Catalog API" is now unblocked      8 min ago
● Task "Write API Documentation" assigned to you   12 min ago

[Mark All Read]
```

Click any notification → navigates directly to the task or sprint. Marked read automatically.

**12+ event types:** task_assigned, mentioned, sprint_started, sprint_completed, dependency_resolved, review_requested, due_date_approaching, agent_completed, agent_approved/rejected...

---

### SCENE 15 — Full Human Task Lifecycle with Audit Trail (2 min)

**SAY:** "Every status transition is timestamped. Cycle time, lead time, and rework rate — all computable automatically."

**DO — Move "Product Catalog API" through all stages:**

```
Move Product Catalog API to todo → doing → review → done
```

**After done, query the audit trail:**
```sql
SELECT old_status, new_status, created_at
FROM archon_task_status_history
WHERE task_id = '<catalog-id>'
ORDER BY created_at;
```

**SEE:**
```
old_status  new_status  created_at                minutes
──────────  ──────────  ──────────────────────    ───────
backlog     todo        2026-02-19 09:00:00       —
todo        doing       2026-02-19 09:15:00       15 min
doing       review      2026-02-19 11:30:00       135 min
review      done        2026-02-19 11:35:00       5 min
```

**HIGHLIGHT:** "Lead time, cycle time, review time — all extractable. Your process improvement data is built in from day one."

---

### SCENE 16 ★ — AI Agent Auto-Execution (5 min — THE CENTERPIECE)

**SAY:** "Now the thing that makes this genuinely different from every project management tool in existence. I'm going to assign a task to the Coding Agent. Then I'm going to step back and not touch anything. Watch what happens."

**DO — Open two terminals:**

Terminal 1 (server):
```bash
docker logs -f 10x-server 2>&1 | grep -E "dispatcher|claimed|agent"
```

Terminal 2 (agents):
```bash
docker logs -f 10x-agents
```

**DO — Create the task via MCP:**
```
Create a task called "Write full REST API documentation"
Assignee: Coding Agent
Priority: high
Story points: 3
Description: Document all 123 REST API endpoints with request parameters, response schemas, authentication requirements, and example payloads. Group by domain: auth, projects, tasks, sprints, analytics, AI, knowledge base.
```

**SAY:** "Task created. Status is 'backlog'. I'm starting a timer. The dispatcher polls every 30 seconds."

**WATCH — Server log (within 30s):**
```
Task dispatcher: found 1 pending agent task(s)
Task dispatcher: claimed 'Write full REST API documentation' → dispatching to Coding Agent
```

**DO — Check task:**
```
Show me the current status of "Write full REST API documentation"
```

**SEE:** `"status": "doing"` — zero human clicks.

**SAY:** "It's doing. The dispatcher claimed it, posted an acknowledgment comment, and sent it to the agents service. All in under 30 seconds."

**WATCH — 2-3 minutes later, agents log:**
```
INFO: POST /agents/execute-task HTTP/1.1  200 OK
```

**DO — Check again:**
```
What is the status of "Write full REST API documentation" now?
```

**SEE:** `"status": "review"` — agent completed, output posted as comment, moved to review queue.

**SAY:** "Three automatic steps. Zero human action required:
1. Task detected and claimed in under 30 seconds
2. Agent searched the knowledge base for context
3. Output posted as a comment — task moved itself to Review"

---

### SCENE 17 — View Agent Output in UI (1 min)

**DO — Browser → Find "Write full REST API documentation" in Review column:**

Click card → scroll to Comments.

**SEE:**
```
🤖 Coding Agent output:

## REST API Documentation

### Authentication Endpoints
- POST /api/auth/signup
  Request: { email, password, display_name, org_name }
  Response: { user: {...}, organization: {...} }
  Auth required: No (public endpoint)

- POST /api/auth/login
  Request: { email, password }
  Response: { user: {...}, session_token: "..." }
  Auth required: No

### Project Endpoints
- GET /api/projects
  Response: Array<Project> with task_counts
  Auth: Yes (any role)
  Caching: ETag enabled (~70% bandwidth reduction)

[... continues for all 123 endpoints ...]

Confidence: 0.80 | Blockers: None identified.
```

**HIGHLIGHT:** "Real output, real attribution, full audit trail. Under its own identity — not a ghost."

---

### SCENE 18 — Human Supervisor Approves Agent Work (1 min)

**SAY:** "Human in the loop. The agent cannot mark its own work done. A supervisor must review and approve. This is not a suggestion — it's a hardcoded security rule."

**DO:**
```bash
curl -X POST http://<IP>:8181/api/agent/tasks/<TASK_ID>/approve \
  -H "X-User-Id: <user-id>" \
  -d '{ "quality_score": 8, "comments": "Excellent. Covers all 123 endpoints." }'
```

**SEE:**
```json
{ "message": "Work approved", "task_status": "done", "quality_score": 8 }
```

**DO — Rejection scenario:**
```bash
curl -X POST http://<IP>:8181/api/agent/tasks/<TASK_ID>/reject \
  -H "X-User-Id: <user-id>" \
  -d '{ "feedback": "Missing authentication details for admin endpoints 8–12." }'
```

**SEE:** `"task_status": "doing"` — agent receives feedback, reworks on next poll cycle.

---

### SCENE 19 — AI Intelligence Dashboard (2 min)

**SAY:** "The AI doesn't just run once — it learns from every task completion in your organization. Over time, it knows your team better than any PM tool ever has."

**DO — Browser → AI Intelligence page (brain icon):**

**Team Intelligence section:**
```
Sarah Johnson
  Skills: backend, api-design, auth
  Preferred types: feature, integration
  Approval rate: 91%    Data points: 47

John Doe
  Skills: frontend, mobile, design
  Preferred types: ui, testing
  Approval rate: 88%    Data points: 32
```

**Quality Patterns section:**
```
High-Rejection Task Types (watch these):
  frontend UI      38% rejection rate
  → Tips: Include mobile screenshots, run Storybook first

  security review  29% rejection rate
  → Tips: Checklist OWASP top 10, include threat model
```

**Model Accuracy:**
```
Month     Suggestions  Accepted  Accuracy
────────  ───────────  ────────  ────────
2026-02   34           28        82.4%
2026-01   21           16        76.2%
2025-12   12           8         66.7%
```

**HIGHLIGHT:** "Accuracy is improving every month. The more your team uses it, the smarter the suggestions get."

---

### SCENE 20 — Knowledge Base (2 min)

**SAY:** "The Coding Agent doesn't hallucinate — it searches YOUR indexed documentation before answering. Ground truth, not guesswork."

**DO — Knowledge Base → Crawl Website:**
1. Enter URL: your docs site
2. Depth: 3
3. Click Crawl

**SEE:** Progress indicator, pages being indexed into pgvector.

**DO — Semantic search:**
```
Search the knowledge base for "authentication JWT token refresh flow"
```

**SEE:** Returns semantically relevant chunks from your own documentation.

**HIGHLIGHT:** "pgvector in PostgreSQL. No external vector DB needed. Your docs, your server, fully private."

---

### SCENE 21 — Complete the Sprint (1 min)

**SAY:** "Sprint completion is one call. Velocity is recorded automatically — no manual logging ever."

**DO:**
```
Complete Foundation Sprint — all tasks are done
```

**SEE:**
- Sprint status → "completed"
- `archon_velocity_history` receives a new row automatically:
  ```json
  { "sprint_name": "Foundation Sprint", "story_points_completed": 16, "tasks_completed": 5 }
  ```
- All project members notified: "Foundation Sprint completed — 16 story points delivered"
- Velocity chart in Analytics updates

---

### SCENE 22 — MCP Tools in IDE (2 min)

**SAY:** "Developers get 17 natural-language tools. An entire sprint — create, populate, start, check capacity, complete — without opening a browser."

**DO — Show in Claude Code:**
```
Show me all projects

Create a sprint for Q2 planning

Show me team velocity for the last 3 sprints

Which tasks are blocked in Mobile App Redesign?

Search the knowledge base for React Query stale time patterns

Show me Sarah's team intelligence profile

What task types have the highest rejection rates?
```

**HIGHLIGHT:** "17 tools covering projects, tasks, sprints, dependencies, analytics, knowledge base, and AI learning. Works in Claude Code, Cursor, and Windsurf."

---

### SCENE 23 — Security Deep Dive (2 min)

**SAY:** "Four independent layers of security. Bypass one, the next stops you."

**DO — Show the 4-layer model:**
```
Layer 1: UI            → Hides buttons by role
Layer 2: API Middleware → 72 permission rules
Layer 3: Service Logic  → WIP limits, transitions, dependency gates
Layer 4: PostgreSQL RLS → Row-level security on every table
```

**Key rules:**
```
• human_only: true on approve / delete / grant-role
  → Agent can NEVER call these endpoints (hardcoded, not configurable)
• WIP limit: 3 active tasks per person (service layer)
• Dependency gate: blocked task cannot move to doing (service layer)
• Role escalation: nobody can grant a role equal/above their own (permission middleware)
```

---

### SCENE 24 — Admin Dashboard Summary (1 min)

**SAY:** "Everything a stakeholder needs in one screen."

**DO — Admin Dashboard:**

```
ACME CORPORATION

Members: 3       Projects: 2 active
  Owner: 1
  Lead:  1       Tasks by Status:
  Member: 1        Backlog: 2  Todo: 1  Doing: 0  Review: 1  Done: 8

Sprints: 2 total  |  Active: 1  |  Completed: 1
Pending Invitations: 0
```

---

## TROUBLESHOOTING TABLE

| Symptom | Cause | Fix |
|---------|-------|-----|
| Task never leaves backlog | Agents container not running | `docker compose --profile agents up -d` |
| 500 on drag-and-drop | Status history trigger bug | Run STEP 1 SQL in Supabase |
| Task → doing, then stuck | OpenAI key missing | Settings → AI Agent → add key |
| "0 tasks suggested" | AI provider unavailable | Settings → AI Agent → add key → try again |
| Modal shows "Configure API key" | No AI provider configured | Settings → AI Agent |
| UUID guard 500 errors | Fixed in latest build | Rebuild frontend |
| Sprint 404 in console | Fixed — now returns 200+null | Rebuild frontend |
| Frontend changes not showing | Restart not enough | `docker compose up --build -d frontend` |
| MCP tools not connecting | Wrong URL format | URL must end with `/sse` |

---

## CONDENSED 20-MINUTE DEMO SCRIPT

1. **Signup & org** (1 min) — create account, land on admin dashboard
2. **AI Key** (30s) — Settings → AI Agent → paste key
3. **AI Magic Moment** (3 min) — create project on AI page → watch task suggestions appear
4. **Kanban board** (1 min) — show 5 columns, drag a task, show priority filter
5. **Dependencies** (2 min) — add blocker, try to drag blocked task, show toast error
6. **Sprint** (2 min) — create, add tasks, start, show capacity and burndown
7. **Agent task** ★ (5 min) — assign task to Coding Agent, show logs, watch it complete
8. **Human approval** (1 min) — approve agent work via curl, task moves to Done
9. **AI Intelligence** (1 min) — show team profiles, quality patterns, accuracy trend
10. **MCP tools** (1 min) — show natural language commands in IDE
11. **Security** (30s) — show 4-layer architecture diagram

---

## COMPLETE FEATURE CHECKLIST

### Authentication & Organization
- [x] Signup with email/password (public endpoint)
- [x] Organization creation on first signup
- [x] JWT session management
- [x] 7-level role hierarchy
- [x] Email invitations (role-scoped)
- [x] Role-aware dashboards

### Project Management
- [x] Create / update / delete projects
- [x] Project documents with version history
- [x] GitHub repo linking
- [x] Version snapshots and restore

### Task Management
- [x] 5-stage lifecycle: backlog → todo → doing → review → done
- [x] Stage transition validation (server enforced)
- [x] `started_at` auto-stamped on → doing
- [x] `completed_at` auto-stamped on → done
- [x] Full status history audit log
- [x] WIP limits (max 3 in-progress per person)
- [x] Priority: critical / high / medium / low
- [x] Story points (Fibonacci)
- [x] Estimated / actual hours
- [x] Due dates
- [x] Tags (multi-tag, filterable)
- [x] Reviewer assignment
- [x] Parent task / subtask hierarchy
- [x] Archived tasks (soft delete)
- [x] Task comments with @mentions
- [x] Task dependencies (blocking relationships)
- [x] Circular dependency detection (DFS)
- [x] Dependency enforcement on status transitions
- [x] Priority filter (board and table views)
- [x] Kanban board (5 columns, drag-and-drop)
- [x] Table view (inline editing, row reorder)

### Sprint Management
- [x] Sprint CRUD (planning → active → completed)
- [x] Capacity hours per sprint
- [x] Task assignment to sprints
- [x] Active sprint tracking
- [x] Sprint capacity summary
- [x] Burndown chart (ideal vs actual)
- [x] Velocity chart (trend over sprints)
- [x] Velocity auto-recorded on sprint completion
- [x] Team performance metrics
- [x] Sprint notifications (started / completed)

### AI Agent System
- [x] Task Dispatcher (asyncio, 30s poll)
- [x] Picks up backlog and todo tasks assigned to agents
- [x] Optimistic lock (no double-pickup)
- [x] Coding Agent (PydanticAI + GPT-4o-mini)
- [x] Agent searches knowledge base during execution
- [x] Output posted as comment with attribution
- [x] Acknowledgement records with confidence score
- [x] Human supervisor approval required (human_only enforced)
- [x] Quality scores stored on approval
- [x] Rejection flow (returns to doing with feedback)
- [x] Global agent system users (auto-seeded on boot)

### AI Self-Learning Module
- [x] Magic Moment: AI task suggestions on project creation
- [x] DB triggers auto-capture task events into ai_observations
- [x] Pattern extraction: project templates, task blueprints
- [x] Team intelligence profiles (skills, approval rates, preferred types)
- [x] Quality patterns (rejection rates by task type + prevention tips)
- [x] Duration estimates from historical data
- [x] Model accuracy tracking (monthly)
- [x] Feedback loop: accept/reject/modify trains future suggestions
- [x] Cold-start handling (no template → clear error message)
- [x] Per-user API key support (stored encrypted in DB)

### Analytics
- [x] Sprint burndown chart
- [x] Velocity trend chart
- [x] Sprint capacity card
- [x] Team performance metrics
- [x] Sprint timeline
- [x] SQL views: sprint_capacity_summary, project_velocity_summary

### Notifications
- [x] Real-time unread count (bell badge)
- [x] Notification panel
- [x] Mark individual / all as read
- [x] Delete notification
- [x] Click-to-navigate
- [x] 12+ event types

### MCP Integration (AI IDE Tools)
- [x] find_projects / manage_project
- [x] find_tasks / manage_task
- [x] find_task_dependencies / manage_task_dependency
- [x] find_documents / manage_document
- [x] find_sprints / manage_sprint / get_sprint_capacity / assign_task_to_sprint
- [x] rag_search_knowledge_base / rag_search_code_examples
- [x] rag_get_available_sources / rag_list_pages_for_source / rag_read_full_page
- [x] suggest_project_setup / get_team_intelligence / get_quality_patterns / manage_ai_learning
- [x] Works in Claude Code, Cursor, Windsurf

### Knowledge Base
- [x] Web crawling with depth control
- [x] Document upload (PDF, markdown, text)
- [x] pgvector embeddings in PostgreSQL
- [x] Semantic search
- [x] Code example extraction
- [x] Source management

### Security
- [x] 4-layer defense (UI → API → Service → Database)
- [x] 72 permission rules
- [x] Row-Level Security (PostgreSQL)
- [x] `human_only` flag (agents cannot approve/delete/grant roles)
- [x] WIP limit enforcement
- [x] Full audit log (archon_user_activity_log)
- [x] JWT authentication

### Infrastructure
- [x] 4 Docker services (server, mcp, agents, frontend)
- [x] ETag caching (~70% bandwidth reduction)
- [x] TanStack Query smart polling (pauses in background tab)
- [x] Optimistic UI updates (instant feedback)
- [x] Request deduplication
- [x] Multi-AI provider support
- [x] UUID validation guards (no 500s from optimistic IDs)
- [x] AWS EC2 deployment ready

---

## WHAT EVERYTHING BUILT — SUMMARY TABLE

| Component | Details |
|-----------|---------|
| Database | 41 tables + pgvector, 3 analytics views, 15+ triggers, 9 AI learning tables |
| Backend API | 123 REST endpoints, permission middleware, ETag caching, 72 permission rules |
| MCP Tools | 17 tools, works in Claude Code / Cursor / Windsurf |
| Task Lifecycle | 5 stages, transition validation, WIP limits, auto-timestamps, audit log |
| Task Dependencies | Blocking relationships, DFS circular detection, enforced server + client |
| Sprint System | Planning → active → completed, capacity, burndown, velocity auto-record |
| AI Agent System | Background dispatch every 30s, claim lock, executes, posts output, review queue |
| AI Self-Learning | 9 DB tables, DB triggers, batch processing, team intelligence, quality patterns |
| Magic Moment | AI task suggestions on project creation, confidence scoring, feedback loop |
| Knowledge Base | Web crawler, pgvector search, code extraction, RAG-grounded agent responses |
| Analytics | Burndown, velocity trends, team performance, capacity warnings |
| Notifications | 12+ event types, smart polling, click-to-navigate, mark-all-read |
| Team Management | 7 roles, email invitations, role-scoped grants, org hierarchy |
| Security | 4 layers, 72 rules, PostgreSQL RLS, human_only enforcement |
| Infrastructure | Docker Compose, AWS ready, ETag caching, optimistic updates |

---

```
Local:   http://localhost:3737 (UI)  |  :8181 (API)  |  :8051 (MCP)  |  :8052 (Agents)
AWS:     http://<EC2-IP>:3737 (UI)  |  :<EC2-IP>:8181 (API)  |  :8051 (MCP)  |  :8052 (Agents)
```

*Version 5.0 — Complete Feature Coverage*
