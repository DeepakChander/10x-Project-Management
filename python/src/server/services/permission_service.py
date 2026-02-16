"""
Permission Service - Layer 3 (Service Layer) of the 4-layer defense-in-depth.

Checks business rules and role permissions before allowing any action.
Uses the permission matrix seeded in the database.
"""

import logging
from typing import Any, Optional

from ..models.role_models import ROLE_FROM_NAME
from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class PermissionService:
    """
    Checks permissions against the archon_permissions matrix.

    Flow:
    1. Resolve user's effective role (MAX of org_role, project_role)
    2. Look up permission in the matrix for (role, resource, action)
    3. Check scope (own, team, project, org) against the request context
    4. Return allow/deny with reason
    """

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()
        self._permission_cache: dict[str, list[dict]] = {}

    def check_permission(
        self,
        user_id: str,
        project_id: str,
        resource: str,
        action: str,
        resource_owner_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Check if a user has permission to perform an action on a resource.

        Args:
            user_id: The user attempting the action
            project_id: The project context
            resource: The resource type (project, task, member, sprint, settings)
            action: The CRUD action (create, read, update, delete)
            resource_owner_id: The owner of the specific resource (for "own" scope checks)

        Returns:
            Dict with: allowed, user_id, resource, action, effective_role, reason
        """
        from .role_service import RoleService

        role_service = RoleService(self.client)
        role_info = role_service.get_effective_role(user_id, project_id)
        effective_role = role_info.get("effective_role")

        if not effective_role:
            return {
                "allowed": False,
                "user_id": user_id,
                "resource": resource,
                "action": action,
                "effective_role": None,
                "reason": "User has no role in this context",
            }

        # Look up permission in the matrix
        permission = self._get_permission(effective_role, resource, action)

        if not permission:
            return {
                "allowed": False,
                "user_id": user_id,
                "resource": resource,
                "action": action,
                "effective_role": effective_role,
                "reason": f"Role '{effective_role}' cannot '{action}' on '{resource}'",
            }

        # Check scope
        scope = permission.get("scope", "own")
        allowed = self._check_scope(scope, user_id, resource_owner_id)

        reason = ""
        if not allowed:
            reason = f"Scope '{scope}' restricts this action to own resources only"

        return {
            "allowed": allowed,
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "effective_role": effective_role,
            "reason": reason,
        }

    def check_permission_by_role(
        self,
        role: str,
        resource: str,
        action: str,
    ) -> bool:
        """Quick check: does this role have this permission at all?"""
        permission = self._get_permission(role, resource, action)
        return permission is not None

    def get_role_permissions(self, role: str) -> list[dict[str, Any]]:
        """Get all permissions for a specific role."""
        cache_key = f"role:{role}"
        if cache_key in self._permission_cache:
            return self._permission_cache[cache_key]

        response = (
            self.client.table("archon_permissions")
            .select("*")
            .eq("role", role)
            .execute()
        )
        permissions = response.data or []
        self._permission_cache[cache_key] = permissions
        return permissions

    def get_permission_matrix(self) -> list[dict[str, Any]]:
        """Get the complete permission matrix."""
        response = (
            self.client.table("archon_permissions")
            .select("*")
            .order("role")
            .order("resource")
            .order("action")
            .execute()
        )
        return response.data or []

    def can_user_manage_role(
        self,
        assigner_id: str,
        target_role: str,
        context_id: str,
        scope_type: str = "project",
    ) -> dict[str, Any]:
        """
        Check if a user can assign/modify a specific role.
        Rule: You can only assign roles BELOW your own level.
        """
        from .role_service import RoleService

        role_service = RoleService(self.client)
        can_assign = role_service.can_assign_role(assigner_id, target_role, context_id, scope_type)

        return {
            "allowed": can_assign,
            "assigner_id": assigner_id,
            "target_role": target_role,
            "reason": "" if can_assign else "Cannot assign a role equal to or above your own level",
        }

    def is_human_only_action(self, resource: str, action: str) -> bool:
        """Check if an action requires human approval (AI agents cannot perform it)."""
        human_only_actions = {
            ("project", "delete"),
            ("member", "create"),
            ("member", "update"),
            ("member", "delete"),
            ("settings", "update"),
        }
        return (resource, action) in human_only_actions

    def clear_cache(self) -> None:
        """Clear the permission cache (call after permission matrix changes)."""
        self._permission_cache.clear()

    # ── Internal ────────────────────────────────────────────

    def _get_permission(self, role: str, resource: str, action: str) -> Optional[dict[str, Any]]:
        """Look up a specific permission from the matrix."""
        cache_key = f"{role}:{resource}:{action}"
        if cache_key in self._permission_cache:
            cached = self._permission_cache[cache_key]
            return cached[0] if cached else None

        response = (
            self.client.table("archon_permissions")
            .select("*")
            .eq("role", role)
            .eq("resource", resource)
            .eq("action", action)
            .execute()
        )
        permissions = response.data or []
        self._permission_cache[cache_key] = permissions
        return permissions[0] if permissions else None

    def _check_scope(
        self,
        scope: str,
        user_id: str,
        resource_owner_id: Optional[str],
    ) -> bool:
        """Check if the user satisfies the scope constraint."""
        if scope in ("org", "project"):
            # Org/project scope = can access all resources in that context
            return True
        if scope == "own":
            # "own" scope = user must be the resource owner
            if resource_owner_id is None:
                # No owner specified = creating new resource, allow
                return True
            return user_id == resource_owner_id
        if scope == "team":
            # Team scope check would require team membership lookup
            # For now, allow (detailed team scoping is a Phase 2+ concern)
            return True
        return False
