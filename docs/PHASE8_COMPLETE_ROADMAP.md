```# Phase 8: Complete User Management System

## Overview

Transform 10x PM into a multi-user collaborative system with role-based dashboards, onboarding, and profiles.

---

## Part 1: Authentication & Onboarding ✅ (Current)

**Status:** Backend Complete, UI in Progress

**Features:**
- ✅ Invitation system (database + API)
- ✅ Email sending (SendGrid SMTP)
- ✅ Invite acceptance page
- ✅ User creation on acceptance

**TODO:**
- [ ] Sign-up page (first user)
- [ ] Login page
- [ ] Logout functionality
- [ ] Session management
- [ ] Remember me / JWT tokens

---

## Part 2: Organization Setup (NEW)

**First-Time User Flow:**

### Step 1: Sign Up (No Account Yet)
- User visits `http://10x.pm`
- Sees: "Get Started" or "Sign Up"
- Enters: Email, Name, Password
- Click: "Create Account"

### Step 2: Organization Creation
- System detects: No organization exists
- Shows: "Create Your Organization"
- User fills:
  - Organization Name
  - Company Domain
  - Industry
  - Team Size
- Click: "Create Organization"
- **Result:** User becomes OWNER automatically

### Step 3: Setup Wizard
- **Welcome Screen:** "Welcome to 10x PM!"
- **Team Setup:** "Invite your first team members"
- **First Project:** "Create your first project" (optional)
- **Tour:** Quick feature tour
- Click: "Get Started"

### Step 4: Main Dashboard
- Redirect to role-appropriate dashboard
- First user sees: Admin Dashboard

---

## Part 3: Role-Based Dashboards

### Admin Dashboard
**URL:** `/dashboard` or `/admin`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 🏢 Organization Overview                         │
├────────────────┬─────────────────────────────────┤
│ Quick Stats    │ Recent Activity                 │
│ • Users: 12    │ • John joined 2h ago            │
│ • Projects: 5  │ • Sprint 3 started              │
│ • Sprints: 8   │ • Task assigned to Maya         │
│ • Active: 3    │                                 │
├────────────────┴─────────────────────────────────┤
│ 👥 Team Management                               │
│ [User List with Roles]                           │
│ [Pending Invitations]                            │
├──────────────────────────────────────────────────┤
│ 📊 System Analytics                              │
│ [Velocity Trends] [Capacity] [Performance]       │
└──────────────────────────────────────────────────┘
```

**Widgets:**
- Organization stats
- User management table
- Pending invitations
- System health
- Analytics overview
- Recent activity feed

---

### Manager Dashboard
**URL:** `/dashboard/manager`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 📂 My Departments                                │
├────────────────┬─────────────────────────────────┤
│ Dept Stats     │ Team Performance                │
│ • Teams: 3     │ Marketing  [||||||||  ] 85%     │
│ • Members: 15  │ Content    [||||||    ] 65%     │
│ • Projects: 4  │ Social     [||||||||||] 92%     │
├────────────────┴─────────────────────────────────┤
│ 🎯 Active Projects                               │
│ [Project Cards with Progress]                    │
├──────────────────────────────────────────────────┤
│ 🏃 Active Sprints                                │
│ Sprint 1: [Progress Bar] 78% | 5 days left       │
│ Sprint 2: [Progress Bar] 45% | 9 days left       │
└──────────────────────────────────────────────────┘
```

**Widgets:**
- Department overview
- Team capacity heatmap
- Project list (department's projects)
- Sprint status cards
- Resource allocation

---

### Team Lead Dashboard
**URL:** `/dashboard/lead`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 👥 My Team: Content Team                        │
├────────────────┬─────────────────────────────────┤
│ Team Stats     │ Team Members                    │
│ • Members: 5   │ • Maya    [||||||||  ] 80%      │
│ • Tasks: 23    │ • Ravi    [||||||    ] 60%      │
│ • In Progress:8│ • Lisa    [||||||||||] 95%      │
├────────────────┴─────────────────────────────────┤
│ 📋 Team Task Board (Kanban)                      │
│ [To Do] [Doing] [Review] [Done]                  │
├──────────────────────────────────────────────────┤
│ 🏃 Current Sprint                                │
│ Sprint 1 - Foundation | 12 tasks | 78% complete  │
└──────────────────────────────────────────────────┘
```

**Widgets:**
- Team member cards
- Workload distribution
- Team task board
- Current sprint progress
- Blockers & dependencies

---

### Member Dashboard
**URL:** `/dashboard` or `/my-tasks`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 👤 My Dashboard                                  │
├────────────────┬─────────────────────────────────┤
│ My Stats       │ My Activity                     │
│ • Assigned: 8  │ • Started DS-001 (1h ago)       │
│ • Completed:12 │ • Completed AD-005 (3h ago)     │
│ • This Week:3  │ • Comment on CC-002             │
├────────────────┴─────────────────────────────────┤
│ 📋 My Tasks                                      │
│ [To Do: 3] [Doing: 2] [Review: 1] [Done: 2]      │
├──────────────────────────────────────────────────┤
│ ⏰ Upcoming Deadlines                            │
│ • DS-003: Due in 2 days                          │
│ • AD-007: Due tomorrow ⚠️                        │
└──────────────────────────────────────────────────┘
```

**Widgets:**
- Personal task list
- Current sprint tasks
- Recent activity
- Deadline reminders
- Personal velocity

---

### Viewer Dashboard
**URL:** `/dashboard/viewer`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ 👁️ Project View (Read-Only)                     │
├──────────────────────────────────────────────────┤
│ 📊 Projects I Can View                           │
│ [Project Cards - Read Only]                      │
├──────────────────────────────────────────────────┤
│ 📈 Progress Reports                              │
│ [Charts and Metrics]                             │
└──────────────────────────────────────────────────┘
```

**Widgets:**
- Project progress cards
- Read-only sprint boards
- Analytics & reports
- No edit capabilities

---

## Part 4: User Profiles

**Profile Page Layout:**
```
┌──────────────────────────────────────────────────┐
│ [Avatar]  John Doe                               │
│           john@company.com                       │
│           Lead · Content Team                    │
├──────────────────────────────────────────────────┤
│ 📊 Performance Stats                             │
│ • Tasks Completed: 47                            │
│ • Avg Time: 4.2 hours                            │
│ • Velocity: 12 pts/sprint                        │
├──────────────────────────────────────────────────┤
│ 📈 Activity History                              │
│ [Timeline of actions]                            │
└──────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Week 1: Core Auth & Onboarding
- [ ] Sign-up page
- [ ] Login page
- [ ] Organization setup wizard
- [ ] First-user-becomes-admin logic
- [ ] Session management

### Week 2: Dashboards
- [ ] Dashboard router (redirects based on role)
- [ ] Admin dashboard
- [ ] Manager dashboard
- [ ] Lead dashboard
- [ ] Member dashboard

### Week 3: Profiles & Polish
- [ ] User profile pages
- [ ] Edit profile
- [ ] Activity feeds
- [ ] Performance metrics per user

---

## Database Requirements

**Already Have:**
- ✅ Users, organizations, roles
- ✅ Memberships, permissions
- ✅ Invitations, sessions
- ✅ Activity log

**Need to Add:**
- [ ] User preferences
- [ ] Dashboard layouts (customizable)
- [ ] Notification preferences
- [ ] Timezone settings

---

## Current Status

**✅ Phase 8A Complete:**
- Invitation system
- Email sending (SMTP)
- Invite acceptance
- User creation

**⏳ Phase 8B (Next):**
- Sign-up flow
- Organization setup
- Login/logout
- Role-based dashboards

**⏳ Phase 8C (Later):**
- User profiles
- Activity feeds
- Customizable dashboards

---

## Recommendation

**Build Phase 8B First:**
1. Sign-up page (30 min)
2. Org setup wizard (1 hour)
3. Login page (30 min)
4. Dashboard router (1 hour)
5. Basic admin dashboard (2 hours)

**Total Time:** ~5 hours
**Value:** Complete user onboarding!

**Then you'll have:**
- Real authentication
- Multi-organization support
- Role-based dashboards
- Production-ready!

---

## Quick Win Approach

**Build MVP dashboards first:**
1. Create dashboard router (redirects based on role)
2. Admin dashboard: Reuse existing analytics + add user list
3. Other roles: Redirect to projects for now
4. Enhance later with role-specific widgets

**Time:** 2-3 hours
**Gets you:** Working multi-user system!

Would you like to build this?
```
