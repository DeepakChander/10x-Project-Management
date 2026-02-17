"""
Analytics MCP Tools

Exposes analytics and metrics to AI IDEs
"""

from typing import Any

from ...utils.http_client import http_client


async def get_sprint_burndown(sprint_id: str) -> dict[str, Any]:
    """
    Get sprint burndown chart data.

    Args:
        sprint_id: Sprint ID

    Returns:
        Burndown data with snapshots and ideal line
    """
    response = await http_client.get(f"/analytics/sprints/{sprint_id}/burndown")
    return response


async def get_project_analytics(project_id: str) -> dict[str, Any]:
    """
    Get comprehensive analytics dashboard for a project.

    Args:
        project_id: Project ID

    Returns:
        Complete analytics including burndown, velocity, team performance
    """
    response = await http_client.get(f"/analytics/projects/{project_id}/dashboard")
    return response


async def get_velocity_chart(project_id: str, limit: int = 10) -> dict[str, Any]:
    """
    Get velocity trend chart for a project.

    Args:
        project_id: Project ID
        limit: Number of recent sprints to include (default: 10)

    Returns:
        Velocity data for last N sprints
    """
    response = await http_client.get(f"/analytics/projects/{project_id}/velocity?limit={limit}")
    return response
