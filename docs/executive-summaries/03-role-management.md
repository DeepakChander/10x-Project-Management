# Role Management - Executive Summary

## 7-Role Hierarchy

```
Owner (7)   -> CEO/Founder - Full control
Admin (6)   -> CTO/VP - System management
Manager (5) -> PM/Dept Head - Project oversight
Lead (4)    -> Team Lead - Team management
Member (3)  -> Developer/Staff - Regular work
Viewer (2)  -> Stakeholder/Client - Read only
Agent (1)   -> AI Bot - Automated tasks
```

## How the System Identifies You (4 Steps)

```
Step 1: WHO are you?      -> Login/Authentication
Step 2: WHERE do you belong? -> Org > Department > Team
Step 3: WHAT role do you have? -> Org Role + Project Roles
Step 4: WHAT actually applies? -> Effective = higher role wins
```

## Organization Structure

```
Organization (Company)
  +-- Department (Engineering, Marketing)
       +-- Team (Frontend, Backend, QA)
            +-- Members (with roles)
```

## Two Role Types

```
ORG ROLE: Your company-wide base role (e.g., Member)
PROJECT ROLE: Your role in a specific project (e.g., Lead)
EFFECTIVE: The HIGHER one applies

Sarah: Org=Member, Project A=Lead -> Effective: Lead
Sarah: Org=Member, Project B=Member -> Effective: Member
```

## Assignment Rules

```
You can ONLY assign roles BELOW your level:
  Owner  -> Can assign all roles below
  Admin  -> Can assign Manager and below
  Manager -> Can assign Lead and below
  Lead   -> Can assign Member and Viewer
  Member -> Cannot assign
```

## Role Lifecycle

```
INVITED -> ACCEPTED -> ACTIVE -> PROMOTED / MOVED / DEACTIVATED
```

## AI Agent Rules

```
- Always Level 1 (lowest)
- Registered by Admin
- Scope limited to assigned projects
- Supervised by a human Lead/Manager
- All actions logged
```

## Key Numbers

| Metric | Value |
|--------|-------|
| Role Levels | 7 |
| Identity Steps | 4 |
| Org Structures | 3 (Org > Dept > Team) |
| Role Types | 2 (Org + Project) |
| DB Tables | 6 |
