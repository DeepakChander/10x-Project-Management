"""
Role Service - Handles role resolution, organization management, and membership CRUD.

Implements the 7-level role hierarchy with dual scoping (org + project).
Effective role = MAX(org_role, project_role).
"""

import logging
from datetime import datetime
from typing import Any, Optional

from ..models.role_models import (
    ROLE_FROM_NAME,
    DepartmentCreate,
    DepartmentUpdate,
    OrgMembershipCreate,
    OrgMembershipUpdate,
    OrganizationCreate,
    OrganizationUpdate,
    ProjectMembershipCreate,
    ProjectMembershipUpdate,
    TeamCreate,
    TeamUpdate,
    UserProfileCreate,
    UserProfileUpdate,
)
from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class RoleService:
    """Service for managing roles, organizations, and memberships."""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    # ── User Profile ────────────────────────────────────────

    def create_user_profile(self, data: UserProfileCreate) -> dict[str, Any]:
        """Create a new user profile."""
        response = self.client.table("archon_users_profile").insert({
            "email": data.email,
            "display_name": data.display_name,
            "avatar_url": data.avatar_url,
            "user_type": data.user_type,
        }).execute()
        if not response.data:
            raise ValueError("Failed to create user profile")
        return response.data[0]

    def get_user_profile(self, user_id: str) -> Optional[dict[str, Any]]:
        """Get a user profile by ID."""
        response = self.client.table("archon_users_profile").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None

    def get_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        """Get a user profile by email."""
        response = self.client.table("archon_users_profile").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    def update_user_profile(self, user_id: str, data: UserProfileUpdate) -> dict[str, Any]:
        """Update a user profile."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = self.client.table("archon_users_profile").update(update_data).eq("id", user_id).execute()
        if not response.data:
            raise ValueError(f"User profile {user_id} not found")
        return response.data[0]

    def list_users(self, org_id: Optional[str] = None) -> list[dict[str, Any]]:
        """List user profiles, optionally filtered by organization."""
        if org_id:
            response = (
                self.client.table("archon_org_memberships")
                .select("user_id, org_role, status, archon_users_profile!archon_org_memberships_user_id_fkey(*)")
                .eq("org_id", org_id)
                .eq("status", "active")
                .execute()
            )
            return response.data or []
        response = self.client.table("archon_users_profile").select("*").execute()
        return response.data or []

    # ── Organizations ───────────────────────────────────────

    def create_organization(self, data: OrganizationCreate, owner_id: str) -> dict[str, Any]:
        """Create a new organization and set the creator as owner."""
        response = self.client.table("archon_organizations").insert({
            "name": data.name,
            "slug": data.slug,
            "owner_id": owner_id,
        }).execute()
        if not response.data:
            raise ValueError("Failed to create organization")
        org = response.data[0]

        # Auto-create org membership for the owner
        self.client.table("archon_org_memberships").insert({
            "user_id": owner_id,
            "org_id": org["id"],
            "org_role": "owner",
            "status": "active",
            "joined_at": datetime.now().isoformat(),
        }).execute()

        # Log role assignment
        self._log_role_assignment(owner_id, "owner", "org", org["id"], assigned_by=owner_id)

        return org

    def get_organization(self, org_id: str) -> Optional[dict[str, Any]]:
        """Get an organization by ID."""
        response = self.client.table("archon_organizations").select("*").eq("id", org_id).execute()
        return response.data[0] if response.data else None

    def get_organization_by_slug(self, slug: str) -> Optional[dict[str, Any]]:
        """Get an organization by slug."""
        response = self.client.table("archon_organizations").select("*").eq("slug", slug).execute()
        return response.data[0] if response.data else None

    def list_organizations(self) -> list[dict[str, Any]]:
        """List all organizations."""
        response = self.client.table("archon_organizations").select("*").order("created_at").execute()
        return response.data or []

    def update_organization(self, org_id: str, data: OrganizationUpdate) -> dict[str, Any]:
        """Update an organization."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = self.client.table("archon_organizations").update(update_data).eq("id", org_id).execute()
        if not response.data:
            raise ValueError(f"Organization {org_id} not found")
        return response.data[0]

    def delete_organization(self, org_id: str) -> bool:
        """Delete an organization (cascades to departments, teams, memberships)."""
        response = self.client.table("archon_organizations").delete().eq("id", org_id).execute()
        return bool(response.data)

    # ── Departments ─────────────────────────────────────────

    def create_department(self, data: DepartmentCreate) -> dict[str, Any]:
        """Create a new department within an organization."""
        response = self.client.table("archon_departments").insert({
            "org_id": data.org_id,
            "name": data.name,
        }).execute()
        if not response.data:
            raise ValueError("Failed to create department")
        return response.data[0]

    def list_departments(self, org_id: str) -> list[dict[str, Any]]:
        """List departments for an organization."""
        response = (
            self.client.table("archon_departments")
            .select("*")
            .eq("org_id", org_id)
            .order("name")
            .execute()
        )
        return response.data or []

    def update_department(self, dept_id: str, data: DepartmentUpdate) -> dict[str, Any]:
        """Update a department."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = self.client.table("archon_departments").update(update_data).eq("id", dept_id).execute()
        if not response.data:
            raise ValueError(f"Department {dept_id} not found")
        return response.data[0]

    def delete_department(self, dept_id: str) -> bool:
        """Delete a department."""
        response = self.client.table("archon_departments").delete().eq("id", dept_id).execute()
        return bool(response.data)

    # ── Teams ───────────────────────────────────────────────

    def create_team(self, data: TeamCreate) -> dict[str, Any]:
        """Create a new team within a department."""
        response = self.client.table("archon_teams").insert({
            "department_id": data.department_id,
            "name": data.name,
        }).execute()
        if not response.data:
            raise ValueError("Failed to create team")
        return response.data[0]

    def list_teams(self, department_id: str) -> list[dict[str, Any]]:
        """List teams for a department."""
        response = (
            self.client.table("archon_teams")
            .select("*")
            .eq("department_id", department_id)
            .order("name")
            .execute()
        )
        return response.data or []

    def update_team(self, team_id: str, data: TeamUpdate) -> dict[str, Any]:
        """Update a team."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = self.client.table("archon_teams").update(update_data).eq("id", team_id).execute()
        if not response.data:
            raise ValueError(f"Team {team_id} not found")
        return response.data[0]

    def delete_team(self, team_id: str) -> bool:
        """Delete a team."""
        response = self.client.table("archon_teams").delete().eq("id", team_id).execute()
        return bool(response.data)

    # ── Organization Memberships ────────────────────────────

    def add_org_member(self, data: OrgMembershipCreate, invited_by: Optional[str] = None) -> dict[str, Any]:
        """Add a user to an organization with a specified role."""
        insert_data = {
            "user_id": data.user_id,
            "org_id": data.org_id,
            "org_role": data.org_role,
            "department_id": data.department_id,
            "team_id": data.team_id,
            "status": "invited",
        }
        if invited_by:
            insert_data["invited_by"] = invited_by
        response = self.client.table("archon_org_memberships").insert(insert_data).execute()
        if not response.data:
            raise ValueError("Failed to add organization member")

        self._log_role_assignment(data.user_id, data.org_role, "org", data.org_id, assigned_by=invited_by)
        return response.data[0]

    def update_org_membership(self, membership_id: str, data: OrgMembershipUpdate) -> dict[str, Any]:
        """Update an organization membership."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = (
            self.client.table("archon_org_memberships")
            .update(update_data)
            .eq("id", membership_id)
            .execute()
        )
        if not response.data:
            raise ValueError(f"Membership {membership_id} not found")
        return response.data[0]

    def get_org_membership(self, user_id: str, org_id: str) -> Optional[dict[str, Any]]:
        """Get a user's membership in a specific organization."""
        response = (
            self.client.table("archon_org_memberships")
            .select("*")
            .eq("user_id", user_id)
            .eq("org_id", org_id)
            .execute()
        )
        return response.data[0] if response.data else None

    def list_org_members(self, org_id: str) -> list[dict[str, Any]]:
        """List all members of an organization."""
        response = (
            self.client.table("archon_org_memberships")
            .select("*, archon_users_profile!archon_org_memberships_user_id_fkey(*)")
            .eq("org_id", org_id)
            .neq("status", "deactivated")
            .order("org_role")
            .execute()
        )
        return response.data or []

    def remove_org_member(self, user_id: str, org_id: str) -> bool:
        """Deactivate a user's organization membership."""
        response = (
            self.client.table("archon_org_memberships")
            .update({"status": "deactivated"})
            .eq("user_id", user_id)
            .eq("org_id", org_id)
            .execute()
        )
        return bool(response.data)

    # ── Project Memberships ─────────────────────────────────

    def add_project_member(
        self, data: ProjectMembershipCreate, assigned_by: Optional[str] = None
    ) -> dict[str, Any]:
        """Add a user to a project with a specified role."""
        insert_data = {
            "user_id": data.user_id,
            "project_id": data.project_id,
            "project_role": data.project_role,
        }
        if assigned_by:
            insert_data["assigned_by"] = assigned_by
        response = self.client.table("archon_project_memberships").insert(insert_data).execute()
        if not response.data:
            raise ValueError("Failed to add project member")

        self._log_role_assignment(
            data.user_id, data.project_role, "project", data.project_id, assigned_by=assigned_by
        )
        return response.data[0]

    def update_project_membership(self, membership_id: str, data: ProjectMembershipUpdate) -> dict[str, Any]:
        """Update a project membership."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValueError("No fields to update")
        response = (
            self.client.table("archon_project_memberships")
            .update(update_data)
            .eq("id", membership_id)
            .execute()
        )
        if not response.data:
            raise ValueError(f"Project membership {membership_id} not found")
        return response.data[0]

    def get_project_membership(self, user_id: str, project_id: str) -> Optional[dict[str, Any]]:
        """Get a user's membership in a specific project."""
        response = (
            self.client.table("archon_project_memberships")
            .select("*")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .execute()
        )
        return response.data[0] if response.data else None

    def list_project_members(self, project_id: str) -> list[dict[str, Any]]:
        """List all members of a project."""
        response = (
            self.client.table("archon_project_memberships")
            .select("*, archon_users_profile!archon_project_memberships_user_id_fkey(*)")
            .eq("project_id", project_id)
            .order("project_role")
            .execute()
        )
        return response.data or []

    def remove_project_member(self, user_id: str, project_id: str) -> bool:
        """Remove a user from a project."""
        response = (
            self.client.table("archon_project_memberships")
            .delete()
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .execute()
        )
        return bool(response.data)

    # ── Role Resolution ─────────────────────────────────────

    def get_effective_role(self, user_id: str, project_id: str) -> dict[str, Any]:
        """
        Resolve the effective role for a user in a project context.
        Effective role = MAX(org_role, project_role).
        """
        # Get org role (highest across all orgs the user belongs to)
        org_response = (
            self.client.table("archon_org_memberships")
            .select("org_role")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
        )

        org_role = None
        org_level = 0
        for membership in (org_response.data or []):
            level = ROLE_FROM_NAME.get(membership["org_role"], 0)
            if level > org_level:
                org_level = level
                org_role = membership["org_role"]

        # Get project-specific role
        proj_response = (
            self.client.table("archon_project_memberships")
            .select("project_role")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .execute()
        )

        project_role = None
        project_level = 0
        if proj_response.data:
            project_role = proj_response.data[0]["project_role"]
            project_level = ROLE_FROM_NAME.get(project_role, 0)

        # Effective = higher of the two
        if org_level >= project_level:
            effective_role = org_role
            effective_level = org_level
        else:
            effective_role = project_role
            effective_level = project_level

        return {
            "user_id": user_id,
            "org_role": org_role,
            "project_role": project_role,
            "effective_role": effective_role,
            "effective_level": int(effective_level),
        }

    # ── Role Assignment Validation ──────────────────────────

    def can_assign_role(self, assigner_id: str, target_role: str, context_id: str, scope_type: str = "project") -> bool:
        """
        Check if the assigner has authority to assign a specific role.
        Rule: You can only assign roles BELOW your own level.
        """
        if scope_type == "project":
            role_info = self.get_effective_role(assigner_id, context_id)
        else:
            org_membership = self.get_org_membership(assigner_id, context_id)
            if not org_membership:
                return False
            role_info = {
                "effective_level": ROLE_FROM_NAME.get(org_membership["org_role"], 0)
            }

        assigner_level = role_info.get("effective_level", 0)
        target_level = ROLE_FROM_NAME.get(target_role, 0)

        return assigner_level > target_level

    # ── Internal Helpers ────────────────────────────────────

    def _log_role_assignment(
        self,
        user_id: str,
        role: str,
        scope_type: str,
        scope_id: str,
        assigned_by: Optional[str] = None,
    ) -> None:
        """Record a role assignment in the audit trail."""
        try:
            self.client.table("archon_role_assignments").insert({
                "user_id": user_id,
                "role": role,
                "scope_type": scope_type,
                "scope_id": scope_id,
                "assigned_by": assigned_by,
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log role assignment: {e}")
