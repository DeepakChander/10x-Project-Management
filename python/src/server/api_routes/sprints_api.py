"""
Sprints API endpoints for 10x PM

Handles:
- Sprint CRUD within projects
- Sprint lifecycle (planning -> active -> completed)
- Sprint capacity tracking
- Task-sprint assignment
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..middleware.permission_middleware import (
    get_current_user_id,
    require_permission,
    require_sprint_permission,
    require_task_permission,
)
from ..services.projects.sprint_service import SprintService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["sprints"])


class CreateSprintRequest(BaseModel):
    name: str
    goal: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity_hours: int = 0


class UpdateSprintRequest(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity_hours: Optional[int] = None


class AssignTaskToSprintRequest(BaseModel):
    sprint_id: Optional[str] = None  # None to unassign


# ── Sprint CRUD ────────────────────────────────────────────────

@router.post("/projects/{project_id}/sprints")
async def create_sprint(
    project_id: str,
    data: CreateSprintRequest,
    current_user: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("sprint", "create")),
) -> dict[str, Any]:
    """Create a new sprint for a project.

    Requires: sprint:create permission
    """
    service = SprintService()
    return service.create_sprint(
        project_id=project_id,
        name=data.name,
        goal=data.goal,
        start_date=data.start_date,
        end_date=data.end_date,
        capacity_hours=data.capacity_hours,
        created_by=current_user,
    )


@router.get("/projects/{project_id}/sprints")
async def list_sprints(
    project_id: str,
    status: Optional[str] = Query(None, description="Filter by sprint status"),
    perm: dict = Depends(require_permission("sprint", "read")),
) -> list[dict[str, Any]]:
    """List sprints for a project.

    Requires: sprint:read permission
    """
    return SprintService().list_sprints(project_id, status=status)


@router.get("/sprints/{sprint_id}")
async def get_sprint(
    sprint_id: str,
    perm: dict = Depends(require_sprint_permission("read")),
) -> dict[str, Any]:
    """Get a single sprint by ID.

    Requires: sprint:read permission
    """
    sprint = SprintService().get_sprint(sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.put("/sprints/{sprint_id}")
async def update_sprint(
    sprint_id: str,
    data: UpdateSprintRequest,
    current_user: str = Depends(get_current_user_id),
    perm: dict = Depends(require_sprint_permission("update")),
) -> dict[str, Any]:
    """Update a sprint.

    Requires: sprint:update permission
    """
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        return SprintService().update_sprint(sprint_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/sprints/{sprint_id}")
async def delete_sprint(
    sprint_id: str,
    current_user: str = Depends(get_current_user_id),
    perm: dict = Depends(require_sprint_permission("delete")),
) -> dict[str, str]:
    """Delete a sprint. Tasks will be unlinked.

    Requires: sprint:delete permission
    """
    if SprintService().delete_sprint(sprint_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Sprint not found")


# ── Sprint Capacity ───────────────────────────────────────────

@router.get("/sprints/{sprint_id}/capacity")
async def get_sprint_capacity(
    sprint_id: str,
    perm: dict = Depends(require_sprint_permission("read")),
) -> dict[str, Any]:
    """Get capacity summary for a sprint (tasks, story points, completion).

    Requires: sprint:read permission
    """
    try:
        return SprintService().get_sprint_capacity(sprint_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_id}/sprints/active")
async def get_active_sprint(
    project_id: str,
    perm: dict = Depends(require_permission("sprint", "read")),
) -> dict[str, Any]:
    """Get the currently active sprint for a project.

    Returns {"sprint": null} when no active sprint exists (not a 404).
    Requires: sprint:read permission
    """
    sprint = SprintService().get_active_sprint(project_id)
    return {"sprint": sprint}


# ── Task-Sprint Assignment ────────────────────────────────────

@router.put("/tasks/{task_id}/sprint")
async def assign_task_to_sprint(
    task_id: str,
    data: AssignTaskToSprintRequest,
    current_user: str = Depends(get_current_user_id),
    perm: dict = Depends(require_task_permission("update")),
) -> dict[str, Any]:
    """Assign or unassign a task to/from a sprint.

    Requires: task:update permission (modifies task sprint assignment)
    """
    try:
        return SprintService().assign_task_to_sprint(task_id, data.sprint_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
