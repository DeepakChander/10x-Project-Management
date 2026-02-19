# 10x PM — Demo Prompts (Start to Finish)

Run these prompts in order inside Claude Code (MCP connected).
Each prompt is exactly what you type. Nothing else needed.

---

## 1. CHECK SYSTEM IS RUNNING

```
Check if all 4 containers are healthy: server on 8181, mcp on 8051, agents on 8052, frontend on 3737
```

---

## 2. FIND ALL PROJECTS

```
Show me all projects in the system
```

---

## 3. CREATE THE PROJECT

```
Create a new project called "Mobile App Redesign Q1 2026" with description "Complete overhaul of iOS and Android apps with a new design system and authentication layer"
```

---

## 4. CONFIRM PROJECT WAS CREATED

```
Find the project "Mobile App Redesign Q1 2026" and show me its details
```

---

## 5. CREATE TASK 1 — Critical, human assigned

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

---

## 6. CREATE TASK 2 — High priority, with reviewer

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Design Login Screen"
Priority: high
Story points: 5
Estimated hours: 8
Assignee: Sarah Johnson
Reviewer: John Doe
Description: Design the login and signup screens for iOS and Android with the new design system
```

---

## 7. CREATE TASK 3 — Assigned to AI agent

```
Create a task in Mobile App Redesign Q1 2026:
Title: "Write API Documentation"
Priority: medium
Story points: 3
Assignee: Coding Agent
Description: Document all REST API endpoints with request parameters, response schemas, authentication requirements, and example payloads. Group by domain: auth, projects, tasks, sprints, analytics.
```

---

## 8. CREATE TASK 4 — Low priority with tags

```
Create a task in Mobile App Redesign Q1 2026:
Title: "User Testing Plan"
Priority: low
Story points: 2
Tags: testing, ux
Description: Define the user testing strategy, test cases, and success criteria for the redesigned app
```

---

## 9. VIEW ALL TASKS IN THE PROJECT

```
Show me all tasks in Mobile App Redesign Q1 2026
```

---

## 10. VIEW ONLY HIGH PRIORITY TASKS

```
Show me all critical and high priority tasks in Mobile App Redesign Q1 2026
```

---

## 11. VIEW TASKS BY STATUS

```
Show me all tasks currently in backlog status
```

---

## 12. MOVE TASK TO TODO (start planning)

```
Move "Implement Auth API" to todo status
```

---

## 13. START WORKING ON A TASK (doing)

```
Move "Implement Auth API" to doing — John has started working on it
```

---

## 14. ADD A TASK DEPENDENCY

```
Set "Design Login Screen" as blocked by "Implement Auth API" — the login screen design cannot start until the auth API is implemented
```

---

## 15. CHECK DEPENDENCIES FOR THE PROJECT

```
Show me all task dependencies in Mobile App Redesign Q1 2026
```

---

## 16. TRY TO START A BLOCKED TASK (shows enforcement)

```
Move "Design Login Screen" to doing status
```

*(This should fail — show the blocker error)*

---

## 17. COMPLETE THE BLOCKER FIRST

```
Move "Implement Auth API" to review status — John has finished implementation
```

```
Move "Implement Auth API" to done — reviewed and approved
```

---

## 18. NOW START THE PREVIOUSLY BLOCKED TASK

```
Move "Design Login Screen" to doing — it is now unblocked and Sarah can start
```

---

## 19. ADD A COMMENT ON A TASK

```
Add a comment on "Design Login Screen": "Sarah — please follow the Figma design tokens we agreed on. @John Doe can you review the mockups before she builds them?"
```

---

## 20. CHECK TASK STATUS AFTER UPDATES

```
Show me the current status of all tasks in Mobile App Redesign Q1 2026
```

---

## 21. CREATE A SPRINT

```
Create a sprint called "Foundation Sprint" for Mobile App Redesign Q1 2026
Goal: Deliver core authentication API and login screen design
Start date: 2026-02-19
End date: 2026-03-04
Capacity: 160 hours
```

---

## 22. ADD TASKS TO THE SPRINT

```
Add "Implement Auth API" to Foundation Sprint
```

```
Add "Design Login Screen" to Foundation Sprint
```

```
Add "Write API Documentation" to Foundation Sprint
```

---

## 23. CHECK SPRINT CAPACITY

```
Show me the capacity summary for Foundation Sprint — how many story points and hours are planned vs available
```

---

## 24. START THE SPRINT

```
Start Foundation Sprint — change its status to active
```

---

## 25. VERIFY SPRINT IS ACTIVE

```
Show me the active sprint for Mobile App Redesign Q1 2026
```

---

## 26. VIEW ALL SPRINTS IN THE PROJECT

```
List all sprints for Mobile App Redesign Q1 2026 with their statuses
```

---

## 27. WATCH THE AI AGENT TASK (key demo moment)

```
Show me the current status of the "Write API Documentation" task — it is assigned to Coding Agent
```

*(Wait 30 seconds, then ask again)*

```
Check the status of "Write API Documentation" again — has the Coding Agent picked it up yet?
```

*(After another 1–2 minutes)*

```
What is the current status of "Write API Documentation"? Has the agent moved it to review?
```

---

## 28. READ WHAT THE AGENT PRODUCED

```
Show me all comments on the "Write API Documentation" task — I want to see what the Coding Agent wrote
```

---

## 29. APPROVE THE AGENT'S WORK

```
Approve the agent's work on "Write API Documentation" with quality score 8 and comment "Good structure, covers all endpoints clearly"
```

---

## 30. CONFIRM AGENT TASK IS DONE

```
Show me the final status of "Write API Documentation" — confirm it is done and show me the completion timestamp
```

---

## 31. MOVE ALL REMAINING TASKS TO DONE

```
Move "Design Login Screen" to review status — Sarah has finished the designs
```

```
Move "Design Login Screen" to done — John reviewed and approved the screens
```

```
Move "User Testing Plan" to todo status, then to doing, then to done — it has been completed
```

---

## 32. CHECK SPRINT PROGRESS

```
Show me the capacity and completion status of Foundation Sprint now
```

---

## 33. COMPLETE THE SPRINT

```
Complete Foundation Sprint — all tasks are done
```

---

## 34. VIEW VELOCITY AFTER SPRINT COMPLETION

```
Show me the velocity history for Mobile App Redesign Q1 2026 — how many story points were completed in Foundation Sprint
```

---

## 35. VIEW ALL DONE TASKS

```
Show me all completed tasks in Mobile App Redesign Q1 2026
```

---

## 36. CREATE A SECOND SPRINT (shows velocity being used)

```
Create Sprint 2 called "Payment Integration Sprint" for Mobile App Redesign Q1 2026
Goal: Implement payment flow and in-app purchase screens
Start date: 2026-03-05
End date: 2026-03-18
Capacity: 120 hours
```

---

## 37. CREATE TASKS FOR SPRINT 2

```
Create these tasks in Mobile App Redesign Q1 2026 and add them to Payment Integration Sprint:

1. "Payment API Integration" — critical, 8 points, assignee John Doe
2. "Payment Screen UI" — high, 5 points, assignee Sarah Johnson
3. "Write Payment Flow Docs" — medium, 3 points, assignee Coding Agent, description "Document the complete payment flow including error states, retry logic, and webhook handling"
4. "Payment Security Audit" — critical, 5 points, assignee John Doe
```

---

## 38. START SPRINT 2

```
Start Payment Integration Sprint
```

---

## 39. WATCH SECOND AGENT TASK EXECUTE

```
Show me the status of "Write Payment Flow Docs" — is the Coding Agent working on it?
```

*(Wait and check again)*

```
Has the Coding Agent completed "Write Payment Flow Docs" and moved it to review?
```

---

## 40. SEARCH THE KNOWLEDGE BASE

```
Search the knowledge base for "authentication JWT token flow"
```

---

## 41. FIND CODE EXAMPLES IN KNOWLEDGE BASE

```
Search for code examples related to "FastAPI authentication middleware"
```

---

## 42. LIST ALL KNOWLEDGE SOURCES

```
Show me all available knowledge base sources that have been indexed
```

---

## 43. VIEW TASKS BY ASSIGNEE

```
Show me all tasks assigned to Coding Agent across all projects
```

---

## 44. VIEW TASKS ASSIGNED TO A SPECIFIC PERSON

```
Show me all tasks assigned to John Doe — both in progress and completed
```

---

## 45. VIEW ALL PROJECTS SUMMARY

```
Show me all projects with their task counts broken down by status
```

---

## 46. FILTER TASKS IN REVIEW

```
Show me all tasks currently waiting in review status — they need human approval
```

---

## 47. UPDATE A TASK'S STORY POINTS

```
Update "Payment Security Audit" — change story points to 8, it turned out to be more complex than expected
```

---

## 48. ARCHIVE A TASK

```
Archive the "User Testing Plan" task — it has been postponed to next quarter
```

---

## 49. CHECK DEPENDENCIES BEFORE SPRINT END

```
Show me all unresolved task dependencies in Mobile App Redesign Q1 2026 — are any tasks still blocked?
```

---

## 50. FINAL SUMMARY — EVERYTHING DONE

```
Give me a complete summary of Mobile App Redesign Q1 2026:
- All sprints and their statuses
- Total tasks created vs completed
- Tasks per assignee
- Any tasks still in progress
```

---

## QUICK REFERENCE — Common Prompts

**Create task for agent:**
```
Create a task "[task title]" assigned to Coding Agent with description "[what you want the agent to do]"
```

**Check if agent is working:**
```
What is the current status of "[task name]"? Has the Coding Agent picked it up?
```

**Add a dependency:**
```
Set "[Task B]" as blocked by "[Task A]"
```

**Start a sprint:**
```
Start [sprint name] — change status to active
```

**Complete a sprint:**
```
Complete [sprint name]
```

**Search knowledge base:**
```
Search the knowledge base for "[topic]"
```

**Find all blocked tasks:**
```
Show me all tasks in [project name] that have unresolved dependencies
```

**Approve agent work:**
```
Approve the Coding Agent's work on "[task name]" with quality score [1-10]
```

---

*All prompts work in Claude Code, Cursor, or Windsurf with the 10x MCP server connected on port 8051*
