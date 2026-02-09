# Task Management - Complete Lifecycle

## Overview

The Task Management module is the heart of 10x PM. It manages the complete lifecycle of work items from initial idea to completion, integrating with all other modules (permissions, notifications, AI, reviews) at every stage.

## Task Flow - The 6 Stages

```
+----------+      +------+      +-------+      +--------+      +------+      +----------+
| BACKLOG  | ---> | TODO | ---> | DOING | ---> | REVIEW | ---> | DONE | ---> | ARCHIVED |
+----------+      +------+      +-------+      +--------+      +------+      +----------+
     |                |              |               |              |              |
  Ideas &          Sprint        Active           Quality        Completed     Historical
  Future          Planned         Work           Check           Work          Record
  Plans           Items          In Progress     & Approval     Verified       Storage
```

## Stage Details

### Stage 1: BACKLOG
**What it is**: A parking lot for all future work ideas, feature requests, and planned tasks.

**Who creates tasks here**:
- Product Owner / Manager creates based on business needs
- Team members suggest improvements
- AI Intelligence suggests based on patterns

**What happens**:
```
New Idea Arrives
       |
       v
+------------------+
| Create Backlog   |
| Item             |
|                  |
| - Title          |
| - Description    |
| - Priority hint  |
| - Category       |
| - Estimated size |
+------------------+
       |
       v
AI Intelligence Activates
       |
       v
+------------------+
| AI Checks:       |
| - Similar tasks? |
| - Past patterns? |
| - Suggests tags  |
| - Priority hint  |
+------------------+
       |
       v
Task Sits in Backlog
(Until Sprint Planning)
```

**Key Rules**:
- Anyone with Member+ role can create backlog items
- No assignee required at this stage
- AI automatically enriches with metadata
- Backlog is regularly groomed (reviewed and prioritized)

### Stage 2: TODO
**What it is**: Tasks that have been committed to for the current or next sprint.

**How tasks move here**:
```
Sprint Planning Meeting
         |
         v
+-------------------+
| Manager/Lead      |
| selects tasks      |
| from Backlog      |
+-------------------+
         |
         v
+-------------------+
| For each task:    |
| - Set priority    |
| - Set assignee    |
| - Set deadline    |
| - Set sprint      |
| - Set story points|
+-------------------+
         |
         v
+-------------------+
| System triggers:  |
| - Notify assignee |
| - Update sprint   |
|   capacity        |
| - AI checks       |
|   dependencies    |
+-------------------+
```

**Key Rules**:
- Only Manager/Lead can move tasks to Todo
- Must have an assignee
- Must have a priority (P1-P4)
- Must belong to a sprint
- AI warns if sprint is over-capacity

### Stage 3: DOING
**What it is**: Work actively being performed by the assignee.

**Flow**:
```
Assignee Starts Work
         |
         v
+-------------------+
| Task moves to     |
| DOING             |
| - Start timer     |
| - Status: Active  |
+-------------------+
         |
    +----+----+
    |         |
    v         v
Working    Blocked?
    |         |
    |    +----+----+
    |    | Flag as  |
    |    | Blocked  |
    |    | - Reason |
    |    | - Notify |
    |    |   Lead   |
    |    +----------+
    |
    v
Work Complete
    |
    v
Submit for Review
```

**What the system tracks**:
- Time spent on task
- Number of times blocked
- Files/documents attached
- Comments and updates
- AI learning: How long similar tasks take

### Stage 4: REVIEW
**What it is**: Quality checkpoint where work is verified by someone other than the doer.

**Review Flow**:
```
Task Submitted for Review
         |
         v
+-------------------+
| System determines |
| reviewer based on:|
| - Task type       |
| - Project rules   |
| - Team structure  |
+-------------------+
         |
         v
+-------------------+
| Reviewer gets     |
| notification      |
| with full context |
+-------------------+
         |
    +----+----+----+
    |         |    |
    v         v    v
 APPROVE   REJECT  ESCALATE
    |         |       |
    v         v       v
  DONE    Back to   Higher
         DOING     Authority
         (with     Reviews
         feedback)
```

**Review Types**:
- **Peer Review**: Same-level colleague checks work
- **Lead Review**: Team lead verifies quality
- **Manager Review**: For critical/high-priority items
- **Multi-Level**: Passes through multiple reviewers (Lead -> Manager -> Legal)

### Stage 5: DONE
**What it is**: Work that has been reviewed and approved.

**What happens at Done**:
```
Task Approved
     |
     v
+-------------------+
| System actions:   |
| - Mark completed  |
| - Record metrics  |
| - Notify team     |
| - Update sprint   |
|   progress        |
| - AI learns from  |
|   this completion |
+-------------------+
     |
     v
+-------------------+
| AI records:       |
| - Actual duration |
| - Review cycles   |
| - Task patterns   |
| - Team velocity   |
+-------------------+
```

### Stage 6: ARCHIVED
**What it is**: Historical record of completed work.

**Purpose**:
- Keeps active views clean
- Preserves full history for auditing
- AI uses archived data for learning
- Can be searched and referenced

**Archive Rules**:
- Auto-archive after configurable period (e.g., 30 days after Done)
- Manual archive by Manager+
- Never deleted, always searchable
- Version history preserved

## Sprint Management

### What is a Sprint?
A sprint is a fixed time period (typically 1-2 weeks) where the team commits to completing a specific set of tasks.

```
Sprint Lifecycle:

+------------------+     +------------------+     +------------------+
|  SPRINT PLANNING |     |  SPRINT ACTIVE   |     | SPRINT REVIEW    |
|                  |     |                  |     |                  |
| - Select tasks   | --> | - Team works     | --> | - Review results |
| - Set capacity   |     | - Daily standups |     | - Retrospective  |
| - Assign work    |     | - Track progress |     | - Carry over     |
| - AI suggestions |     | - Handle blocks  |     | - AI analysis    |
+------------------+     +------------------+     +------------------+
```

### Sprint Capacity
```
Team Capacity Calculation:

Team Members: 5
Working Days: 10 (2-week sprint)
Hours per Day: 6 (productive hours)
Total Capacity: 5 x 10 x 6 = 300 hours

Assigned Tasks: 280 hours (93% utilized)
Buffer: 20 hours (7% for unexpected work)

AI Warning: "Sprint is at 93% capacity.
             Consider reducing scope."
```

## Task Priority System

```
+----------+-------------------+------------------------+
| Priority | Response Time     | Description            |
+----------+-------------------+------------------------+
| P1       | Within 4 hours    | Critical/Blocker       |
| P2       | Within 1 day      | High - Important       |
| P3       | Within 3 days     | Medium - Normal        |
| P4       | Next Sprint       | Low - Nice to have     |
+----------+-------------------+------------------------+
```

## Task Dependencies

```
Task A (Design UI)
     |
     +---> Task B (Build Frontend) ---+
     |                                |
     +---> Task C (Build API) --------+---> Task D (Integration Testing)
                                      |
                                      +---> Task E (Documentation)
```

**Dependency Rules**:
- Blocked tasks cannot move to DOING
- System auto-notifies when blocker is resolved
- AI identifies implicit dependencies from past patterns
- Circular dependencies are prevented by the system

## 6 Systems Working Together (Per Task)

Every single task in 10x PM has 6 systems working on it simultaneously:

```
                    +------------------+
                    |    SINGLE TASK   |
                    +------------------+
                           |
        +------------------+------------------+
        |          |          |        |       |          |
        v          v          v        v       v          v
  +---------+ +--------+ +------+ +------+ +------+ +--------+
  |Workflow | |Permis- | |Noti- | |AI    | |Review| |Auto-   |
  |Engine   | |sions   | |fica- | |Intel | |System| |mation  |
  |         | |        | |tions | |      | |      | |Engine  |
  |Controls | |Checks  | |Alerts| |Learns| |Veri- | |Triggers|
  |movement | |who can | |right | |from  | |fies  | |actions |
  |between  | |do what | |people| |every | |qual- | |based   |
  |stages   | |at each | |at    | |action| |ity   | |on      |
  |         | |stage   | |right | |      | |      | |rules   |
  |         | |        | |time  | |      | |      | |        |
  +---------+ +--------+ +------+ +------+ +------+ +--------+
```

### Real Example: Marketing Website Redesign

```
1. CEO creates Project "Website Redesign"
   -> Workflow: Creates in Backlog
   -> AI: "Similar to Q2 2024 redesign (took 6 weeks)"
   -> Notification: PM notified of new project

2. PM creates Task "Design Homepage"
   -> Workflow: Backlog stage
   -> Permissions: PM has create rights
   -> AI: "Suggest priority P2, estimated 3 days"

3. Sprint Planning: Task moved to Todo
   -> Workflow: Backlog -> Todo (valid transition)
   -> Permissions: Lead can move tasks
   -> Notification: Designer Sarah notified
   -> AI: "Sprint at 85% capacity after this"

4. Sarah starts working
   -> Workflow: Todo -> Doing
   -> Automation: Start time tracker
   -> AI: Records start time for duration learning

5. Sarah submits for review
   -> Workflow: Doing -> Review
   -> Review System: Assigns to Lead Mike
   -> Notification: Mike gets review request
   -> Permissions: Mike can approve/reject

6. Mike approves
   -> Workflow: Review -> Done
   -> Notification: Sarah, PM, CEO notified
   -> AI: "Task completed in 2.5 days (estimated 3)"
   -> Automation: Update sprint burndown
```

## Task Data Model

### Tasks Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| project_id       | FK to projects    |
| sprint_id        | FK to sprints     |
| title            | Task title        |
| description      | Detailed desc     |
| status           | Current stage     |
| priority         | P1-P4             |
| assignee_id      | FK to users       |
| reviewer_id      | FK to users       |
| story_points     | Effort estimate   |
| due_date         | Deadline          |
| started_at       | When DOING began  |
| completed_at     | When DONE reached |
| parent_task_id   | For subtasks      |
| task_order       | Sort order        |
| created_by       | Creator user ID   |
| created_at       | Creation timestamp|
| updated_at       | Last update       |
+------------------+-------------------+
```

### Task Dependencies Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| task_id          | The dependent task|
| depends_on_id    | The blocking task |
| dependency_type  | blocks/related    |
| created_at       | When created      |
+------------------+-------------------+
```

### Sprints Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| project_id       | FK to projects    |
| name             | Sprint name       |
| goal             | Sprint objective  |
| start_date       | Sprint start      |
| end_date         | Sprint end        |
| status           | planning/active/  |
|                  | completed         |
| capacity_hours   | Team capacity     |
| created_at       | Creation timestamp|
+------------------+-------------------+
```

## Key Numbers

- 6 task stages in the lifecycle
- 4 priority levels (P1-P4)
- 6 systems working on every task simultaneously
- 3 review decisions (Approve, Reject, Escalate)
- Typical sprint: 1-2 weeks
- AI learns from every completed task
