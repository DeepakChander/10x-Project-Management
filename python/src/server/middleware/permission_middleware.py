"""
Permission Middleware - Layer 2 (API Layer) of the 4-layer defense-in-depth.

Provides FastAPI dependency injection for permission checking on routes.
Each protected endpoint declares what resource + action it requires,
and this middleware resolves the user's effective role and checks permissions.
"""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, Header, Request

from ..services.permission_service import PermissionService
from ..services.role_service import RoleService

logger = logging.getLogger(__name__)


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
) -> str:
    """
    Extract and validate the current user ID from request headers.

    Requires X-User-Id. When X-Session-Token is also provided, validates
    it against active sessions in the database to prevent session forgery.
    Agent and internal calls that omit X-Session-Token are allowed through
    with only the user ID check.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide X-User-Id header.",
        )

    if x_session_token:
        try:
            from ..utils import get_supabase_client
            client = get_supabase_client()
            session_resp = (
                client.table("archon_user_sessions")
                .select("user_id")
                .eq("session_token", x_session_token)
                .execute()
            )
            if not session_resp.data:
                raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
            if session_resp.data[0]["user_id"] != x_user_id:
                raise HTTPException(status_code=401, detail="Session token does not match user.")
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Session validation error (non-blocking): {e}")

    return x_user_id


def _extract_param(request: Request, name: str) -> Optional[str]:
    """Extract a parameter from path params first, then query params."""
    value = request.path_params.get(name)
    if value:
        return value
    return request.query_params.get(name)


def require_permission(resource: str, action: str):
    """
    FastAPI dependency factory that checks permissions.

    Usage:
        @router.delete("/tasks/{task_id}", dependencies=[Depends(require_permission("task", "delete"))])
        async def delete_task(task_id: str): ...

    Or inject the result:
        @router.put("/tasks/{task_id}")
        async def update_task(task_id: str, perm=Depends(require_permission("task", "update"))): ...
    """

    async def _check(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> dict:
        project_id = _extract_param(request, "project_id")

        if not project_id:
            raise HTTPException(
                status_code=400,
                detail="project_id is required for permission checks (path or query parameter)",
            )

        permission_service = PermissionService()
        result = permission_service.check_permission(
            user_id=user_id,
            project_id=project_id,
            resource=resource,
            action=action,
        )

        if not result["allowed"]:
            logger.warning(
                f"Permission denied: user={user_id} resource={resource} "
                f"action={action} project={project_id} reason={result['reason']}"
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Permission denied",
                    "resource": resource,
                    "action": action,
                    "reason": result["reason"],
                    "effective_role": result.get("effective_role"),
                },
            )

        return result

    return _check


def require_role(min_role: str):
    """
    FastAPI dependency factory that requires a minimum role level.

    Extracts org_id and project_id from path params or query params
    to avoid conflicts with FastAPI's path parameter declarations.

    Usage:
        @router.post("/org/settings", dependencies=[Depends(require_role("admin"))])
        async def update_org_settings(): ...
    """
    from ..models.role_models import ROLE_FROM_NAME

    async def _check(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> dict:
        project_id = _extract_param(request, "project_id")
        org_id = _extract_param(request, "org_id")

        role_service = RoleService()

        if project_id:
            role_info = role_service.get_effective_role(user_id, project_id)
            effective_level = role_info.get("effective_level", 0)
            effective_role = role_info.get("effective_role")
        elif org_id:
            membership = role_service.get_org_membership(user_id, org_id)
            if not membership:
                raise HTTPException(status_code=403, detail="Not a member of this organization")
            effective_role = membership["org_role"]
            effective_level = ROLE_FROM_NAME.get(effective_role, 0)
        else:
            raise HTTPException(
                status_code=400,
                detail="project_id or org_id is required (path or query parameter)",
            )

        min_level = ROLE_FROM_NAME.get(min_role, 0)
        if effective_level < min_level:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Insufficient role level",
                    "required_role": min_role,
                    "effective_role": effective_role,
                    "required_level": int(min_level),
                    "effective_level": int(effective_level),
                },
            )

        return {"user_id": user_id, "effective_role": effective_role, "effective_level": int(effective_level)}

    return _check


def require_human_only(resource: str, action: str):
    """
    Dependency that blocks AI agents from performing human-only actions.
    Combines with require_permission for full checking.
    """

    async def _check(
        user_id: str = Depends(get_current_user_id),
    ) -> None:
        role_service = RoleService()
        user_profile = role_service.get_user_profile(user_id)

        if not user_profile:
            raise HTTPException(status_code=404, detail="User not found")

        if user_profile.get("user_type") == "agent":
            permission_service = PermissionService()
            if permission_service.is_human_only_action(resource, action):
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Human approval required",
                        "resource": resource,
                        "action": action,
                        "reason": "AI agents cannot perform this action - human approval is required",
                    },
                )

    return _check


def require_task_permission(action: str):
    """
    FastAPI dependency factory that checks task permissions by fetching the task first.

    This is used for endpoints like /tasks/{task_id} where project_id is not in the path.
    It fetches the task to get the project_id, then checks permissions.

    Usage:
        @router.put("/tasks/{task_id}")
        async def update_task(task_id: str, perm=Depends(require_task_permission("update"))): ...
    """

    async def _check(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> dict:
        # Extract task_id from path params
        task_id = _extract_param(request, "task_id")
        if not task_id:
            raise HTTPException(
                status_code=400,
                detail="task_id is required in path",
            )

        # Fetch the task to get its project_id
        from ..utils import get_supabase_client
        client = get_supabase_client()

        try:
            response = client.table("archon_tasks").select("project_id").eq("id", task_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Task not found")

            project_id = response.data[0]["project_id"]
        except Exception as e:
            logger.error(f"Failed to fetch task {task_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch task")

        # Now check permissions using the project_id
        permission_service = PermissionService()
        result = permission_service.check_permission(
            user_id=user_id,
            project_id=project_id,
            resource="task",
            action=action,
        )

        if not result["allowed"]:
            logger.warning(
                f"Permission denied: user={user_id} resource=task "
                f"action={action} project={project_id} task={task_id} reason={result['reason']}"
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Permission denied",
                    "resource": "task",
                    "action": action,
                    "reason": result["reason"],
                    "effective_role": result.get("effective_role"),
                },
            )

        return result

    return _check


def require_sprint_permission(action: str):
    """
    FastAPI dependency factory that checks sprint permissions by fetching the sprint first.

    This is used for endpoints like /sprints/{sprint_id} where project_id is not in the path.
    It fetches the sprint to get the project_id, then checks permissions.

    Usage:
        @router.put("/sprints/{sprint_id}")
        async def update_sprint(sprint_id: str, perm=Depends(require_sprint_permission("update"))): ...
    """

    async def _check(
        request: Request,
        user_id: str = Depends(get_current_user_id),
    ) -> dict:
        # Extract sprint_id from path params
        sprint_id = _extract_param(request, "sprint_id")
        if not sprint_id:
            raise HTTPException(
                status_code=400,
                detail="sprint_id is required in path",
            )

        # Fetch the sprint to get its project_id
        from ..utils import get_supabase_client
        client = get_supabase_client()

        try:
            response = client.table("archon_sprints").select("project_id").eq("id", sprint_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Sprint not found")

            project_id = response.data[0]["project_id"]
        except Exception as e:
            logger.error(f"Failed to fetch sprint {sprint_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch sprint")

        # Now check permissions using the project_id
        permission_service = PermissionService()
        result = permission_service.check_permission(
            user_id=user_id,
            project_id=project_id,
            resource="sprint",
            action=action,
        )

        if not result["allowed"]:
            logger.warning(
                f"Permission denied: user={user_id} resource=sprint "
                f"action={action} project={project_id} sprint={sprint_id} reason={result['reason']}"
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Permission denied",
                    "resource": "sprint",
                    "action": action,
                    "reason": result["reason"],
                    "effective_role": result.get("effective_role"),
                },
            )

        return result

    return _check
