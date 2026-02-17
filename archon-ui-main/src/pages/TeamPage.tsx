/**
 * Team Management Page
 *
 * Page for managing team members, invitations, and roles
 */

import { TeamManagementView } from "../features/team/views/TeamManagementView";

export function TeamPage() {
  // Using dev org for now
  const devOrgId = "00000000-0000-0000-0000-000000000002";

  return <TeamManagementView orgId={devOrgId} />;
}
