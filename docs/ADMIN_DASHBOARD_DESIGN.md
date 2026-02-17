# Admin Dashboard - Complete Design Specification

**Professional organization management dashboard**

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Admin Profile & Org Header                                │
│ Deepak Chander · Owner @ Open Analyst                       │
│ [Profile] [Logout]                                           │
├─────────────────────────────────────────────────────────────┤
│ 📊 Organization Overview (4 Hero Cards)                      │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │👥 Members│📂Projects│📋 Tasks  │🏃 Sprints│              │
│ │    12    │    8     │   142    │    3     │              │
│ │ +2 this  │ +1 this  │ +18 this │ 2 active │              │
│ │  week    │  week    │  week    │          │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
├─────────────────────────────────────────────────────────────┤
│ 🌳 Organization Tree (Visual Hierarchy)                      │
│                                                              │
│              [Open Analyst - 12 members]                     │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                   │
│    Marketing (5)   Engineering (5)  Product (2)             │
│         │               │               │                   │
│    ┌────┴────┐     ┌───┴───┐      ┌───┴───┐               │
│  Content Social  Frontend Backend Design Research          │
│   (3)    (2)      (3)     (2)     (1)    (1)              │
├─────────────────────────────────────────────────────────────┤
│ 📊 Team Analytics (Left) │ 👥 Recent Team Activity (Right) │
│ ┌─────────────────────┐  │ • John joined 2h ago           │
│ │ Role Distribution   │  │ • Sarah promoted to Lead       │
│ │ ───────────────────│  │ • New dept: Customer Success   │
│ │ Owner:    █ 1      │  │ • Maya completed Sprint 3      │
│ │ Admin:    ██ 2     │  │ • 3 invitations pending        │
│ │ Manager:  ███ 3    │  │                                │
│ │ Lead:     ████ 4   │  │                                │
│ │ Member:   ██████ 6 │  │                                │
│ └─────────────────────┘  │                                │
├─────────────────────────────────────────────────────────────┤
│ 📈 Growth Trends                                             │
│ [Line chart showing member growth over time]                │
│ [Bar chart showing tasks completed per department]          │
├─────────────────────────────────────────────────────────────┤
│ 👥 Team Members Table                                        │
│ [Searchable, filterable table with all members]             │
│ Name | Email | Role | Department | Status | Last Active     │
└─────────────────────────────────────────────────────────────┘
```

---

## Components to Build

### 1. Admin Profile Header
**Shows:**
- Avatar
- Name
- Role badge
- Organization name
- Profile button
- Logout button

**Data source:**
```sql
SELECT
  u.id,
  u.display_name,
  u.email,
  u.avatar_url,
  om.org_role,
  o.name as org_name,
  o.id as org_id
FROM archon_users_profile u
JOIN archon_org_memberships om ON om.user_id = u.id
JOIN archon_organizations o ON o.id = om.org_id
WHERE u.id = current_user_id;
```

---

### 2. Organization Hero Cards

**Card 1: Team Members**
```
Current: 12
Change: +2 this week
Breakdown: 1 Owner, 2 Admin, 3 Manager, 4 Lead, 6 Member
Action: Click → Team Management
```

**Card 2: Active Projects**
```
Current: 8
Change: +1 this week
Status: 5 active, 2 planning, 1 completed
Action: Click → Projects
```

**Card 3: Tasks**
```
Current: 142
Change: +18 this week
Status: 23 todo, 15 doing, 8 review, 96 done
Action: Click → Task Board
```

**Card 4: Sprints**
```
Current: 3 total
Status: 2 active, 1 completed
Avg Velocity: 42 pts/sprint
Action: Click → Sprint Analytics
```

**Data source:**
```sql
-- Members
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as week_growth,
  COUNT(*) FILTER (WHERE org_role = 'owner') as owners,
  COUNT(*) FILTER (WHERE org_role = 'admin') as admins,
  COUNT(*) FILTER (WHERE org_role = 'manager') as managers,
  COUNT(*) FILTER (WHERE org_role = 'lead') as leads,
  COUNT(*) FILTER (WHERE org_role = 'member') as members
FROM archon_org_memberships
WHERE org_id = user_org_id
AND status = 'active';

-- Projects, Tasks, Sprints (similar)
```

---

### 3. Organization Tree (Visual Hierarchy)

**Interactive tree showing:**
- Organization at root
- Departments as branches
- Teams as sub-branches
- Member count at each level
- Expandable/collapsible
- Hover shows details

**Library:** React Flow or react-organizational-chart

**Data source:**
```sql
-- Get full org structure
SELECT
  o.id as org_id,
  o.name as org_name,

  d.id as dept_id,
  d.name as dept_name,
  (SELECT COUNT(*) FROM archon_org_memberships WHERE team_id IN (
    SELECT id FROM archon_teams WHERE dept_id = d.id
  )) as dept_member_count,

  t.id as team_id,
  t.name as team_name,
  (SELECT COUNT(*) FROM archon_org_memberships WHERE team_id = t.id) as team_member_count
FROM archon_organizations o
LEFT JOIN archon_departments d ON d.org_id = o.id
LEFT JOIN archon_teams t ON t.dept_id = d.id
WHERE o.id = user_org_id
ORDER BY d.name, t.name;
```

---

### 4. Role Distribution Chart

**Donut/Pie chart showing:**
- Owner: 1 (8%)
- Admin: 2 (17%)
- Manager: 3 (25%)
- Lead: 4 (33%)
- Member: 6 (50%)
- Viewer: 0 (0%)

**Interactive:**
- Hover → Show names
- Click → Filter team list

**Library:** Recharts

---

### 5. Growth Trends Chart

**Line chart showing:**
- X-axis: Last 30/90/180 days
- Y-axis: Team size
- Multiple lines:
  - Total members (blue)
  - Active contributors (green)
  - New joins (purple)

**Data source:**
```sql
-- Member growth over time
SELECT
  DATE(created_at) as join_date,
  COUNT(*) as members_joined,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_total
FROM archon_org_memberships
WHERE org_id = user_org_id
GROUP BY DATE(created_at)
ORDER BY join_date;
```

---

### 6. Department Performance Cards

**For each department:**
```
Marketing Department
Manager: Priya
Members: 5
Teams: 2 (Content, Social)
Active Sprints: 1
Velocity: 35 pts/sprint
Capacity: 78% utilized
```

**Expandable to show teams.**

---

### 7. Team Members Table

**Searchable table with:**
```
Columns:
- Avatar
- Name
- Email
- Role (badge with color)
- Department/Team
- Status (active/inactive)
- Last Active
- Actions (Edit, Deactivate)

Features:
- Search by name/email
- Filter by role
- Filter by department
- Sort by any column
- Bulk actions
- Export to CSV
```

**Actions:**
- View profile
- Change role
- Move team
- Deactivate user

---

### 8. Pending Invitations Panel

```
⏳ Pending Invitations (3)

john@company.com    Lead       Sent 2 days ago    [Resend] [Revoke]
sarah@company.com   Member     Sent 5 hours ago   [Resend] [Revoke]
mike@company.com    Manager    Expires in 2 days  [Resend] [Revoke]
```

---

### 9. Quick Actions Sidebar

**Always visible:**
```
[+ Invite Member]
[+ Create Project]
[+ Create Department]
[+ Create Team]
[📊 View Full Analytics]
[⚙️ Organization Settings]
```

---

### 10. Activity Feed

**Real-time stream:**
```
🎉 John Doe joined as Lead (2 minutes ago)
📋 Sprint 3 completed with 42 story points (1 hour ago)
👤 Sarah promoted from Member to Lead (3 hours ago)
📂 New project "API v2" created (5 hours ago)
⚠️ Sprint 2 at 95% capacity (1 day ago)
✅ 23 tasks completed this week (1 day ago)
```

---

## Implementation Plan

### Week 1: Core Dashboard (Priority 1)
- [ ] Admin profile header
- [ ] Hero cards with real data
- [ ] Team members table
- [ ] Pending invitations panel
- [ ] Quick actions

### Week 2: Visual Analytics (Priority 2)
- [ ] Organization tree component
- [ ] Role distribution chart
- [ ] Growth trends chart
- [ ] Department performance cards

### Week 3: Advanced Features (Priority 3)
- [ ] Real-time activity feed
- [ ] Advanced filtering
- [ ] Bulk actions
- [ ] Export capabilities

---

## Database Queries Needed

### Dashboard Stats Query
```sql
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  o.id as org_id,
  o.name as org_name,

  -- Members
  (SELECT COUNT(*) FROM archon_org_memberships WHERE org_id = o.id AND status = 'active') as total_members,
  (SELECT COUNT(*) FROM archon_org_memberships WHERE org_id = o.id AND created_at >= NOW() - INTERVAL '7 days') as members_this_week,

  -- Projects
  (SELECT COUNT(*) FROM archon_projects WHERE org_id = o.id) as total_projects,
  (SELECT COUNT(*) FROM archon_projects WHERE org_id = o.id AND created_at >= NOW() - INTERVAL '7 days') as projects_this_week,

  -- Tasks
  (SELECT COUNT(*) FROM archon_tasks WHERE project_id IN (SELECT id FROM archon_projects WHERE org_id = o.id)) as total_tasks,

  -- Sprints
  (SELECT COUNT(*) FROM archon_sprints WHERE project_id IN (SELECT id FROM archon_projects WHERE org_id = o.id)) as total_sprints,
  (SELECT COUNT(*) FROM archon_sprints WHERE project_id IN (SELECT id FROM archon_projects WHERE org_id = o.id) AND status = 'active') as active_sprints,

  -- Pending invitations
  (SELECT COUNT(*) FROM archon_invitations WHERE org_id = o.id AND status = 'pending') as pending_invitations

FROM archon_organizations o;
```

### Team Member List Query
```sql
SELECT
  u.id,
  u.display_name,
  u.email,
  u.avatar_url,
  u.status,
  u.last_active_at,
  om.org_role,
  om.joined_at,
  d.name as department_name,
  t.name as team_name,
  t.id as team_id
FROM archon_users_profile u
JOIN archon_org_memberships om ON om.user_id = u.id
LEFT JOIN archon_teams t ON t.id = om.team_id
LEFT JOIN archon_departments d ON d.id = t.dept_id
WHERE om.org_id = user_org_id
AND om.status = 'active'
ORDER BY om.org_role DESC, u.display_name;
```

---

## Features by Priority

### Must-Have (MVP)
1. ✅ Real member count
2. ✅ Team members list
3. ✅ Pending invitations
4. ✅ Quick actions
5. ✅ Basic stats

### Should-Have (V1.1)
6. Organization tree
7. Role distribution chart
8. Department cards
9. Activity feed
10. Search & filters

### Nice-to-Have (V1.2)
11. Growth trends
12. Performance metrics
13. Export capabilities
14. Custom dashboards

---

## Technical Stack

**Visualizations:**
- Recharts (bar, line, pie charts)
- React Flow (org tree)
- Tanstack Table (member list)

**Real-time:**
- Smart polling (30-second intervals)
- Optimistic updates
- ETag caching

---

**Should I build the MVP dashboard now (1-2 hours)?**

Or document and deploy current system first?
