"""
Invitations API

Handles:
- Creating invitations
- Listing invitations
- Accepting invitations
- Revoking invitations
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_role
from ..services.invitation_service import InvitationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/invitations", tags=["invitations"])


class CreateInvitationRequest(BaseModel):
    email: str
    role: str
    team_id: str | None = None
    department_id: str | None = None
    personal_message: str | None = None


class AcceptInvitationRequest(BaseModel):
    display_name: str
    password: str | None = None


# ── SPECIFIC ROUTES FIRST (to avoid collision with generic routes) ──

# ── Get Invitation by Token ──────────────────────────────────────

@router.get("/token/{token}")
async def get_invitation(token: str) -> dict[str, Any]:
    """
    Get invitation details by token (for acceptance page).

    No authentication required (public endpoint for new users).
    """
    try:
        service = InvitationService()
        invitation = service.get_invitation_by_token(token)

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found or expired")

        # Return safe subset (don't expose internal IDs)
        return {
            "email": invitation["email"],
            "role": invitation["invited_role"],
            "org_id": invitation["org_id"],
            "expires_at": invitation["expires_at"],
            "personal_message": invitation.get("personal_message"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get invitation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Accept Invitation ────────────────────────────────────────────

@router.post("/accept/{token}")
async def accept_invitation(
    token: str,
    request: AcceptInvitationRequest,
) -> dict[str, Any]:
    """
    Accept an invitation and create user account.

    No authentication required (public endpoint for new users).
    """
    try:
        service = InvitationService()
        result = service.accept_invitation(
            token=token,
            display_name=request.display_name,
            password=request.password,  # Password will be hashed in service
        )

        return {
            "message": "Invitation accepted successfully",
            "user": result["user"],
            "organization": result["organization"],
            "role": result["role"],
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to accept invitation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── GENERIC ROUTES (must come after specific routes) ────────────

# ── Create Invitation ────────────────────────────────────────────

@router.post("/{org_id}")
async def create_invitation(
    org_id: str,
    request: CreateInvitationRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_role("manager")),
) -> dict[str, Any]:
    """
    Create a new invitation.

    Requires: Manager role or higher, and email must be verified.
    """
    try:
        # Require email verification before sending invitations
        from ..utils import get_supabase_client
        client = get_supabase_client()
        user_row = client.table("archon_users_profile").select("email_verified").eq("id", user_id).execute()
        if user_row.data and not user_row.data[0].get("email_verified"):
            raise HTTPException(status_code=403, detail="Verify your email before inviting team members")

        service = InvitationService()
        invitation = service.create_invitation(
            org_id=org_id,
            email=request.email,
            role=request.role,
            invited_by=user_id,
            team_id=request.team_id,
            department_id=request.department_id,
            personal_message=request.personal_message,
        )

        return {
            "message": "Invitation created successfully",
            "invitation": invitation,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create invitation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── List Invitations ─────────────────────────────────────────────

@router.get("/{org_id}")
async def list_invitations(
    org_id: str,
    status: str | None = None,
    perm: dict = Depends(require_role("member")),
) -> list[dict[str, Any]]:
    """
    List invitations for an organization.

    Requires: Manager role or higher
    """
    try:
        service = InvitationService()
        invitations = service.list_invitations(org_id, status=status)
        return invitations

    except Exception as e:
        logger.error(f"Failed to list invitations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Revoke Invitation ────────────────────────────────────────────

@router.delete("/{invitation_id}")
async def revoke_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """
    Revoke a pending invitation.

    Requires: Member role or higher in the organization
    """
    try:
        service = InvitationService()

        # Fetch invitation to get org_id for permission check
        invitation = service.get_invitation_by_id(invitation_id)

        if not invitation:
            raise HTTPException(
                status_code=404,
                detail="Invitation not found",
            )

        # Check if user has member role in the organization
        from ..services.role_service import RoleService
        role_service = RoleService()

        try:
            org_id = invitation["org_id"]
            effective_role = role_service.get_effective_role(user_id, org_id=org_id)

            # Check if user has at least member role
            role_levels = {"owner": 4, "manager": 3, "member": 2, "viewer": 1}
            user_level = role_levels.get(effective_role, 0)
            required_level = role_levels.get("member", 2)

            if user_level < required_level:
                raise HTTPException(
                    status_code=403,
                    detail=f"Requires member role or higher. Current role: {effective_role}",
                )
        except Exception as e:
            logger.error(f"Permission check failed: {e}")
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to revoke invitation",
            )

        # Now revoke the invitation
        success = service.revoke_invitation(invitation_id, revoked_by=user_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Invitation not found or already accepted/expired",
            )

        return {"message": "Invitation revoked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke invitation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
