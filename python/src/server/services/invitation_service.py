"""
Invitation Service

Handles user invitations, acceptance, and onboarding
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from ..utils import get_supabase_client
from .email.email_service import EmailService

logger = logging.getLogger(__name__)


class InvitationService:
    """Service for managing user invitations"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def create_invitation(
        self,
        org_id: str,
        email: str,
        role: str,
        invited_by: str,
        team_id: Optional[str] = None,
        department_id: Optional[str] = None,
        personal_message: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create an invitation for a new user.

        Args:
            org_id: Organization to invite to
            email: Email address of invitee
            role: Role to assign (member, lead, manager, etc.)
            invited_by: User ID of person sending invitation
            team_id: Team to assign to (optional)
            department_id: Department to assign to (optional)
            personal_message: Optional message from inviter

        Returns:
            Created invitation record
        """
        try:
            # Check if user already exists
            existing_user = (
                self.client.table("archon_users_profile")
                .select("id")
                .eq("email", email)
                .execute()
            )

            if existing_user.data:
                raise ValueError(f"User with email {email} already exists")

            # Check if invitation already pending
            existing_invite = (
                self.client.table("archon_invitations")
                .select("id")
                .eq("email", email)
                .eq("org_id", org_id)
                .eq("status", "pending")
                .execute()
            )

            if existing_invite.data:
                raise ValueError(f"Pending invitation already exists for {email}")

            # Generate secure token
            invite_token = secrets.token_urlsafe(32)

            # Create invite link using configured base URL
            import os
            base_url = os.getenv("APP_BASE_URL", "http://localhost:3737")
            invite_link = f"{base_url}/invite/{invite_token}"

            # Calculate expiration (7 days)
            expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

            # Create invitation
            invitation_data = {
                "org_id": org_id,
                "team_id": team_id,
                "department_id": department_id,
                "email": email,
                "invited_role": role,
                "invited_by": invited_by,
                "invite_token": invite_token,
                "invite_link": invite_link,
                "expires_at": expires_at,
                "personal_message": personal_message,
            }

            response = self.client.table("archon_invitations").insert(invitation_data).execute()

            if response.data:
                invitation = response.data[0]
                logger.info(
                    f"Invitation created | email={email} | role={role} | "
                    f"org={org_id} | expires={expires_at}"
                )

                # Send invitation email
                self._send_invitation_email(invitation)

                return invitation
            else:
                raise Exception("Failed to create invitation")

        except ValueError as e:
            logger.warning(f"Invitation validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to create invitation: {e}", exc_info=True)
            raise

    def get_invitation_by_token(self, token: str) -> Optional[dict]:
        """Get invitation by token (for acceptance flow)"""
        try:
            response = (
                self.client.table("archon_invitations")
                .select("*")
                .eq("invite_token", token)
                .execute()
            )

            if not response.data:
                return None

            invitation = response.data[0]

            # Check if expired
            if invitation["status"] == "pending":
                expires_at = datetime.fromisoformat(invitation["expires_at"].replace("Z", "+00:00"))
                if expires_at < datetime.now(timezone.utc):
                    # Mark as expired
                    self.client.table("archon_invitations").update(
                        {"status": "expired"}
                    ).eq("id", invitation["id"]).execute()

                    return None

            return invitation

        except Exception as e:
            logger.error(f"Failed to get invitation by token: {e}", exc_info=True)
            return None

    def get_invitation_by_id(self, invitation_id: str) -> Optional[dict]:
        """Get invitation by ID (for permission checking and revocation)"""
        try:
            response = (
                self.client.table("archon_invitations")
                .select("*")
                .eq("id", invitation_id)
                .execute()
            )

            if not response.data:
                return None

            return response.data[0]

        except Exception as e:
            logger.error(f"Failed to get invitation by ID: {e}", exc_info=True)
            return None

    def accept_invitation(
        self,
        token: str,
        display_name: str,
        password: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Accept an invitation and create user account.

        Args:
            token: Invitation token from link
            display_name: User's display name
            password_hash: Hashed password (optional for now)

        Returns:
            Created user profile and org membership
        """
        try:
            # Get invitation
            invitation = self.get_invitation_by_token(token)

            if not invitation:
                raise ValueError("Invalid or expired invitation")

            if invitation["status"] != "pending":
                raise ValueError(f"Invitation already {invitation['status']}")

            # Create user profile with hashed password
            user_data = {
                "email": invitation["email"],
                "display_name": display_name,
                "user_type": "human",
                "status": "active",
            }

            # Hash password if provided using secure bcrypt
            if password:
                from .auth_service import AuthService
                auth_service = AuthService(self.client)
                password_hash = auth_service.hash_password(password)
                user_data["password_hash"] = password_hash

            user_response = self.client.table("archon_users_profile").insert(user_data).execute()

            if not user_response.data:
                raise Exception("Failed to create user profile")

            new_user = user_response.data[0]

            # Create org membership
            membership_data = {
                "user_id": new_user["id"],
                "org_id": invitation["org_id"],
                "org_role": invitation["invited_role"],
                "status": "active",
            }

            self.client.table("archon_org_memberships").insert(membership_data).execute()

            # Mark invitation as accepted
            self.client.table("archon_invitations").update({
                "status": "accepted",
                "accepted_at": datetime.now(timezone.utc).isoformat(),
                "accepted_by": new_user["id"],
            }).eq("id", invitation["id"]).execute()

            logger.info(
                f"Invitation accepted | user={new_user['id']} | "
                f"email={invitation['email']} | role={invitation['invited_role']}"
            )

            return {
                "user": new_user,
                "organization": {"id": invitation["org_id"]},
                "role": invitation["invited_role"],
            }

        except ValueError as e:
            logger.warning(f"Invitation acceptance failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to accept invitation: {e}", exc_info=True)
            raise

    def list_invitations(
        self,
        org_id: str,
        status: Optional[str] = None,
    ) -> list[dict]:
        """List invitations for an organization"""
        try:
            query = (
                self.client.table("archon_invitations")
                .select("*, archon_users_profile!archon_invitations_invited_by_fkey(display_name)")
                .eq("org_id", org_id)
            )

            if status:
                query = query.eq("status", status)

            query = query.order("created_at", desc=True)

            response = query.execute()

            # Auto-expire old invitations
            self._expire_old_invitations()

            return response.data or []

        except Exception as e:
            logger.error(f"Failed to list invitations: {e}", exc_info=True)
            raise

    def revoke_invitation(self, invitation_id: str, revoked_by: str) -> bool:
        """Revoke a pending invitation"""
        try:
            response = (
                self.client.table("archon_invitations")
                .update({"status": "revoked"})
                .eq("id", invitation_id)
                .eq("status", "pending")
                .execute()
            )

            if response.data:
                logger.info(f"Invitation revoked | id={invitation_id} | by={revoked_by}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to revoke invitation: {e}", exc_info=True)
            return False

    def _expire_old_invitations(self):
        """Helper to expire old pending invitations"""
        try:
            self.client.rpc("auto_expire_invitations").execute()
        except Exception as e:
            logger.warning(f"Failed to auto-expire invitations: {e}")

    def _send_invitation_email(self, invitation: dict):
        """Send invitation email using EmailService"""
        try:
            # Get organization name
            org_response = (
                self.client.table("archon_organizations")
                .select("name")
                .eq("id", invitation["org_id"])
                .execute()
            )
            org_name = org_response.data[0]["name"] if org_response.data else "10x PM"

            # Get inviter name
            inviter_response = (
                self.client.table("archon_users_profile")
                .select("display_name")
                .eq("id", invitation["invited_by"])
                .execute()
            )
            inviter_name = inviter_response.data[0]["display_name"] if inviter_response.data else "Team Admin"

            # Send email
            email_service = EmailService()
            success = email_service.send_invitation_email(
                to_email=invitation["email"],
                invite_link=invitation["invite_link"],
                inviter_name=inviter_name,
                role=invitation["invited_role"],
                org_name=org_name,
                personal_message=invitation.get("personal_message"),
            )

            if success:
                logger.info(f"Invitation email sent to {invitation['email']}")
            else:
                logger.warning(
                    f"Email not sent (check SMTP config) | Link: {invitation['invite_link']}"
                )

        except Exception as e:
            logger.error(f"Failed to send invitation email: {e}", exc_info=True)
