"""
Roles & Permissions API endpoints for 10x PM

Handles:
- Role resolution (effective role for user in project context)
- Permission checking
- Permission matrix retrieval
- Project membership management
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_role
from ..models.role_models import (
    ProjectMembershipCreate,
    ProjectMembershipUpdate,
)
from ..services.permission_service import PermissionService
from ..services.role_service import RoleService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["roles"])


# ── Role Resolution ─────────────────────────────────────────────

@router.get("/roles/resolve")
async def resolve_role(
    project_id: str = Query(..., description="Project ID to resolve role for"),
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Resolve the effective role for the current user in a project.

    Returns org_role, project_role, and effective_role (the higher of the two).
    """
    return RoleService().get_effective_role(user_id, project_id)


@router.get("/roles/resolve/{target_user_id}")
async def resolve_role_for_user(
    target_user_id: str,
    project_id: str = Query(..., description="Project ID to resolve role for"),
    _auth: dict = Depends(require_role("manager")),
) -> dict[str, Any]:
    """
    Resolve the effective role for a specific user in a project (manager+ only).
    Useful for managers viewing team member roles.
    """
    return RoleService().get_effective_role(target_user_id, project_id)


# ── Permission Checks ──────────────────────────────────────────

@router.get("/permissions/check")
async def check_permission(
    resource: str = Query(..., description="Resource type (project, task, member, sprint, settings)"),
    action: str = Query(..., description="CRUD action (create, read, update, delete)"),
    project_id: str = Query(..., description="Project context"),
    resource_owner_id: Optional[str] = Query(None, description="Owner of the resource (for 'own' scope)"),
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Check if the current user has permission to perform an action.

    Used by the frontend to conditionally render UI elements (Layer 1).
    """
    return PermissionService().check_permission(
        user_id=user_id,
        project_id=project_id,
        resource=resource,
        action=action,
        resource_owner_id=resource_owner_id,
    )


@router.get("/permissions/matrix")
async def get_permission_matrix(
    _user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """Get the complete permission matrix (requires auth)."""
    return PermissionService().get_permission_matrix()


@router.get("/permissions/role/{role}")
async def get_role_permissions(role: str) -> list[dict[str, Any]]:
    """Get all permissions for a specific role."""
    return PermissionService().get_role_permissions(role)


# ── Project Memberships ─────────────────────────────────────────

@router.post("/projects/{project_id}/members")
async def add_project_member(
    project_id: str,
    data: ProjectMembershipCreate,
    current_user: str = Depends(get_current_user_id),
    _auth: dict = Depends(require_role("lead")),
) -> dict[str, Any]:
    """Add a user to a project with a role (lead+ only)."""
    service = RoleService()

    # Validate the assigner can assign this role
    if not service.can_assign_role(current_user, data.project_role, project_id, "project"):
        raise HTTPException(
            status_code=403,
            detail="Cannot assign a role equal to or above your own level",
        )

    data.project_id = project_id
    return service.add_project_member(data, assigned_by=current_user)


@router.get("/projects/{project_id}/members")
async def list_project_members(project_id: str) -> list[dict[str, Any]]:
    """List all members of a project."""
    return RoleService().list_project_members(project_id)


@router.put("/project-memberships/{membership_id}")
async def update_project_membership(
    membership_id: str,
    data: ProjectMembershipUpdate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Update a project membership role (lead+ only)."""
    # Look up project_id from the membership to verify role
    service = RoleService()
    response = service.client.table("archon_project_memberships").select("project_id").eq("id", membership_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Project membership not found")
    from ..models.role_models import ROLE_FROM_NAME
    role_info = service.get_effective_role(current_user, response.data[0]["project_id"])
    if role_info.get("effective_level", 0) < ROLE_FROM_NAME.get("lead", 0):
        raise HTTPException(status_code=403, detail="Lead+ role required")
    return service.update_project_membership(membership_id, data)


@router.delete("/projects/{project_id}/members/{user_id}")
async def remove_project_member(
    project_id: str,
    user_id: str,
    _auth: dict = Depends(require_role("manager")),
) -> dict[str, str]:
    """Remove a user from a project (manager+ only)."""
    if RoleService().remove_project_member(user_id, project_id):
        return {"status": "removed"}
    raise HTTPException(status_code=404, detail="Project membership not found")
