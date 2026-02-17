/**
 * Dashboard Page - Role-Based Routing
 */

import { useAuth } from "../contexts/AuthContext";
import { ProfessionalDashboard } from "./ProfessionalDashboard";
import { ManagerDashboard } from "./dashboards/ManagerDashboard";
import { LeadDashboard } from "./dashboards/LeadDashboard";
import { MemberDashboard } from "./dashboards/MemberDashboard";

export function DashboardPage() {
  const { user } = useAuth();

  // Route based on role
  const role = user?.role || localStorage.getItem("10x-user-role") || "member";

  // DEBUG
  console.log("🔍 Dashboard Debug:", {
    userFromAuth: user,
    roleFromAuth: user?.role,
    roleFromLocalStorage: localStorage.getItem("10x-user-role"),
    finalRole: role,
  });

  if (role === "owner" || role === "admin") {
    console.log("→ Showing ProfessionalDashboard");
    return <ProfessionalDashboard />;
  }

  if (role === "manager") {
    console.log("→ Showing ManagerDashboard");
    return <ManagerDashboard />;
  }

  if (role === "lead") {
    console.log("→ Showing LeadDashboard");
    return <LeadDashboard />;
  }

  console.log("→ Showing MemberDashboard (default)");
  return <MemberDashboard />;
}
