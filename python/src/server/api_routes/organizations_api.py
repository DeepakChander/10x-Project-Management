"""
Organizations API endpoints for 10x PM

Handles:
- Organization CRUD
- Department and team management
- Organization membership (invite, update role, deactivate)
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_role
from ..models.role_models import ROLE_FROM_NAME
from ..models.role_models import (
    DepartmentCreate,
    DepartmentUpdate,
    OrgMembershipCreate,
    OrgMembershipUpdate,
    OrganizationCreate,
    OrganizationUpdate,
    TeamCreate,
    TeamUpdate,
    UserProfileCreate,
    UserProfileUpdate,
)
from ..services.role_service import RoleService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["organizations"])


def _verify_org_role(user_id: str, org_id: str, min_role: str) -> dict:
    """Inline role check for routes where org_id isn't auto-extracted by middleware."""
    service = RoleService()
    membership = service.get_org_membership(user_id, org_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    effective_level = ROLE_FROM_NAME.get(membership["org_role"], 0)
    min_level = ROLE_FROM_NAME.get(min_role, 0)
    if effective_level < min_level:
        raise HTTPException(
            status_code=403,
            detail={"error": "Insufficient role level", "required_role": min_role, "effective_role": membership["org_role"]},
        )
    return {"user_id": user_id, "effective_role": membership["org_role"], "effective_level": int(effective_level)}


def _get_org_id_from_dept(dept_id: str) -> str:
    """Resolve org_id from a department."""
    service = RoleService()
    response = service.client.table("archon_departments").select("org_id").eq("id", dept_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return response.data[0]["org_id"]


def _get_org_id_from_team(team_id: str) -> str:
    """Resolve org_id from a team (via department)."""
    service = RoleService()
    response = service.client.table("archon_teams").select("department_id").eq("id", team_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Team not found")
    return _get_org_id_from_dept(response.data[0]["department_id"])


# ── Memberships (current user) ──────────────────────────────────

@router.get("/memberships")
async def get_user_membership(user_id: str = Query(...)) -> dict[str, Any]:
    """Return the active org membership for a user (role, org_id)."""
    service = RoleService()
    response = (
        service.client.table("archon_org_memberships")
        .select("org_id, org_role")
        .eq("user_id", user_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not response.data:
        return {"org_id": None, "org_role": None}
    return response.data[0]


# ── User Profile ────────────────────────────────────────────────

@router.post("/users")
async def create_user(data: UserProfileCreate) -> dict[str, Any]:
    """Create a new user profile."""
    service = RoleService()
    existing = service.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=409, detail="User with this email already exists")
    return service.create_user_profile(data)


@router.get("/users/{user_id}")
async def get_user(user_id: str) -> dict[str, Any]:
    """Get a user profile by ID."""
    service = RoleService()
    user = service.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: UserProfileUpdate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Update a user profile."""
    return RoleService().update_user_profile(user_id, data)


# ── Organizations ───────────────────────────────────────────────

@router.post("/organizations")
async def create_organization(
    data: OrganizationCreate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Create a new organization. Creator becomes the owner."""
    service = RoleService()

    # Check slug uniqueness
    existing = service.get_organization_by_slug(data.slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"Organization slug '{data.slug}' already taken")

    return service.create_organization(data, owner_id=current_user)


@router.get("/organizations")
async def list_organizations() -> list[dict[str, Any]]:
    """List all organizations."""
    return RoleService().list_organizations()


@router.get("/organizations/{org_id}")
async def get_organization(org_id: str) -> dict[str, Any]:
    """Get an organization by ID."""
    org = RoleService().get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.put("/organizations/{org_id}")
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    _auth: dict = Depends(require_role("admin")),
) -> dict[str, Any]:
    """Update an organization (admin+ only)."""
    return RoleService().update_organization(org_id, data)


@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: str,
    _auth: dict = Depends(require_role("owner")),
) -> dict[str, str]:
    """Delete an organization (owner only)."""
    if RoleService().delete_organization(org_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Organization not found")


# ── Departments ─────────────────────────────────────────────────

@router.post("/organizations/{org_id}/departments")
async def create_department(
    org_id: str,
    data: DepartmentCreate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Create a department within an organization (admin+ only)."""
    _verify_org_role(current_user, org_id, "admin")
    data.org_id = org_id
    return RoleService().create_department(data)


@router.get("/organizations/{org_id}/departments")
async def list_departments(org_id: str) -> list[dict[str, Any]]:
    """List departments for an organization."""
    return RoleService().list_departments(org_id)


@router.put("/departments/{dept_id}")
async def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Update a department (admin+ only)."""
    org_id = _get_org_id_from_dept(dept_id)
    _verify_org_role(current_user, org_id, "admin")
    return RoleService().update_department(dept_id, data)


@router.delete("/departments/{dept_id}")
async def delete_department(
    dept_id: str,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """Delete a department (admin+ only)."""
    org_id = _get_org_id_from_dept(dept_id)
    _verify_org_role(current_user, org_id, "admin")
    if RoleService().delete_department(dept_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Department not found")


# ── Teams ───────────────────────────────────────────────────────

@router.post("/departments/{dept_id}/teams")
async def create_team(
    dept_id: str,
    data: TeamCreate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Create a team within a department (admin+ only)."""
    org_id = _get_org_id_from_dept(dept_id)
    _verify_org_role(current_user, org_id, "admin")
    data.department_id = dept_id
    return RoleService().create_team(data)


@router.get("/departments/{dept_id}/teams")
async def list_teams(dept_id: str) -> list[dict[str, Any]]:
    """List teams for a department."""
    return RoleService().list_teams(dept_id)


@router.put("/teams/{team_id}")
async def update_team(
    team_id: str,
    data: TeamUpdate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Update a team (manager+ only)."""
    org_id = _get_org_id_from_team(team_id)
    _verify_org_role(current_user, org_id, "manager")
    return RoleService().update_team(team_id, data)


@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: str,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """Delete a team (admin+ only)."""
    org_id = _get_org_id_from_team(team_id)
    _verify_org_role(current_user, org_id, "admin")
    if RoleService().delete_team(team_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Team not found")


# ── Organization Memberships ────────────────────────────────────

@router.post("/organizations/{org_id}/members")
async def add_org_member(
    org_id: str,
    data: OrgMembershipCreate,
    current_user: str = Depends(get_current_user_id),
    _auth: dict = Depends(require_role("manager")),
) -> dict[str, Any]:
    """Add a user to an organization (manager+ only)."""
    service = RoleService()

    # Validate the assigner can assign this role
    if not service.can_assign_role(current_user, data.org_role, org_id, "org"):
        raise HTTPException(
            status_code=403,
            detail="Cannot assign a role equal to or above your own level",
        )

    data.org_id = org_id
    return service.add_org_member(data, invited_by=current_user)


@router.get("/organizations/{org_id}/members")
async def list_org_members(org_id: str) -> list[dict[str, Any]]:
    """List members of an organization."""
    return RoleService().list_org_members(org_id)


@router.put("/org-memberships/{membership_id}")
async def update_org_membership(
    membership_id: str,
    data: OrgMembershipUpdate,
    current_user: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Update an organization membership (manager+ only)."""
    # Look up org_id from the membership
    service = RoleService()
    response = service.client.table("archon_org_memberships").select("org_id").eq("id", membership_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Membership not found")
    _verify_org_role(current_user, response.data[0]["org_id"], "manager")
    return service.update_org_membership(membership_id, data)


@router.delete("/organizations/{org_id}/members/{user_id}")
async def remove_org_member(
    org_id: str,
    user_id: str,
    _auth: dict = Depends(require_role("admin")),
) -> dict[str, str]:
    """Deactivate an organization member (admin+ only)."""
    if RoleService().remove_org_member(user_id, org_id):
        return {"status": "deactivated"}
    raise HTTPException(status_code=404, detail="Membership not found")
