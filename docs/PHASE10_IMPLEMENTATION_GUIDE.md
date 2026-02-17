# Phase 10: Complete Role System Implementation

**Status:** Part A ✅ Complete | Parts B, C, D → Ready to build

---

## Part A: User Profile Context ✅ DONE

**Implemented:**
- UserProfileCard component
- Shows role, team, dept, org
- Logout functionality
- Signup creates dept + team

---

## Part B: Organization Overview (Next)

**Build organization tree view on Team page**

**Component:** `OrganizationTreeView.tsx`

```typescript
// Visual tree showing:
Organization (12 members)
├─ Marketing Department (5 members)
│  ├─ Content Team (3)
│  └─ Social Team (2)
├─ Engineering Department (5)
│  ├─ Frontend Team (3)
│  └─ Backend Team (2)
└─ Product Department (2)
   ├─ Design Team (1)
   └─ Research Team (1)
```

**Data Endpoint:** Create `/api/admin/org-structure`

**Library:** react-organizational-chart or custom CSS tree

---

## Part C: Role-Based Dashboard Views (Next)

**Create 5 different dashboards:**

### 1. Owner/Admin Dashboard
- Org-wide stats
- All departments
- All projects
- System health

### 2. Manager Dashboard
```typescript
ManagerDashboard.tsx
- My department overview
- Teams in my department
- Department projects
- Team capacity
- Department analytics
```

### 3. Lead Dashboard
```typescript
LeadDashboard.tsx
- My team overview
- Team members
- Team task board
- Sprint progress
- Team velocity
```

### 4. Member Dashboard
```typescript
MemberDashboard.tsx
- My tasks (todo, doing, review)
- My sprints
- My recent activity
- Upcoming deadlines
```

### 5. Viewer Dashboard
```typescript
ViewerDashboard.tsx
- Projects I can view
- Read-only task boards
- Progress reports
```

**Router:**
```typescript
const roleRoutes = {
  owner: <OrgDashboard />,
  admin: <OrgDashboard />,
  manager: <ManagerDashboard />,
  lead: <LeadDashboard />,
  member: <MemberDashboard />,
  viewer: <ViewerDashboard />,
};

return roleRoutes[user.role];
```

---

## Part D: Agent Registration (Next)

**Complete agent registration flow:**

**RegisterAgentModal.tsx** (partially done, needs completion):
- Agent name
- Webhook URL
- Capabilities checkboxes
- Supervisor selection
- Generate API key button
- Display key (show once!)

**API Integration:**
- Use `/api/api-keys/generate`
- Create agent user
- Assign to team
- Return API key

---

## Implementation Order

**Session 1 (Current):**
- ✅ Part A done

**Session 2 (Fresh):**
- Part B: Org tree (2 hours)
- Part C: Role dashboards (3 hours)
- Part D: Agent UI (1 hour)

**Total:** 6 hours of focused work

---

**Ready to continue in fresh session or build now?**
