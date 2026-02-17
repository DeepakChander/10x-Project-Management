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

    Requires: Manager role or higher
    """
    try:
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
    perm: dict = Depends(require_role("manager")),
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


# ── Revoke Invitation ────────────────────────────────────────────

@router.delete("/{invitation_id}")
async def revoke_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_role("manager")),
) -> dict[str, str]:
    """
    Revoke a pending invitation.

    Requires: Manager role or higher
    """
    try:
        service = InvitationService()
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
