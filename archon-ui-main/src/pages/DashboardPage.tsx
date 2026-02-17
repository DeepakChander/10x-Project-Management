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

  if (role === "owner" || role === "admin") {
    return <ProfessionalDashboard />;
  }

  if (role === "manager") {
    return <ManagerDashboard />;
  }

  if (role === "lead") {
    return <LeadDashboard />;
  }

  return <MemberDashboard />;
}
