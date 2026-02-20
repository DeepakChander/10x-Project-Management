# 10x PM — Complete Demo Prompts

Run these prompts **in order** inside Claude Code with the 10x MCP server connected.
Each prompt is exactly what you type. Nothing else needed.

**Works on:**
- Local: `http://localhost:8181` (MCP on `:8051`)
- AWS EC2: `http://<EC2-IP>:8181` (MCP on `:8051`)

---

## ═══ PART 1 — SYSTEM HEALTH ═══

### 1. CHECK SYSTEM IS RUNNING

```
Check if all 4 containers are healthy: server on 8181, mcp on 8051, agents on 8052, frontend on 3737
```

### 2. LIST ALL PROJECTS

```
Show me all projects in the system
```

---

## ═══ PART 2 — PROJECT CREATION ═══

### 3. CREATE THE PROJECT

```
Create a new project called "Mobile App Redesign Q1 2026" with description "Complete overhaul of iOS and Android apps with new design system, authentication layer, and payment integration"
```

### 4. CONFIRM PROJECT WAS CREATED

```
Find the project "Mobile App Redesign Q1 2026" and show me its details including task counts
```

---

## ═══ PART 3 — AI MAGIC MOMENT ═══

### 5. TRIGGER AI TASK SUGGESTIONS

```
Generate AI task suggestions for the "Mobile App Redesign Q1 2026" project — analyze the project description and suggest the best tasks to start with
```

*(This calls the Magic Moment endpoint — AI returns 5-10 suggested tasks with priorities, story points, and agent-suitable flags)*

### 6. CHECK AI LEARNING STATUS

```
Show me the status of the AI self-learning system — how many observations are pending, and what's in the knowledge stores?
```

### 7. PROCESS AI OBSERVATIONS

```
Process all pending AI observations to update the knowledge stores
```

---

## ═══ PART 4 — TASK CREATION ═══

### 8. CREATE TASK 1 — Critical, human assigned

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Implement Auth API"
Priority: critical
Story points: 8
Estimated hours: 16
Due date: 2026-03-01
Assignee: John Doe
Description: Build the full authentication API including signup, login, logout, JWT token generation and refresh endpoints
```

### 9. CREATE TASK 2 — High priority, with reviewer

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Design Login Screen"
Priority: high
Story points: 5
Estimated hours: 8
Assignee: Sarah Johnson
Reviewer: John Doe
Description: Design the login and signup screens for iOS and Android with the new design system, following Figma tokens
```

### 10. CREATE TASK 3 — Agent task (KEY DEMO MOMENT)

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Write API Documentation"
Priority: medium
Story points: 3
Assignee: Coding Agent
Description: Document all REST API endpoints with request parameters, response schemas, authentication requirements, and example payloads. Group by domain: auth, projects, tasks, sprints, analytics.
```

### 11. CREATE TASK 4 — Low priority with tags

```
Create a task in Mobile App Redesign Q1 2026:
Title: "User Testing Plan"
Priority: low
Story points: 2
Tags: testing, ux
Description: Define the user testing strategy, test cases, and success criteria for the redesigned app
```

### 12. CREATE TASK 5 — Second agent task

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Generate Sprint Retrospective Template"
Priority: low
Story points: 1
Assignee: Coding Agent
Description: Create a sprint retrospective template for the team including sections for: what went well, what needs improvement, action items, and team velocity reflection.
```

---

## ═══ PART 5 — VIEW TASKS ═══

### 13. VIEW ALL TASKS

```
Show me all tasks in Mobile App Redesign Q1 2026
```

### 14. VIEW ONLY CRITICAL AND HIGH PRIORITY

```
Show me all critical and high priority tasks in Mobile App Redesign Q1 2026
```

### 15. VIEW TASKS BY STATUS

```
Show me all tasks currently in backlog status
```

### 16. VIEW TASKS BY ASSIGNEE

```
Show me all tasks assigned to Coding Agent
```

---

## ═══ PART 6 — TASK LIFECYCLE ═══

### 17. MOVE TO TODO (start planning)

```
Move "Implement Auth API" to todo status
```

### 18. START WORKING (doing)

```
Move "Implement Auth API" to doing — John has started working on it
```

### 19. SUBMIT FOR REVIEW

```
Move "Implement Auth API" to review status — John has finished the implementation
```

### 20. APPROVE THE TASK

```
Move "Implement Auth API" to done — it has been reviewed and approved
```

---

## ═══ PART 7 — TASK DEPENDENCIES ═══

### 21. ADD A DEPENDENCY

```
Set "Design Login Screen" as blocked by "Implement Auth API" — the login screen design cannot start until the auth API is done
```

### 22. CHECK DEPENDENCIES FOR PROJECT

```
Show me all task dependencies in Mobile App Redesign Q1 2026
```

### 23. TRY TO START A BLOCKED TASK (shows enforcement)

```
Move "Design Login Screen" to doing status
```

*(This should fail with: "Cannot start: 1 blocker must be completed first")*

### 24. UNBLOCK THE TASK (auth API is now done)

```
Move "Design Login Screen" to todo status — it is now unblocked, Implement Auth API is done
```

### 25. NOW START THE PREVIOUSLY BLOCKED TASK

```
Move "Design Login Screen" to doing — Sarah can now start since the blocker is resolved
```

---

## ═══ PART 8 — SPRINT MANAGEMENT ═══

### 26. CREATE A SPRINT

```
Create a sprint called "Foundation Sprint" for Mobile App Redesign Q1 2026
Goal: Deliver core authentication API and login screen design
Start date: 2026-02-19
End date: 2026-03-04
Capacity: 160 hours
```

### 27. ADD TASKS TO SPRINT

```
Add "Implement Auth API" to Foundation Sprint
```

```
Add "Design Login Screen" to Foundation Sprint
```

```
Add "Write API Documentation" to Foundation Sprint
```

```
Add "Generate Sprint Retrospective Template" to Foundation Sprint
```

### 28. CHECK SPRINT CAPACITY

```
Show me the capacity summary for Foundation Sprint — how many story points and hours are planned vs available
```

### 29. START THE SPRINT

```
Start Foundation Sprint — change its status to active
```

### 30. VERIFY SPRINT IS ACTIVE

```
Show me the active sprint for Mobile App Redesign Q1 2026
```

### 31. VIEW ALL SPRINTS

```
List all sprints for Mobile App Redesign Q1 2026 with their statuses
```

---

## ═══ PART 9 — AI AGENT IN ACTION ═══

### 32. WATCH THE FIRST AGENT TASK (start timer!)

```
Show me the current status of the "Write API Documentation" task — it is assigned to Coding Agent
```

*(Wait 30 seconds then ask again)*

```
Check the status of "Write API Documentation" again — has the Coding Agent picked it up yet?
```

*(After 1–2 more minutes)*

```
What is the current status of "Write API Documentation"? Has the agent moved it to review?
```

### 33. READ WHAT THE AGENT PRODUCED

```
Show me all comments on the "Write API Documentation" task — I want to see what the Coding Agent wrote
```

### 34. APPROVE THE AGENT'S WORK

```
Approve the agent's work on "Write API Documentation" with quality score 8 and comment "Good structure, covers all endpoints clearly. Well organized by domain."
```

### 35. WATCH THE SECOND AGENT TASK

```
Show me the status of "Generate Sprint Retrospective Template" — is the Coding Agent working on it?
```

*(Wait and check again)*

```
Has the Coding Agent completed "Generate Sprint Retrospective Template" and moved it to review?
```

### 36. APPROVE SECOND AGENT TASK

```
Approve the agent's work on "Generate Sprint Retrospective Template" with quality score 9
```

### 37. CONFIRM AGENT TASKS ARE DONE

```
Show me all tasks assigned to Coding Agent in Mobile App Redesign Q1 2026 — confirm they are done
```

---

## ═══ PART 10 — COMPLETE REMAINING TASKS ═══

### 38. MOVE DESIGN TASK THROUGH LIFECYCLE

```
Move "Design Login Screen" to review status — Sarah has finished the designs
```

```
Move "Design Login Screen" to done — John reviewed and approved the screens
```

### 39. COMPLETE THE USER TESTING PLAN

```
Move "User Testing Plan" to todo, then to doing, then to done — it has been completed quickly
```

---

## ═══ PART 11 — SPRINT ANALYTICS ═══

### 40. CHECK SPRINT PROGRESS

```
Show me the capacity and completion status of Foundation Sprint now
```

### 41. VIEW BURNDOWN DATA

```
Show me the burndown data for Foundation Sprint
```

### 42. COMPLETE THE SPRINT

```
Complete Foundation Sprint — all tasks are done
```

### 43. VIEW VELOCITY AFTER COMPLETION

```
Show me the velocity history for Mobile App Redesign Q1 2026 — how many story points were completed in Foundation Sprint?
```

---

## ═══ PART 12 — SPRINT 2 (shows velocity being used) ═══

### 44. CREATE SPRINT 2

```
Create Sprint 2 called "Payment Integration Sprint" for Mobile App Redesign Q1 2026
Goal: Implement payment flow and checkout screens
Start date: 2026-03-05
End date: 2026-03-18
Capacity: 120 hours
```

### 45. CREATE TASKS FOR SPRINT 2

```
Create these tasks in Mobile App Redesign Q1 2026 and add them to Payment Integration Sprint:

1. "Payment API Integration" — critical, 8 points, assignee John Doe, description "Integrate Stripe payment processing with checkout flow, webhooks, and error handling"
2. "Payment Screen UI" — high, 5 points, assignee Sarah Johnson, description "Build payment checkout screens for iOS and Android with card input, confirmation, and receipt"
3. "Write Payment Flow Documentation" — medium, 3 points, assignee Coding Agent, description "Document the complete payment flow including checkout steps, error states, retry logic, and webhook handling for Stripe integration"
4. "Payment Security Audit" — critical, 5 points, assignee John Doe, description "OWASP security review of all payment endpoints including input validation, PCI DSS compliance check, and penetration testing plan"
```

### 46. START SPRINT 2

```
Start Payment Integration Sprint
```

### 47. WATCH THIRD AGENT TASK

```
Show me the status of "Write Payment Flow Documentation" — is the Coding Agent working on it?
```

*(Wait and repeat)*

```
Has the Coding Agent completed "Write Payment Flow Documentation"?
```

---

## ═══ PART 13 — AI INTELLIGENCE ═══

### 48. CHECK TEAM INTELLIGENCE

```
Show me the team intelligence profiles — what skills and strengths have been learned for each team member?
```

### 49. CHECK QUALITY PATTERNS

```
Show me quality patterns — which task types have the highest rejection rates and what are the prevention tips?
```

### 50. CHECK AI ACCURACY

```
Show me the AI model accuracy trend — how have suggestion acceptance rates changed over time?
```

---

## ═══ PART 14 — KNOWLEDGE BASE ═══

### 51. SEARCH KNOWLEDGE BASE

```
Search the knowledge base for "authentication JWT token flow"
```

### 52. FIND CODE EXAMPLES

```
Search for code examples related to "FastAPI authentication middleware"
```

### 53. LIST ALL KNOWLEDGE SOURCES

```
Show me all available knowledge base sources that have been indexed
```

---

## ═══ PART 15 — ANALYTICS & REPORTING ═══

### 54. VIEW TASKS BY ASSIGNEE

```
Show me all tasks assigned to John Doe — both in progress and completed
```

### 55. VIEW ALL DONE TASKS

```
Show me all completed tasks in Mobile App Redesign Q1 2026
```

### 56. VIEW TASKS IN REVIEW

```
Show me all tasks currently waiting in review status — they need human approval
```

### 57. VIEW ALL PROJECTS SUMMARY

```
Show me all projects with their task counts broken down by status (backlog, todo, doing, review, done)
```

---

## ═══ PART 16 — ADVANCED FEATURES ═══

### 58. UPDATE STORY POINTS

```
Update "Payment Security Audit" — change story points to 8, it turned out to be more complex than estimated
```

### 59. ADD A COMMENT

```
Add a comment on "Payment API Integration": "John — please make sure to handle webhook signature verification. The payment processor requires HMAC-SHA256 validation on all incoming webhooks. @john.doe"
```

### 60. CHECK NOTIFICATIONS

```
Show me all unread notifications for the current user
```

### 61. CHECK DEPENDENCIES BEFORE SPRINT END

```
Show me all unresolved task dependencies in Mobile App Redesign Q1 2026 — are any tasks still blocked?
```

### 62. ARCHIVE A TASK

```
Archive the "User Testing Plan" task — it has been postponed to next quarter
```

---

## ═══ PART 17 — FINAL SUMMARY ═══

### 63. PROJECT SUMMARY

```
Give me a complete summary of Mobile App Redesign Q1 2026:
- All sprints and their statuses
- Total tasks created vs completed
- Tasks per assignee (human and agent)
- Any tasks still in progress or review
- Story points delivered per sprint
```

### 64. ADMIN DASHBOARD

```
Show me the organization-wide stats — total members by role, active projects, task counts by status, and active sprints
```

### 65. FINAL PROOF — EVERYTHING DONE

```
Show me all projects, sprints, and tasks that were created in this session — I want to verify the complete audit trail from start to finish
```

---

## ═══ QUICK REFERENCE CHEAT SHEET ═══

**Create a task for the AI agent:**
```
Create a task "[title]" assigned to Coding Agent with description "[detailed instructions]"
```

**Check if agent is working:**
```
What is the current status of "[task name]"? Has the Coding Agent picked it up?
```

**Add a dependency (B blocked by A):**
```
Set "[Task B]" as blocked by "[Task A]"
```

**View all blockers in a project:**
```
Show me all task dependencies in [project name]
```

**Start a sprint:**
```
Start [sprint name] — change status to active
```

**Check sprint capacity:**
```
Show me the capacity summary for [sprint name] — points, hours, utilization
```

**Complete a sprint:**
```
Complete [sprint name]
```

**Search knowledge base:**
```
Search the knowledge base for "[topic]"
```

**Get AI task suggestions for new project:**
```
Generate AI task suggestions for the "[project name]" project — analyze the description and suggest tasks
```

**Check team intelligence:**
```
Show me the team intelligence profile for [name] — what skills and task types are they best at?
```

**Approve agent work:**
```
Approve the Coding Agent's work on "[task name]" with quality score [1-10]
```

**Reject agent work:**
```
Reject the Coding Agent's work on "[task name]" with feedback "[what needs to be fixed]"
```

**Filter by priority:**
```
Show me all critical tasks in [project name]
```

**View velocity trend:**
```
Show me the velocity history for [project name] — story points completed per sprint
```

**Check AI learning:**
```
Show me the AI learning status — pending observations and knowledge store sizes
```

**Check quality patterns:**
```
Which task types have the highest rejection rates? What are the prevention tips?
```

---

*All prompts work in Claude Code, Cursor, or Windsurf with the 10x MCP server connected.*
*Local: port 8051 | AWS: http://\<EC2-IP\>:8051*
