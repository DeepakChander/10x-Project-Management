# 10x PM - Complete Demo Script Using MCP Skill

**Step-by-step guide to demonstrate the entire system using Claude Code**

**Duration:** 20 minutes
**Audience:** Stakeholders, investors, customers
**Method:** Live demo using MCP skill commands

---

## Pre-Demo Setup (5 minutes)

### 1. Clean Database

Run in Supabase SQL Editor:
```sql
DELETE FROM archon_user_sessions;
DELETE FROM archon_task_comments;
DELETE FROM archon_invitations;
DELETE FROM archon_notifications;
DELETE FROM archon_tasks;
DELETE FROM archon_sprints;
DELETE FROM archon_projects;
DELETE FROM archon_project_memberships;
DELETE FROM archon_org_memberships;
DELETE FROM archon_teams;
DELETE FROM archon_departments;
DELETE FROM archon_organizations;
DELETE FROM archon_users_profile;
```

### 2. Start Services

```bash
cd C:\Users\hp\Desktop\10x-Project-Management
docker compose up -d
```

### 3. Open Claude Code

Open your IDE with Claude Code installed.

---

## DEMO SCRIPT - Execute in Claude Code

### Scene 1: Account Creation (Browser)

**SAY:** "Let me show you how easy it is to get started."

**DO:**
1. Open browser → `http://localhost:3737`
2. Auto-redirects to Login
3. Click "Sign up"
4. Fill form:
   - Name: Sarah Johnson
   - Email: sarah@acmecorp.com
   - Password: Demo2026!
   - Org: Acme Corporation
   - Domain: acmecorp.com
5. Click "Create Organization"

**RESULT:**
- User created ✅
- Organization created ✅
- Department "General" created ✅
- Team "General" created ✅
- Sarah is Owner ✅
- Redirected to Dashboard

**HIGHLIGHT:** "Within 30 seconds, complete PM system ready."

---

### Scene 2: Invite Team Member (Browser + MCP)

**SAY:** "Now let's invite a team member."

**METHOD 1: Via Browser**

1. Click "Team" icon in sidebar
2. Click "Invite Team Member"
3. Fill form:
   - Email: john@acmecorp.com
   - Role: Lead
   - Message: "Welcome to the Mobile App project!"
4. Click "Send Invitation"

**RESULT:**
- Email sent ✅
- Shows in pending invitations ✅

**METHOD 2: Via MCP (Alternative)**

In Claude Code, type:
```
Using 10x PM skill, invite john@acmecorp.com as a team lead
```

Claude Code will execute:
```python
POST /api/invitations/{org_id}
{
  "email": "john@acmecorp.com",
  "role": "lead",
  "personal_message": "Welcome!"
}
```

**HIGHLIGHT:** "Invitations can be sent via UI or programmatically via API."

---

### Scene 3: Accept Invitation (Browser)

**SAY:** "The invitee receives an email. Let me show the acceptance flow."

**DO:**
1. Get invite link from database:
```sql
SELECT invite_link FROM archon_invitations
ORDER BY created_at DESC LIMIT 1;
```

2. Copy link, open in new browser tab
3. See invitation page showing:
   - Email: john@acmecorp.com
   - Role: Lead
4. Fill form:
   - Name: John Smith
   - Password: Lead2026!
5. Click "Accept & Create Account"

**RESULT:**
- Account created ✅
- Role assigned (Lead) ✅
- Added to organization ✅
- Auto-logged in ✅
- Redirected to dashboard ✅

**HIGHLIGHT:** "Team member is now active and can start working."

---

### Scene 4: Create Project (MCP)

**SAY:** "Now we'll create a project using AI assistance."

**In Claude Code, type:**
```
Using 10x PM, create a new project called "Mobile App Redesign Q1 2026"
with description "Complete overhaul of iOS and Android apps with modern UI/UX"
```

**Claude Code executes:**
```python
# Using 10x-PM skill
POST /api/projects
{
  "title": "Mobile App Redesign Q1 2026",
  "description": "Complete overhaul of iOS and Android apps with modern UI/UX"
}
```

**RESULT:**
- Project created ✅
- Visible in browser ✅
- Project ID returned ✅

**HIGHLIGHT:** "Projects can be created via UI or AI assistant."

---

### Scene 5: Upload Knowledge Base (MCP)

**SAY:** "Let's add documentation to the knowledge base."

**In Claude Code, type:**
```
Using 10x PM skill, crawl the React documentation at https://react.dev/learn
to build our knowledge base
```

**Claude Code executes:**
```python
POST /api/knowledge-items/crawl
{
  "url": "https://react.dev/learn",
  "crawl_depth": 2,
  "follow_links": true
}
```

**RESULT:**
- Documentation indexed ✅
- RAG search enabled ✅
- Knowledge base populated ✅

**HIGHLIGHT:** "AI can now search React docs to help with development."

---

### Scene 6: Create Sprint (MCP)

**SAY:** "Let's plan our first sprint."

**In Claude Code, type:**
```
Using 10x PM, create Sprint 1 for the Mobile App Redesign project
with capacity of 160 hours, starting today for 2 weeks
```

**Claude Code executes:**
```python
# Get project ID first
projects = GET /api/projects
project_id = projects[0]['id']

# Create sprint
POST /api/projects/{project_id}/sprints
{
  "name": "Sprint 1 - Foundation",
  "goal": "Setup project structure",
  "capacity_hours": 160,
  "start_date": "2026-02-17",
  "end_date": "2026-03-03"
}

# Start sprint
PUT /api/sprints/{sprint_id}
{ "status": "active" }
```

**RESULT:**
- Sprint created ✅
- Notification sent ✅
- Visible in browser Sprint tab ✅

---

### Scene 7: Create Tasks (MCP)

**SAY:** "Now we create tasks. Watch AI assist."

**In Claude Code, type:**
```
Using 10x PM, create the following tasks for Mobile App Redesign:
1. Design new login screen - high priority
2. Implement authentication API - high priority
3. Create user profile page - medium priority
4. Write API documentation - low priority

Assign task 1 and 2 to John Smith, task 3 to Sarah, task 4 to AI agent for later.
```

**Claude Code executes:**
```python
# Task 1
POST /api/tasks
{
  "project_id": project_id,
  "title": "Design new login screen",
  "description": "Create modern, accessible login UI",
  "assignee": "John Smith",
  "priority": "high",
  "status": "todo"
}

# Task 2
POST /api/tasks
{
  "project_id": project_id,
  "title": "Implement authentication API",
  "assignee": "John Smith",
  "priority": "high"
}

# Task 3...
# Task 4...
```

**RESULT:**
- 4 tasks created ✅
- Assigned to team members ✅
- Notifications sent ✅
- Visible in browser ✅

---

### Scene 8: AI Task Estimation (MCP)

**SAY:** "Let's get AI to estimate these tasks."

**In Claude Code, type:**
```
Using 10x PM, estimate how long task "Design new login screen" will take
```

**Claude Code executes:**
```python
# Get task ID
tasks = GET /api/tasks?project_id={project_id}
task_id = tasks[0]['id']

# AI estimation
POST /api/ai/tasks/{task_id}/estimate?project_id={project_id}
```

**RESULT:**
```json
{
  "story_points": 5,
  "duration_hours": 8,
  "confidence": 0.85,
  "reasoning": "Based on UI complexity and authentication requirements..."
}
```

**HIGHLIGHT:** "AI analyzes the task and provides accurate estimates based on historical data."

---

### Scene 9: AI Sprint Planning (MCP)

**SAY:** "Now watch AI plan the entire sprint."

**In Claude Code, type:**
```
Using 10x PM, use AI to plan Sprint 1 with our 160 hour capacity
```

**Claude Code executes:**
```python
POST /api/ai/projects/{project_id}/plan-sprint
{
  "sprint_capacity_hours": 160
}
```

**RESULT:**
```json
{
  "recommended_tasks": ["task-1", "task-2", "task-3"],
  "total_story_points": 42,
  "capacity_utilization": 0.78,
  "reasoning": "Selected high-priority tasks within capacity...",
  "warnings": []
}
```

**SAY:** "AI recommends 3 tasks totaling 42 story points at 78% capacity - perfect!"

---

### Scene 10: Assign Tasks to Sprint (MCP)

**In Claude Code, type:**
```
Using 10x PM, assign all recommended tasks to Sprint 1
```

**Claude Code executes:**
```python
for task_id in recommended_tasks:
    PUT /api/tasks/{task_id}/sprint
    { "sprint_id": sprint_id }
```

**RESULT:**
- Tasks assigned to sprint ✅
- Sprint board populated ✅
- Capacity updated ✅

**In browser, show:**
- Sprint tab → Kanban board with 3 tasks
- Capacity card showing 78%

---

### Scene 11: Start Work on Task (MCP)

**SAY:** "John starts working on the login screen."

**In Claude Code, type:**
```
Using 10x PM, move task "Design new login screen" to doing status
```

**Claude Code executes:**
```python
PUT /api/tasks/{task_id}
{ "status": "doing" }
```

**RESULT:**
- Task moves to "Doing" column ✅
- `started_at` timestamp set ✅
- Notification sent to manager ✅
- Status history recorded ✅

**In browser, show:**
- Task moved to Doing column
- Notification bell lights up

---

### Scene 12: Add Comment (MCP)

**SAY:** "John adds a progress update."

**In Claude Code, type:**
```
Using 10x PM, add a comment to the login screen task:
"Completed initial wireframes. Starting high-fidelity mockups. ETA 4 hours."
```

**Claude Code executes:**
```python
POST /api/tasks/{task_id}/comments
{
  "comment_text": "Completed initial wireframes. Starting high-fidelity mockups. ETA 4 hours."
}
```

**RESULT:**
- Comment added ✅
- Visible in task details ✅
- Timestamped ✅

**In browser, show:**
- Open task → See comment with timestamp

---

### Scene 13: Submit for Review (MCP)

**SAY:** "John finishes and submits for review."

**In Claude Code, type:**
```
Using 10x PM, move the login screen task to review status
```

**Claude Code executes:**
```python
PUT /api/tasks/{task_id}
{ "status": "review" }
```

**RESULT:**
- Task moves to Review column ✅
- Reviewer (Sarah) notified ✅
- Cannot skip to "done" ✅

---

### Scene 14: Approve Task (Browser)

**SAY:** "Sarah reviews and approves."

**DO:**
1. In browser, open task
2. Review the work
3. Move to "Done" (drag or click)

**RESULT:**
- Task moves to Done ✅
- `completed_at` set ✅
- Blocked tasks unblocked ✅
- Sprint burndown updated ✅

---

### Scene 15: View Analytics (Browser)

**SAY:** "Let's see the analytics."

**DO:**
1. Click Analytics tab
2. Show sprint burndown chart
3. Point out:
   - Actual vs ideal line
   - Days remaining
   - Current velocity

**HIGHLIGHT:** "Real-time predictive analytics - we know if we'll hit the deadline."

---

### Scene 16: Register AI Agent (MCP + Browser)

**SAY:** "Now let's register an AI agent."

**In Claude Code, type:**
```
Using 10x PM, I want to register myself as an AI agent for this organization
```

**Claude Code will guide:**
1. "I'll help you register. What should be my agent name?"
   → Answer: "Claude Code"

2. "What's my webhook URL?"
   → Answer: "https://claude-agent.com/webhooks/10x"

**Claude Code executes:**
```python
# Create agent user
POST /api/auth/signup
{
  "email": "claude-agent@acmecorp.com",
  "display_name": "Claude Code Agent",
  "user_type": "agent"
}

# Generate API key
POST /api/api-keys/generate
{
  "agent_user_id": agent_id,
  "key_name": "Claude Code Production",
  "webhook_url": "https://claude-agent.com/webhooks/10x",
  "capabilities": {
    "can_create_tasks": true,
    "can_update_tasks": true,
    "can_delete_tasks": false
  },
  "supervisor_id": john_id
}
```

**RESULT:**
- Agent registered ✅
- API key generated ✅
- Webhook configured ✅
- Supervisor assigned (John) ✅

**SHOW:** API key displayed (save this!)

---

### Scene 17: Agent Creates Task (MCP)

**SAY:** "Now the AI agent can create tasks."

**In Claude Code, type:**
```
Using 10x PM skill with my agent API key, create a task
"Generate API documentation" for the Mobile App project
```

**Claude Code executes:**
```python
# Using agent's API key
POST /api/tasks
{
  "project_id": project_id,
  "title": "Generate API documentation",
  "description": "Auto-generate API docs from code",
  "assignee": "Claude Code Agent",
  "priority": "low"
}
```

**RESULT:**
- Task created by AI ✅
- Assigned to AI agent ✅
- Notification to supervisor ✅

---

### Scene 18: Agent Workflow (MCP)

**SAY:** "Watch the agent workflow in action."

**Agent receives webhook:**
```json
{
  "event": "task_assigned",
  "task_id": "...",
  "task_title": "Generate API documentation"
}
```

**Agent acknowledges:**
```python
POST /api/agent/tasks/{task_id}/acknowledge
{
  "response_time_ms": 1200,
  "message": "Task received. Processing."
}
```

**Agent evaluates and accepts:**
```python
POST /api/agent/tasks/{task_id}/accept
{
  "message": "Task accepted. Starting documentation generation."
}
```

**Task moves to "doing"** ✅

**Agent works... then submits:**
```python
POST /api/agent/tasks/{task_id}/submit-review
{
  "submission_data": {
    "documentation": "# API Documentation\n\n..."
  },
  "confidence_score": 0.92,
  "flagged_items": [],
  "message": "Documentation complete. 92% confident."
}
```

**Task moves to "review"** ✅

**Supervisor (John) approves:**
```python
POST /api/agent/tasks/{task_id}/approve?agent_id={agent_id}
{
  "quality_score": 9,
  "comments": "Excellent work!"
}
```

**Task moves to "done"** ✅

**HIGHLIGHT:** "AI agents work autonomously but require human approval - perfect balance."

---

### Scene 19: Search Knowledge Base (MCP)

**SAY:** "Let's search our knowledge base."

**In Claude Code, type:**
```
Using 10x PM, search the knowledge base for "React hooks best practices"
```

**Claude Code executes:**
```python
POST /api/knowledge-items/search
{
  "query": "React hooks best practices",
  "top_k": 5,
  "use_reranking": true
}
```

**RESULT:**
- Returns relevant React docs ✅
- Ranked by relevance ✅
- Shows match percentages ✅

**HIGHLIGHT:** "RAG-powered semantic search across all indexed documentation."

---

### Scene 20: View Sprint Progress (Browser)

**SAY:** "Let's see our sprint progress."

**DO:**
1. Click Sprint tab
2. Show:
   - 4 tasks in various columns
   - 2 done, 1 in review, 1 in doing
   - Sprint capacity at 78%
   - Burndown chart showing progress

**HIGHLIGHT:** "Real-time visibility into sprint health."

---

### Scene 21: Get Analytics (MCP)

**In Claude Code, type:**
```
Using 10x PM, show me the current sprint analytics
```

**Claude Code executes:**
```python
GET /api/analytics/projects/{project_id}/dashboard
```

**RESULT:**
```json
{
  "active_sprint": {...},
  "burndown": {...},
  "velocity_summary": {...},
  "velocity_chart": {...}
}
```

**Claude Code summarizes:**
- "Sprint 1 is 50% complete"
- "On track to finish 2 days early"
- "Team velocity: 42 points/sprint"
- "2 tasks in review, 1 in progress"

---

### Scene 22: Add Tags to Task (MCP)

**In Claude Code, type:**
```
Using 10x PM, add tags [urgent, frontend, ui] to the login screen task
```

**Claude Code executes:**
```python
PUT /api/tasks/{task_id}
{
  "tags": ["urgent", "frontend", "ui"]
}
```

**In browser, show:**
- Task now has #urgent #frontend #ui tags ✅

---

### Scene 23: View Status History (MCP)

**In Claude Code, type:**
```
Using 10x PM, show me the status history of the login screen task
```

**Claude Code executes:**
```python
GET /api/tasks/{task_id}/status-history
```

**RESULT:**
```json
[
  {"old_status": null, "new_status": "todo", "time_in_status": null},
  {"old_status": "todo", "new_status": "doing", "time_in_status": "PT2H"},
  {"old_status": "doing", "new_status": "review", "time_in_status": "PT6H"},
  {"old_status": "review", "new_status": "done", "time_in_status": "PT1H"}
]
```

**Claude Code summarizes:**
- "Task was in 'todo' for 2 hours"
- "In 'doing' for 6 hours"
- "In 'review' for 1 hour"
- "Total cycle time: 9 hours"

**HIGHLIGHT:** "Complete audit trail of every status change."

---

### Scene 24: Check Notifications (Browser)

**SAY:** "Let's check real-time notifications."

**DO:**
1. Click notification bell (🔔)
2. Show notifications:
   - "Task assigned: Design login screen"
   - "Sprint started: Sprint 1"
   - "Task completed: Design login screen"
   - "John Smith joined as Lead"

**HIGHLIGHT:** "Every action triggers notifications - team stays synchronized."

---

### Scene 25: Get Team Members (MCP)

**In Claude Code, type:**
```
Using 10x PM, list all team members
```

**Claude Code executes:**
```python
GET /api/admin/team/members
```

**RESULT:**
- Sarah Johnson (Owner)
- John Smith (Lead)
- Claude Code Agent (Agent)

**All with roles, emails, status** ✅

---

## Demo Closing

**SAY:** "In 20 minutes, we've demonstrated:

✅ **User onboarding** - Signup → Organization creation
✅ **Team building** - Invitations → Role assignment
✅ **Project setup** - Create project → Create sprint
✅ **AI assistance** - Task estimation → Sprint planning
✅ **Task management** - Create → Assign → Work → Review → Done
✅ **Agent workflow** - Register → Assign → Acknowledge → Submit → Approve
✅ **Knowledge base** - Crawl docs → RAG search
✅ **Analytics** - Burndown charts → Velocity tracking → Predictions
✅ **Real-time collaboration** - Comments → Notifications → Status updates

**This is 10x PM - making project management 10x faster, smarter, and better.**"

---

## MCP Skill Commands Reference

**All commands use:** "Using 10x PM skill, [action]"

**Examples:**
```
Using 10x PM, create a project called "..."
Using 10x PM, create a task "..." assigned to "..."
Using 10x PM, search knowledge base for "..."
Using 10x PM, estimate task "..."
Using 10x PM, show me sprint analytics
Using 10x PM, invite user@email.com as a manager
Using 10x PM, move task to review
Using 10x PM, add comment "..." to task
Using 10x PM, list all team members
```

---

## Demo Checklist

**Before Demo:**
- [ ] Clean database
- [ ] Start services (docker compose up -d)
- [ ] Test 10x PM skill connection
- [ ] Prepare browser windows
- [ ] Have Claude Code open

**During Demo:**
- [ ] Speak clearly, explain each step
- [ ] Show both MCP and browser views
- [ ] Highlight unique features (AI, agent workflow)
- [ ] Address questions as they come
- [ ] End with call-to-action

**After Demo:**
- [ ] Provide invite link to try themselves
- [ ] Share documentation
- [ ] Schedule follow-up

---

## Practice Tips

1. **Run through demo 2-3 times** before real presentation
2. **Have backup** (screenshots, video) in case of issues
3. **Test MCP skill connection** before demo
4. **Prepare for questions** (pricing, deployment, integrations)
5. **Time yourself** - keep to 15-20 minutes

---

**This demo script shows EVERYTHING you've built!** 🎯

**Practice it and crush that presentation!** 🚀

---

**SYSTEM IS 100% COMPLETE AND READY!** ✨
