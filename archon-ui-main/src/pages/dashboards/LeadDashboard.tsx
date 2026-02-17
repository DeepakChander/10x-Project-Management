/**
 * Lead Dashboard - Team-focused view
 */

import { Users, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LeadDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Lead Dashboard</h1>
      <p className="text-gray-600">General Team</p>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate("/team")} className="p-6 bg-[#C0745F]/10 rounded-lg text-left">
          <Users className="w-6 h-6 text-[#C0745F] mb-2" />
          <div className="text-3xl font-bold">5</div>
          <div className="text-sm">Team Members</div>
        </button>

        <button onClick={() => navigate("/projects")} className="p-6 bg-green-50 rounded-lg text-left">
          <CheckSquare className="w-6 h-6 text-green-600 mb-2" />
          <div className="text-3xl font-bold">12</div>
          <div className="text-sm">Team Tasks</div>
        </button>
      </div>
    </div>
  );
}
