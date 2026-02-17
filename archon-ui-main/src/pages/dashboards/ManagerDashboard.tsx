/**
 * Manager Dashboard
 * Department-focused view
 */

import { BarChart3, Users, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deptStats, setDeptStats] = useState({ teams: 0, members: 0, projects: 0 });

  useEffect(() => {
    // TODO: Fetch department-specific stats
    setDeptStats({ teams: 2, members: 5, projects: 3 });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Department Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          General Department • {user?.display_name}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Users} label="Teams" value={deptStats.teams} onClick={() => navigate("/team")} />
        <StatCard icon={Users} label="Members" value={deptStats.members} onClick={() => navigate("/team")} />
        <StatCard icon={Briefcase} label="Projects" value={deptStats.projects} onClick={() => navigate("/projects")} />
      </div>

      <div className="p-8 bg-white/30 dark:bg-zinc-900/30 rounded-lg border text-center">
        <p className="text-gray-600">Department analytics and team management coming soon</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left hover:bg-blue-100 transition">
      <Icon className="w-6 h-6 text-blue-600 mb-2" />
      <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{value}</div>
      <div className="text-sm text-blue-700 dark:text-blue-300">{label}</div>
    </button>
  );
}
