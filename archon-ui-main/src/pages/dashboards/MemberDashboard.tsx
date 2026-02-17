/**
 * Member Dashboard - Personal task view
 */

import { CheckSquare, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MemberDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate("/projects")} className="p-6 bg-pink-50 rounded-lg text-left">
          <CheckSquare className="w-6 h-6 text-pink-600 mb-2" />
          <div className="text-3xl font-bold">8</div>
          <div className="text-sm">My Tasks</div>
        </button>

        <button onClick={() => navigate("/projects")} className="p-6 bg-orange-50 rounded-lg text-left">
          <Clock className="w-6 h-6 text-orange-600 mb-2" />
          <div className="text-3xl font-bold">3</div>
          <div className="text-sm">Due This Week</div>
        </button>
      </div>
    </div>
  );
}
