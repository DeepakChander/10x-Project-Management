# Permission Management - Executive Summary

## 4-Layer Security (Defense in Depth)

```
User Action
     |
  [Layer 1: UI]        -> Can you even SEE the button?
     |
  [Layer 2: API]       -> Is your request valid?
     |
  [Layer 3: Service]   -> Do you have permission?
     |
  [Layer 4: Database]  -> Does the data allow this?
     |
Action Allowed (or Blocked)
```

**Why 4 layers?** If a hacker bypasses one, the next layer still blocks them. ALL 4 must say "yes".

## Real-World Analogy

```
Layer 1 (UI)       = Reception Desk (what floors you can see)
Layer 2 (API)      = Door Security (valid badge check)
Layer 3 (Service)  = Office Manager (room authorization)
Layer 4 (Database) = File Cabinet Lock (data-level access)
```

## Master Permission Matrix

```
                  Owner  Admin  Manager  Lead  Member  Viewer  Agent
Create Project     Yes    Yes    Yes      No    No      No      No
Delete Project     Yes    Yes    No       No    No      No      No
Create Task        Yes    Yes    Yes     Yes   Yes      No     Yes
Assign Task        Yes    Yes    Yes     Yes    No      No      No
Approve Review     Yes    Yes    Yes     Yes    No      No    NEVER
Delete Task        Yes    Yes    Yes      No    No      No      No
View Tasks         Yes    Yes    Yes     Yes   Yes     Yes   Scope
System Settings    Yes    Yes    No       No    No      No      No
```

## Scope: Org vs Project Roles

```
Effective Role = HIGHER of (Org Role, Project Role)

Example: Sarah
  Org Role: Member (Level 3)
  Project Role: Lead (Level 4)
  Effective: Lead (Level 4 wins)
```

## AI Agent Rules

```
Agents CAN:   Create tasks, suggest, move own tasks
Agents NEVER: Approve, delete, assign, change settings

RULE: AI assists, only HUMANS approve.
```

## Key Principles

- Deny by default (not allowed = denied)
- Least privilege (minimum access needed)
- Human gates on all critical actions
- Every check is logged for audit
