"""
Analytics API

Handles:
- Sprint burndown charts
- Velocity tracking
- Team performance metrics
- Project dashboards
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..middleware.permission_middleware import get_current_user_id, require_permission
from ..services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ── Sprint Burndown ──────────────────────────────────────────────

@router.get("/sprints/{sprint_id}/burndown")
async def get_sprint_burndown(
    sprint_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Get burndown chart data for a sprint.

    Returns daily snapshots of remaining work.
    """
    try:
        service = AnalyticsService()
        burndown = service.get_sprint_burndown(sprint_id)
        return burndown

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get burndown: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Velocity Chart ───────────────────────────────────────────────

@router.get("/projects/{project_id}/velocity")
async def get_velocity_chart(
    project_id: str,
    limit: int = 10,
    perm: dict = Depends(require_permission("project", "read")),
) -> dict[str, Any]:
    """
    Get velocity trend chart for a project.

    Returns historical velocity data for last N sprints.
    Requires: project:read permission
    """
    try:
        service = AnalyticsService()
        velocity = service.get_velocity_chart(project_id, limit=limit)
        return velocity

    except Exception as e:
        logger.error(f"Failed to get velocity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Team Performance ─────────────────────────────────────────────

@router.get("/projects/{project_id}/team-performance")
async def get_team_performance(
    project_id: str,
    sprint_id: str | None = None,
    perm: dict = Depends(require_permission("project", "read")),
) -> list[dict[str, Any]]:
    """
    Get team member performance metrics.

    Optionally filter by sprint.
    Requires: project:read permission
    """
    try:
        service = AnalyticsService()
        performance = service.get_team_performance(project_id, sprint_id=sprint_id)
        return performance

    except Exception as e:
        logger.error(f"Failed to get team performance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Project Dashboard ────────────────────────────────────────────

@router.get("/projects/{project_id}/dashboard")
async def get_project_dashboard(
    project_id: str,
    perm: dict = Depends(require_permission("project", "read")),
) -> dict[str, Any]:
    """
    Get comprehensive dashboard data for a project.

    Returns:
    - Active sprint info
    - Burndown chart
    - Velocity summary
    - Team performance

    Requires: project:read permission
    """
    try:
        service = AnalyticsService()
        dashboard = service.get_project_dashboard(project_id)
        return dashboard

    except Exception as e:
        logger.error(f"Failed to get dashboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
