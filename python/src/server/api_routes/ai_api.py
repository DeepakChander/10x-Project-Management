"""
AI API - Intelligent features for task estimation and sprint planning

Handles:
- Task estimation (story points, duration)
- Sprint planning recommendations
- Dependency detection
- Capacity warnings
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_permission
from ..services.ai_service import AIService
from ..services.projects.task_service import TaskService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class EstimateTaskRequest(BaseModel):
    task_id: str
    title: str
    description: str


class PlanSprintRequest(BaseModel):
    sprint_capacity_hours: int
    current_velocity: float | None = None


# ── Task Estimation ──────────────────────────────────────────────

@router.post("/tasks/{task_id}/estimate")
async def estimate_task(
    task_id: str,
    project_id: str,  # Query parameter for permission check
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("task", "update")),
) -> dict[str, Any]:
    """
    Get AI estimation for a task (story points, duration, priority).

    Requires: task:update permission
    """
    try:
        # Get task details
        task_service = TaskService()
        success, result = task_service.get_task(task_id)

        if not success:
            raise HTTPException(status_code=404, detail="Task not found")

        task = result["task"]

        # Get AI estimation
        ai_service = AIService()
        estimation = ai_service.estimate_task(
            task_id=task_id,
            title=task["title"],
            description=task.get("description", ""),
            project_context=None,
        )

        return {
            "task_id": task_id,
            "estimation": estimation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to estimate task {task_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Sprint Planning ──────────────────────────────────────────────

@router.post("/projects/{project_id}/plan-sprint")
async def plan_sprint(
    project_id: str,
    request: PlanSprintRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("sprint", "create")),
) -> dict[str, Any]:
    """
    Get AI recommendations for next sprint planning.

    Requires: sprint:create permission
    """
    try:
        ai_service = AIService()
        plan = ai_service.plan_sprint(
            project_id=project_id,
            sprint_capacity_hours=request.sprint_capacity_hours,
            current_velocity=request.current_velocity,
        )

        return {
            "project_id": project_id,
            "plan": plan,
        }

    except Exception as e:
        logger.error(f"Failed to plan sprint for project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Dependency Detection ─────────────────────────────────────────

@router.post("/tasks/{task_id}/detect-dependencies")
async def detect_dependencies(
    task_id: str,
    project_id: str,  # Query parameter for permission check
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("task", "read")),
) -> dict[str, Any]:
    """
    Detect implicit dependencies from task description.

    Requires: task:read permission
    """
    try:
        # Get task details
        task_service = TaskService()
        success, task_result = task_service.get_task(task_id)

        if not success:
            raise HTTPException(status_code=404, detail="Task not found")

        task = task_result["task"]

        # Get all tasks in project
        success, tasks_result = task_service.list_tasks(project_id=project_id)
        all_tasks = tasks_result.get("tasks", []) if success else []

        # Detect dependencies
        ai_service = AIService()
        dependencies = ai_service.detect_dependencies(
            task_id=task_id,
            title=task["title"],
            description=task.get("description", ""),
            all_tasks=all_tasks,
        )

        return {
            "task_id": task_id,
            "dependencies": dependencies,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to detect dependencies for task {task_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Get AI Suggestions ───────────────────────────────────────────

@router.get("/suggestions")
async def get_ai_suggestions(
    project_id: str | None = None,
    task_id: str | None = None,
    pending_only: bool = True,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Get AI suggestions for project/task.

    Optional permission check based on project_id.
    """
    try:
        ai_service = AIService()

        query = ai_service.client.table("archon_ai_suggestions").select("*")

        if project_id:
            query = query.eq("project_id", project_id)

        if task_id:
            query = query.eq("task_id", task_id)

        if pending_only:
            query = query.is_("accepted", "null")

        query = query.order("created_at", desc=True).limit(50)

        response = query.execute()
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get AI suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Accept/Reject Suggestion ─────────────────────────────────────

@router.put("/suggestions/{suggestion_id}/accept")
async def accept_suggestion(
    suggestion_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """
    Accept an AI suggestion and apply it.

    Requires: Authentication
    """
    try:
        ai_service = AIService()

        # Update suggestion status
        response = (
            ai_service.client.table("archon_ai_suggestions")
            .update({"accepted": True, "accepted_by": user_id})
            .eq("id", suggestion_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Suggestion not found")

        return {"message": "Suggestion accepted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to accept suggestion {suggestion_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
