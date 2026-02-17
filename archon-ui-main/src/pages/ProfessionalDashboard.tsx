/**
 * Professional Admin Dashboard
 *
 * Production-ready dashboard with real data, error handling, and auto-refresh
 */

import { BarChart3, Users, Target, CheckSquare, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../features/ui/primitives/button";
import { cn } from "../features/ui/primitives/styles";

interface DashboardStats {
  members: { total: number; by_role: Record<string, number> };
  projects: { total: number };
  tasks: { total: number; by_status: Record<string, number> };
  sprints: { total: number; active: number };
  pending_invitations: number;
}

interface TeamMember {
  user_id: string;
  org_role: string;
  status: string;
  archon_users_profile: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function ProfessionalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all dashboard data
  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      try {
        const userId = localStorage.getItem("10x-user-id");
        if (!userId) {
          setError("Not logged in");
          setIsLoading(false);
          return;
        }

        const headers = { "X-User-Id": userId };

        // Fetch stats and members in parallel
        const [statsRes, membersRes] = await Promise.all([
          fetch("/api/admin/dashboard/stats", { headers }),
          fetch("/api/admin/team/members", { headers }),
        ]);

        if (!mounted) return;

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }

        setError("");
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#C0745F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-red-800 mb-1">Error Loading Dashboard</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C0745F] to-[#D4917A] flex items-center justify-center text-white text-2xl font-bold">
            {user?.display_name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.display_name || "Admin"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Owner @ {user?.org_name || "Organization"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}>
          Logout
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Team Members"
          value={stats?.members.total || 0}
          change={`${Object.keys(stats?.members.by_role || {}).length} roles`}
          color="blue"
          onClick={() => navigate("/team")}
        />
        <StatCard
          icon={Target}
          label="Projects"
          value={stats?.projects.total || 0}
          change="Active"
          color="purple"
          onClick={() => navigate("/projects")}
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={stats?.tasks.total || 0}
          change={`${stats?.tasks.by_status?.done || 0} done`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Sprints"
          value={stats?.sprints.active || 0}
          change={`${stats?.sprints.total || 0} total`}
          color="orange"
        />
      </div>

      {/* Team Members Section */}
      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
          <Button onClick={() => navigate("/team")} size="sm">
            Manage Team
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No team members yet</p>
            <p className="text-sm mt-1">Invite your first team member to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C0745F] text-white flex items-center justify-center font-bold">
                    {member.archon_users_profile?.display_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.archon_users_profile?.display_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.archon_users_profile?.email || ""}
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  member.org_role === "owner" && "bg-yellow-100 text-yellow-800",
                  member.org_role === "admin" && "bg-purple-100 text-purple-800",
                  member.org_role === "manager" && "bg-blue-100 text-blue-800",
                  member.org_role === "lead" && "bg-[#C0745F]/20 text-[#C0745F]",
                  member.org_role === "member" && "bg-green-100 text-green-800"
                )}>
                  {member.org_role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {stats && stats.pending_invitations > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800 dark:text-orange-200">
              {stats.pending_invitations} pending invitation{stats.pending_invitations > 1 ? "s" : ""}
            </span>
            <Button onClick={() => navigate("/team")} size="sm" variant="outline">
              View
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable stat card
function StatCard({ icon: Icon, label, value, change, color, onClick }: any) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100",
    orange: "bg-[#C0745F]/10 text-[#C0745F] hover:bg-[#C0745F]/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-6 rounded-lg transition-all text-left",
        colors[color]
      )}
    >
      <Icon className="w-8 h-8 mb-3" />
      <div className="text-4xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-xs opacity-75">{change}</div>
    </button>
  );
}
