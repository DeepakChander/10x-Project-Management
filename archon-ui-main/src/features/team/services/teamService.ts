/**
 * Team Management Service
 *
 * API client for invitations and user management
 */

import { callAPIWithETag } from "../../shared/api/apiClient";

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  invited_role: string;
  invited_by: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invite_link: string;
  expires_at: string;
  personal_message?: string;
  created_at: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: string;
  team_id?: string;
  department_id?: string;
  personal_message?: string;
}

export interface TeamMember {
  id: string;
  display_name: string;
  email: string;
  user_type: "human" | "agent";
  org_role: string;
  status: string;
  joined_at: string;
}

export const teamService = {
  /**
   * Create an invitation
   */
  async createInvitation(orgId: string, data: CreateInvitationRequest): Promise<Invitation> {
    try {
      const response = await callAPIWithETag<{ message: string; invitation: Invitation }>(
        `/api/invitations/${orgId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response.invitation;
    } catch (error) {
      console.error("Failed to create invitation:", error);
      throw error;
    }
  },

  /**
   * List invitations
   */
  async listInvitations(orgId: string, status?: string): Promise<Invitation[]> {
    try {
      const url = status
        ? `/api/invitations/${orgId}?status=${status}`
        : `/api/invitations/${orgId}`;

      const invitations = await callAPIWithETag<Invitation[]>(url);
      return invitations;
    } catch (error) {
      console.error("Failed to list invitations:", error);
      throw error;
    }
  },

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    try {
      await callAPIWithETag(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      throw error;
    }
  },

  /**
   * Get organization members
   */
  async getOrgMembers(orgId: string): Promise<TeamMember[]> {
    try {
      const members = await callAPIWithETag<TeamMember[]>(
        `/api/organizations/${orgId}/members`
      );
      return members;
    } catch (error) {
      console.error("Failed to get org members:", error);
      throw error;
    }
  },
};
