/**
 * Team Management Page
 *
 * Page for managing team members, invitations, and roles
 */

import { TeamManagementView } from "../features/team/views/TeamManagementView";

export function TeamPage() {
  // Get user's org from localStorage (set during signup)
  const userOrgId = localStorage.getItem("10x-org-id") || "00000000-0000-0000-0000-000000000002";

  return <TeamManagementView orgId={userOrgId} />;
}
