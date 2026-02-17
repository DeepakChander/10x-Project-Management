"""
Sprint Management MCP Tools

Exposes sprint management capabilities to AI IDEs
"""

from typing import Any

from ...utils.http_client import http_client


async def find_sprints(
    project_id: str | None = None,
    sprint_id: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    """
    Find sprints - list all, search, or get specific sprint.

    Args:
        project_id: Filter by project (optional)
        sprint_id: Get specific sprint by ID (optional)
        status: Filter by status: planning, active, completed, cancelled (optional)

    Returns:
        List of sprints or single sprint details
    """
    # Get specific sprint
    if sprint_id:
        response = await http_client.get(f"/sprints/{sprint_id}")
        return {"sprint": response}

    # List sprints for project
    if project_id:
        url = f"/projects/{project_id}/sprints"
        if status:
            url += f"?status={status}"
        response = await http_client.get(url)
        return {"sprints": response, "count": len(response)}

    return {"error": "Either project_id or sprint_id is required"}


async def manage_sprint(
    action: str,
    sprint_id: str | None = None,
    project_id: str | None = None,
    name: str | None = None,
    goal: str | None = None,
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    capacity_hours: int | None = None,
) -> dict[str, Any]:
    """
    Manage sprints - create, update, or delete.

    Actions:
        create: Create new sprint (requires project_id, name)
        update: Update sprint (requires sprint_id)
        delete: Delete sprint (requires sprint_id)

    Args:
        action: "create", "update", or "delete"
        sprint_id: Sprint ID (for update/delete)
        project_id: Project ID (for create)
        name: Sprint name
        goal: Sprint goal/objective
        status: Sprint status (planning, active, completed, cancelled)
        start_date: Start date (ISO format)
        end_date: End date (ISO format)
        capacity_hours: Team capacity in hours

    Returns:
        Created/updated sprint or success message
    """
    if action == "create":
        if not project_id or not name:
            return {"error": "project_id and name are required for create"}

        data = {"name": name}
        if goal:
            data["goal"] = goal
        if start_date:
            data["start_date"] = start_date
        if end_date:
            data["end_date"] = end_date
        if capacity_hours:
            data["capacity_hours"] = capacity_hours

        response = await http_client.post(f"/projects/{project_id}/sprints", json=data)
        return {"sprint": response, "message": f"Sprint '{name}' created"}

    elif action == "update":
        if not sprint_id:
            return {"error": "sprint_id is required for update"}

        data = {}
        if name:
            data["name"] = name
        if goal:
            data["goal"] = goal
        if status:
            data["status"] = status
        if start_date:
            data["start_date"] = start_date
        if end_date:
            data["end_date"] = end_date
        if capacity_hours is not None:
            data["capacity_hours"] = capacity_hours

        response = await http_client.put(f"/sprints/{sprint_id}", json=data)
        return {"sprint": response, "message": "Sprint updated"}

    elif action == "delete":
        if not sprint_id:
            return {"error": "sprint_id is required for delete"}

        response = await http_client.delete(f"/sprints/{sprint_id}")
        return {"message": "Sprint deleted", "status": response}

    else:
        return {"error": f"Unknown action: {action}. Use 'create', 'update', or 'delete'"}


async def get_sprint_capacity(sprint_id: str) -> dict[str, Any]:
    """
    Get sprint capacity summary with task breakdown.

    Args:
        sprint_id: Sprint ID

    Returns:
        Capacity summary with total tasks, story points, completion stats
    """
    response = await http_client.get(f"/sprints/{sprint_id}/capacity")
    return response


async def assign_task_to_sprint(task_id: str, sprint_id: str | None) -> dict[str, Any]:
    """
    Assign a task to a sprint (or remove from sprint if sprint_id is None).

    Args:
        task_id: Task ID to assign
        sprint_id: Sprint ID (or None to unassign)

    Returns:
        Updated task
    """
    data = {"sprint_id": sprint_id}
    response = await http_client.put(f"/tasks/{task_id}/sprint", json=data)
    return {"task": response, "message": "Task sprint assignment updated"}
