/**
 * Dashboard Page - Role-Based Redirect
 *
 * Shows different dashboard based on user role
 */

import { BarChart3, Users, Target, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../features/ui/primitives/button";
import { cn } from "../features/ui/primitives/styles";

export function DashboardPage() {
  const navigate = useNavigate();

  // TODO: Get actual user role from auth context
  const userRole = "owner"; // Mock for now

  // Role-based dashboard content
  const dashboards = {
    owner: <AdminDashboard />,
    admin: <AdminDashboard />,
    manager: <ManagerDashboard />,
    lead: <LeadDashboard />,
    member: <MemberDashboard />,
    viewer: <ViewerDashboard />,
  };

  return dashboards[userRole as keyof typeof dashboards] || <MemberDashboard />;
}

// Admin/Owner Dashboard
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0, sprints: 0 });

  // Fetch real stats
  useEffect(() => {
    async function fetchStats() {
      try {
        // Get real data from APIs
        const [projectsRes, tasksRes] = await Promise.all([
          fetch("/api/projects", { headers: { "X-User-Id": localStorage.getItem("10x-user-id") || "" } }),
          fetch("/api/projects/task-counts", { headers: { "X-User-Id": localStorage.getItem("10x-user-id") || "" } }),
        ]);

        const projects = await projectsRes.json();
        const taskCounts = await tasksRes.json();

        const totalTasks = Object.values(taskCounts).reduce((sum: number, counts: any) =>
          sum + (counts.todo || 0) + (counts.doing || 0) + (counts.review || 0) + (counts.done || 0), 0
        );

        setStats({
          users: 1, // TODO: Fetch from users API
          projects: Array.isArray(projects) ? projects.length : 0,
          tasks: totalTasks,
          sprints: 1, // TODO: Fetch from sprints API
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organization overview and system management
        </p>
      </div>

      {/* Quick Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={stats.users.toString()} color="blue" />
        <StatCard icon={Target} label="Active Projects" value={stats.projects.toString()} color="purple" />
        <StatCard icon={CheckSquare} label="Tasks" value={stats.tasks.toString()} color="green" />
        <StatCard icon={BarChart3} label="Active Sprints" value={stats.sprints.toString()} color="orange" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Manage Team"
          description="Invite members, assign roles"
          icon={Users}
          onClick={() => navigate("/team")}
        />
        <QuickActionCard
          title="View Projects"
          description="Manage all projects"
          icon={Target}
          onClick={() => navigate("/projects")}
        />
        <QuickActionCard
          title="Analytics"
          description="View system analytics"
          icon={BarChart3}
          onClick={() => navigate("/projects")}
        />
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        {stats.projects === 0 && stats.tasks === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">Activity feed coming soon...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Manager Dashboard
function ManagerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Manager Dashboard</h1>
      <p className="text-gray-600 mt-2">Department and team management (Coming soon)</p>
    </div>
  );
}

// Lead Dashboard
function LeadDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Team Lead Dashboard</h1>
      <p className="text-gray-600 mt-2">Team task board and member management (Coming soon)</p>
    </div>
  );
}

// Member Dashboard
function MemberDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">My Dashboard</h1>
      <p className="text-gray-600 mt-2">Your tasks and activity (Coming soon)</p>
    </div>
  );
}

// Viewer Dashboard
function ViewerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Project View</h1>
      <p className="text-gray-600 mt-2">Read-only access (Coming soon)</p>
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    green: "text-green-600 bg-green-50 dark:bg-green-900/20",
    orange: "text-[#C0745F] bg-[#C0745F]/10",
  };

  return (
    <div className={cn("p-4 rounded-lg", colors[color] || colors.blue)}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="p-6 text-left bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50 hover:border-[#C0745F]/50 transition-all"
    >
      <Icon className="w-6 h-6 text-[#C0745F] mb-3" />
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </button>
  );
}

function ActivityItem({ action, detail, time }: any) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-2 h-2 rounded-full bg-[#C0745F] mt-2" />
      <div className="flex-1">
        <div className="text-gray-900 dark:text-white font-medium">{action}</div>
        <div className="text-gray-600 dark:text-gray-400">{detail}</div>
      </div>
      <div className="text-gray-500 text-xs">{time}</div>
    </div>
  );
}
