"""
Admin Dashboard API

Provides real-time stats and data for admin dashboard
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from ..middleware.permission_middleware import get_current_user_id, require_role
from ..utils import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_role("admin")),
):
    """Get admin dashboard statistics. Requires: Admin role."""
    try:
        client = get_supabase_client()

        # Get user's org
        org_response = client.table("archon_org_memberships").select("org_id").eq("user_id", user_id).execute()
        if not org_response.data:
            raise HTTPException(status_code=404, detail="User not in any organization")

        org_id = org_response.data[0]["org_id"]

        # Get user's project IDs (for org-scoped project and task counts)
        project_memberships = client.table("archon_project_memberships").select("project_id").eq("user_id", user_id).execute()
        user_project_ids = [pm["project_id"] for pm in (project_memberships.data or [])]

        # Get stats (org-scoped)
        members_response = client.table("archon_org_memberships").select("*").eq("org_id", org_id).eq("status", "active").execute()

        # Projects: filter by user's project memberships
        if user_project_ids:
            projects_response = client.table("archon_projects").select("id").in_("id", user_project_ids).execute()
            # Tasks: filter by projects user has access to
            tasks_response = client.table("archon_tasks").select("id, status").in_("project_id", user_project_ids).execute()
        else:
            projects_response = client.table("archon_projects").select("id").execute()  # Return empty
            projects_response.data = []
            tasks_response = client.table("archon_tasks").select("id, status").execute()
            tasks_response.data = []

        sprints_response = client.table("archon_sprints").select("id, status").execute()
        invitations_response = client.table("archon_invitations").select("id").eq("org_id", org_id).eq("status", "pending").execute()

        members = members_response.data or []
        projects = projects_response.data or []
        tasks = tasks_response.data or []
        sprints = sprints_response.data or []
        invitations = invitations_response.data or []

        # Calculate role breakdown
        role_counts = {}
        for member in members:
            role = member.get("org_role", "member")
            role_counts[role] = role_counts.get(role, 0) + 1

        # Calculate task breakdown
        task_counts = {"backlog": 0, "todo": 0, "doing": 0, "review": 0, "done": 0}
        for task in tasks:
            status = task.get("status", "backlog")
            if status in task_counts:
                task_counts[status] += 1
            else:
                # Unknown status, count as backlog
                task_counts["backlog"] += 1

        return {
            "members": {
                "total": len(members),
                "by_role": role_counts,
            },
            "projects": {
                "total": len(projects),
            },
            "tasks": {
                "total": len(tasks),
                "by_status": task_counts,
            },
            "sprints": {
                "total": len(sprints),
                "active": len([s for s in sprints if s.get("status") == "active"]),
            },
            "pending_invitations": len(invitations),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team/members")
async def get_team_members(
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_role("admin")),
):
    """Get all team members for organization. Requires: Admin role."""
    try:
        client = get_supabase_client()

        # Get user's org
        org_response = client.table("archon_org_memberships").select("org_id").eq("user_id", user_id).execute()
        if not org_response.data:
            raise HTTPException(status_code=404, detail="User not in any organization")

        org_id = org_response.data[0]["org_id"]

        # Get all members
        members_response = client.table("archon_org_memberships").select(
            "*, archon_users_profile!archon_org_memberships_user_id_fkey(*)"
        ).eq("org_id", org_id).execute()

        return members_response.data or []

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get team members: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
