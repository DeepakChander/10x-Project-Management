# Role System - Gap Analysis & Implementation

**Comparing specification vs current implementation**

---

## What We HAVE ✅

**Database Structure:**
- ✅ archon_users_profile (users)
- ✅ archon_organizations (orgs)
- ✅ archon_departments (departments)
- ✅ archon_teams (teams)
- ✅ archon_org_memberships (org roles)
- ✅ archon_project_memberships (project roles)
- ✅ archon_permissions (permission matrix)
- ✅ archon_role_assignments (audit log)

**API Endpoints:**
- ✅ Organizations CRUD
- ✅ Departments CRUD
- ✅ Teams CRUD
- ✅ Role checking middleware
- ✅ Permission system

**Features:**
- ✅ 7-role hierarchy
- ✅ Invitation system
- ✅ Email invitations
- ✅ Password auth

---

## What's MISSING ❌

**Critical Gaps:**

1. **Team Assignment on Signup**
   - ❌ New users not assigned to teams
   - ❌ No default team creation
   - ❌ Department assignment missing

2. **User Profile Context**
   - ❌ User doesn't see their team
   - ❌ User doesn't see their department
   - ❌ No organization context displayed

3. **Team Page != Org Overview**
   - ❌ Shows member list, not org structure
   - ❌ No department view
   - ❌ No team hierarchy
   - ❌ Missing org tree visualization

4. **Role-Based Views**
   - ❌ All users see same dashboard
   - ❌ No department-specific view for managers
   - ❌ No team-specific view for leads
   - ❌ No "my tasks" view for members

5. **Agent Management**
   - ❌ No agent registration UI
   - ❌ No supervisor assignment
   - ❌ No capability configuration

---

## Implementation Plan

### Phase 10A: User Context (Priority 1)

**Goal:** Every user knows their team/dept/org

**Changes:**
1. Update signup to assign user to "General" team
2. Create default department if needed
3. Add user profile component showing:
   - Name
   - Role badge
   - Team
   - Department
   - Organization

**Code:**
- Update auth_service.register_user()
- Create UserProfileCard component
- Add to navigation

---

### Phase 10B: Organization Overview (Priority 1)

**Goal:** Team page shows org structure, not just members

**Changes:**
1. Rename "Team" page to "Organization"
2. Show org tree:
   - Organization
   - └─ Departments
   -     └─ Teams
   -         └─ Members

**Components:**
- OrganizationTreeView
- DepartmentCard (expandable)
- TeamCard (shows members)

---

### Phase 10C: Role-Based Dashboards (Priority 2)

**Goal:** Different view for each role

**Dashboards:**
- Owner/Admin → Organization overview
- Manager → Department dashboard
- Lead → Team dashboard
- Member → My tasks
- Viewer → Projects I can see

**Router logic:**
```typescript
if (role === 'owner' || role === 'admin') return <OrgDashboard />
if (role === 'manager') return <DepartmentDashboard />
if (role === 'lead') return <TeamDashboard />
if (role === 'member') return <MyTasksDashboard />
```

---

### Phase 10D: Agent Registration (Priority 3)

**Goal:** Complete agent registration flow

**Features:**
- Register agent UI
- Generate API key
- Set capabilities
- Assign supervisor
- Webhook configuration

---

## Quick Wins (Build First)

**30-minute fixes:**
1. ✅ User profile card in header
2. ✅ Show user's team/dept in profile
3. ✅ Organization tree on team page

**2-hour features:**
4. ✅ Role-based dashboard routing
5. ✅ Department view for managers
6. ✅ Team view for leads

---

## Current vs Spec Alignment

| Feature | Spec | Current | Gap |
|---------|------|---------|-----|
| 7 Roles | ✅ | ✅ | None |
| Org/Dept/Team structure | ✅ | ✅ | Not used in UI |
| Role assignment rules | ✅ | ✅ | Works |
| Invitation system | ✅ | ✅ | Works |
| Team assignment | ✅ | ❌ | Not implemented |
| Role-based views | ✅ | ❌ | All see same |
| Org tree visualization | ✅ | ❌ | Not built |
| Agent registration | ✅ | ⏳ | Backend ready |

---

**Should I build Phase 10 now (2-3 hours)?**

Or deploy current system and build Phase 10 after AWS deployment?
