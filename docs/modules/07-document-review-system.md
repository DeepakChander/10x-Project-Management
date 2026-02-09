# Document & Review System

## Overview

The Document & Review System manages the complete lifecycle of project documentation, task deliverables, and review processes. It provides structured workflows for creating, submitting, reviewing, and approving work output with full version history.

## 3 Document Types

```
+------------------+------------------+------------------+
| PROJECT          | TASK             | REVIEW           |
| DOCUMENTS        | DELIVERABLES     | DOCUMENTS        |
|                  |                  |                  |
| Created by PM/   | Created by task  | Created during   |
| Manager at       | assignee as      | review process   |
| project level    | work output      | (feedback, etc)  |
|                  |                  |                  |
| Examples:        | Examples:        | Examples:        |
| - Project brief  | - Design mockup  | - Code review    |
| - Requirements   | - Code files     |   comments       |
| - Architecture   | - Test results   | - Review notes   |
| - Meeting notes  | - Documentation  | - Revision list  |
+------------------+------------------+------------------+
```

## Document Lifecycle

```
+---------+     +-----------+     +-----------+     +----------+     +----------+
|  DRAFT  | --> | SUBMITTED | --> | IN REVIEW | --> | APPROVED | --> | ARCHIVED |
+---------+     +-----------+     +-----------+     +----------+     +----------+
                                       |
                                       v
                               +--------------+
                               |   REVISION   |
                               |   NEEDED     |
                               +--------------+
                                       |
                                       v
                               Back to DRAFT
                               (with feedback)
```

## Phase 1: CEO Creates Project with Documents

```
CEO/Manager creates new project:
         |
         v
+-------------------------------------------+
| New Project: "Website Redesign"            |
|                                            |
| Project Documents:                         |
| +------------------+---------+---------+   |
| | Document         | Status  | Access  |   |
| +------------------+---------+---------+   |
| | Project Brief    | Draft   | Team    |   |
| | Requirements.pdf | Final   | All     |   |
| | Budget Plan      | Draft   | Manager+|   |
| | Timeline.xlsx    | Final   | Team    |   |
| +------------------+---------+---------+   |
|                                            |
| These documents define what the project    |
| is about and what needs to be achieved.    |
+-------------------------------------------+
```

## Phase 2: How Managers/Leads Read Project Documents

```
Manager/Lead opens project:
         |
         v
+-------------------------------------------+
| Project: Website Redesign                  |
|                                            |
| Documents Tab:                             |
| +------------------------------------------+
| | Project Brief (v3)           [Read]      |
| | Updated 2 days ago by CEO                |
| +------------------------------------------+
| | Requirements (v1)            [Read]      |
| | Final version - approved                 |
| +------------------------------------------+
| | Budget Plan (v2)      [Read] [Comment]   |
| | Draft - needs review                     |
| +------------------------------------------+
|                                            |
| Access Rules:                              |
| - Manager+ can edit project documents      |
| - Lead can comment but not edit            |
| - Member can read only                     |
| - Viewer can read approved docs only       |
+-------------------------------------------+
```

## Phase 3: Employee Submits Task Deliverable

```
Sarah completes "Design Homepage" task:
         |
         v
+-------------------------------------------+
| Submit Deliverable                         |
|                                            |
| Task: Design Homepage                      |
| Attachments:                               |
| [+] homepage-mockup-v2.fig                |
| [+] design-notes.md                       |
| [+] responsive-preview.png                |
|                                            |
| Submission Note:                           |
| "Final mockup with responsive breakpoints. |
|  Addressed feedback from last review."     |
|                                            |
| [Submit for Review]  [Save as Draft]       |
+-------------------------------------------+
         |
         v
System determines reviewer:
  - Based on task type: Design -> Lead Mike
  - Based on project rules: Lead reviews first
  - Notification sent to Mike
```

## Phase 4: How Reviewer Finds and Reviews

### 3 Ways to Find Reviews

```
Way 1: NOTIFICATION
+--------------------------------------------------+
| REVIEW REQUEST                          [URGENT]  |
| Sarah submitted "Design Homepage" for review      |
| [Review Now]                                      |
+--------------------------------------------------+
Click "Review Now" -> Opens review interface

Way 2: REVIEW QUEUE
+--------------------------------------------------+
| My Pending Reviews (3)                             |
|                                                    |
| 1. "Design Homepage" - Sarah - 2h ago  [Review]   |
| 2. "API Documentation" - Mike - 1d ago [Review]   |
| 3. "Test Results" - Tom - 3d ago       [OVERDUE]  |
+--------------------------------------------------+

Way 3: KANBAN BOARD (Review Column)
+----------+----------+----------+----------+
| TODO     | DOING    | REVIEW   | DONE     |
|          |          |          |          |
|          |          | Design   |          |
|          |          | Homepage |          |
|          |          | [Click]  |          |
+----------+----------+----------+----------+
```

## Phase 5: The Review Interface

```
+--------------------------------------------------+
| REVIEW: Design Homepage                            |
| Submitted by: Sarah Chen | 2 hours ago            |
+--------------------------------------------------+
|                                                    |
| DELIVERABLES:                                      |
| +----------------------------------------------+  |
| | homepage-mockup-v2.fig    [View] [Download]  |  |
| | design-notes.md           [View] [Download]  |  |
| | responsive-preview.png    [View] [Download]  |  |
| +----------------------------------------------+  |
|                                                    |
| VERSION COMPARISON (if revision):                  |
| +----------------------------------------------+  |
| | v1 (rejected)     <-->    v2 (current)       |  |
| | [Side by Side Diff]                          |  |
| +----------------------------------------------+  |
|                                                    |
| REVIEW CHECKLIST:                                  |
| [x] Matches requirements                          |
| [x] Responsive design included                    |
| [ ] Accessibility verified                         |
| [x] Brand guidelines followed                     |
|                                                    |
| SUBMISSION NOTE:                                   |
| "Final mockup with responsive breakpoints.         |
|  Addressed feedback from last review."             |
|                                                    |
| REVIEWER FEEDBACK:                                 |
| [                                           ]      |
| [                                           ]      |
|                                                    |
| DECISION:                                          |
| [APPROVE] [REQUEST CHANGES] [ESCALATE]             |
+--------------------------------------------------+
```

## 3 Review Decisions

### Decision 1: APPROVE
```
Reviewer clicks APPROVE:
         |
         v
+-------------------------------------------+
| Approval recorded                          |
| - Task moves to DONE                       |
| - Sarah notified: "Work approved!"         |
| - Manager notified: "Task completed"       |
| - AI records: quality patterns             |
| - Version marked as "approved"             |
+-------------------------------------------+
```

### Decision 2: REQUEST CHANGES
```
Reviewer clicks REQUEST CHANGES:
         |
         v
+-------------------------------------------+
| Feedback required:                         |
|                                            |
| "Accessibility needs work:                 |
|  - Color contrast on CTA buttons too low   |
|  - Missing alt text specifications         |
|  - Tab navigation order not defined"       |
|                                            |
| Specific items:                            |
| [x] CTA button contrast (must fix)        |
| [x] Alt text specs (must fix)             |
| [ ] Tab order (nice to have)              |
|                                            |
| [Submit Feedback]                          |
+-------------------------------------------+
         |
         v
+-------------------------------------------+
| Task moves back to DOING                   |
| - Sarah notified with specific feedback    |
| - Current version: v2 (needs revision)     |
| - Next submission will be v3               |
| - AI records: "accessibility" common issue |
+-------------------------------------------+
```

### Decision 3: ESCALATE
```
Reviewer clicks ESCALATE:
         |
         v
+-------------------------------------------+
| Escalation reason:                         |
|                                            |
| "This design changes the brand guidelines. |
|  Need Manager approval for brand deviation"|
|                                            |
| Escalate to: [Manager John]               |
| [Submit Escalation]                        |
+-------------------------------------------+
         |
         v
Manager John receives escalated review
with full context + original reviewer's notes
```

## What Assignee Sees After Rejection

```
Sarah's View After "Request Changes":

+-------------------------------------------+
| Task: Design Homepage          [REVISION]  |
|                                            |
| Review Feedback from Mike:                 |
| +------------------------------------------+
| | MUST FIX:                                |
| | 1. CTA button contrast too low           |
| | 2. Alt text specifications missing        |
| |                                          |
| | NICE TO HAVE:                            |
| | 3. Tab navigation order definition        |
| +------------------------------------------+
|                                            |
| Previous Versions:                         |
| +------------------------------------------+
| | v2 (current - rejected)    [View]        |
| | v1 (initial submission)    [View]        |
| +------------------------------------------+
|                                            |
| [View Side-by-Side Diff: v1 vs v2]        |
|                                            |
| New Submission:                            |
| [+] Attach updated files                  |
| [  ] Revision notes                       |
| [Submit Revision]                          |
+-------------------------------------------+
```

## Multi-Level Review Chain

```
For critical deliverables, multiple reviewers in sequence:

Sarah submits "Payment Integration Code"
         |
         v
Level 1: Lead Mike (Technical Review)
  -> Checks: Code quality, tests passing
  -> APPROVED
         |
         v
Level 2: Manager John (Business Review)
  -> Checks: Requirements met, timeline
  -> APPROVED
         |
         v
Level 3: Legal Team (Compliance Review)
  -> Checks: PCI compliance, data handling
  -> REQUEST CHANGES
         |
         v
Back to Sarah with Legal's feedback
(Must address compliance issues)
         |
         v
Sarah resubmits
(Goes back through chain starting at Level 3
 since Levels 1 & 2 already approved)
```

## Version History

```
Document: homepage-mockup.fig
+--------------------------------------------------+
| Version History                                    |
|                                                    |
| v3 (current) - Feb 8, 2026                        |
|   Status: APPROVED                                 |
|   Changes: Fixed accessibility issues              |
|   Reviewer: Mike (Approved)                        |
|   [View] [Download]                               |
|                                                    |
| v2 - Feb 6, 2026                                  |
|   Status: REVISION NEEDED                          |
|   Changes: Added responsive breakpoints            |
|   Reviewer: Mike (Requested Changes)               |
|   [View] [Download] [Compare with v3]             |
|                                                    |
| v1 - Feb 3, 2026                                  |
|   Status: REVISION NEEDED                          |
|   Changes: Initial submission                      |
|   Reviewer: Mike (Requested Changes)               |
|   [View] [Download] [Compare with v2]             |
+--------------------------------------------------+
```

## Document Access Rules by Role

```
+----------+---------+---------+---------+---------+
| Role     | View    | Create  | Edit    | Delete  |
+----------+---------+---------+---------+---------+
| Owner    | All     | All     | All     | All     |
| Admin    | All     | All     | All     | All     |
| Manager  | Project | Project | Project | Own     |
| Lead     | Team    | Team    | Own     | Own     |
| Member   | Own +   | Own     | Own     | Own     |
|          | Shared  | tasks   | drafts  | drafts  |
| Viewer   | Approved| None    | None    | None    |
| Agent    | Assigned| Assigned| None    | None    |
+----------+---------+---------+---------+---------+
```

## Document Attachment Points

```
Documents can be attached at 3 levels:

Level 1: PROJECT LEVEL
  - Project brief, requirements, architecture
  - Shared with entire project team
  - Managed by Manager+

Level 2: TASK LEVEL
  - Task deliverables, work output
  - Specific to one task
  - Created by task assignee

Level 3: COMMENT LEVEL
  - Inline attachments in comments
  - Reference material in discussions
  - Anyone with comment permission
```

## Data Model

### Documents Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| project_id       | FK to projects    |
| task_id          | FK to tasks (opt) |
| title            | Document title    |
| description      | What it contains  |
| doc_type         | project/task/     |
|                  | review            |
| status           | draft/submitted/  |
|                  | in_review/        |
|                  | approved/archived |
| created_by       | FK to users       |
| current_version  | Current version # |
| created_at       | Timestamp         |
| updated_at       | Last update       |
+------------------+-------------------+
```

### Document Versions Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| document_id      | FK to documents   |
| version_number   | 1, 2, 3...       |
| file_url         | Storage URL       |
| file_name        | Original filename |
| file_size        | Size in bytes     |
| mime_type        | File type         |
| change_notes     | What changed      |
| uploaded_by      | FK to users       |
| created_at       | Upload timestamp  |
+------------------+-------------------+
```

### Reviews Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| document_id      | FK to documents   |
| version_id       | FK to versions    |
| reviewer_id      | FK to users       |
| review_level     | 1, 2, 3 (chain)  |
| decision         | approved/changes/ |
|                  | escalated         |
| feedback         | Reviewer comments |
| checklist        | JSON (items)      |
| reviewed_at      | Decision timestamp|
| created_at       | Assigned timestamp|
+------------------+-------------------+
```

### Review Chain Configuration Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| project_id       | FK to projects    |
| task_type        | Which task types  |
| chain_levels     | JSON array of     |
|                  | reviewer roles    |
| auto_assign      | Boolean           |
| created_at       | Timestamp         |
+------------------+-------------------+
```

### Document Access Table
```
+------------------+-------------------+
| Field            | Description       |
+------------------+-------------------+
| id               | UUID primary key  |
| document_id      | FK to documents   |
| user_id          | FK to users (opt) |
| role             | Role-based access |
| permission       | read/write/admin  |
| granted_by       | FK to users       |
| created_at       | Timestamp         |
+------------------+-------------------+
```
