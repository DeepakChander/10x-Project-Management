/**
 * Team Management Page
 */

import { useAuth } from "../contexts/AuthContext";
import { TeamManagementView } from "../features/team/views/TeamManagementView";

export function TeamPage() {
  const { user } = useAuth();

  // Use user's org from auth context
  const orgId = user?.org_id || localStorage.getItem("10x-org-id") || "00000000-0000-0000-0000-000000000002";

  return <TeamManagementView orgId={orgId} />;
}
