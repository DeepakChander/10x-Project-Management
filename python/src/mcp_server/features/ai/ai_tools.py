"""
AI Features MCP Tools
"""

from typing import Any
from ...utils.http_client import http_client


async def estimate_task(task_id: str, project_id: str) -> dict[str, Any]:
    """Get AI estimation for a task (story points, duration)."""
    response = await http_client.post(f"/ai/tasks/{task_id}/estimate?project_id={project_id}")
    return response


async def plan_sprint(project_id: str, capacity_hours: int) -> dict[str, Any]:
    """Get AI recommendations for sprint planning."""
    data = {"sprint_capacity_hours": capacity_hours}
    response = await http_client.post(f"/ai/projects/{project_id}/plan-sprint", json=data)
    return response
