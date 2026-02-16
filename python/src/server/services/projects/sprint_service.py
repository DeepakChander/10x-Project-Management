"""
Sprint Service Module for 10x PM

Handles sprint lifecycle: planning, active, completed, cancelled.
Provides capacity tracking and task-sprint association.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from src.server.utils import get_supabase_client

logger = logging.getLogger(__name__)


def _send_notification_safe(notification_func, *args, **kwargs):
    """
    Safely attempt to send a notification without failing the main operation.
    """
    try:
        from ..notification_service import NotificationService
        service = NotificationService()
        method = getattr(service, notification_func)
        return method(*args, **kwargs)
    except Exception as e:
        logger.warning(f"Failed to send notification {notification_func}: {e}")
        return None


class SprintService:
    """Service class for sprint operations."""

    VALID_STATUSES = ["planning", "active", "completed", "cancelled"]

    VALID_TRANSITIONS = {
        "planning": ["active", "cancelled"],
        "active": ["completed", "cancelled"],
        "completed": [],
        "cancelled": [],
    }

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def create_sprint(
        self,
        project_id: str,
        name: str,
        goal: str = "",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        capacity_hours: int = 0,
        created_by: str = "User",
    ) -> dict[str, Any]:
        """Create a new sprint for a project."""
        insert_data = {
            "project_id": project_id,
            "name": name,
            "goal": goal,
            "status": "planning",
            "capacity_hours": capacity_hours,
            "created_by": created_by,
        }
        if start_date:
            insert_data["start_date"] = start_date
        if end_date:
            insert_data["end_date"] = end_date

        response = self.client.table("archon_sprints").insert(insert_data).execute()
        if not response.data:
            raise ValueError("Failed to create sprint")
        logger.info(f"Sprint created: {name} for project {project_id}")
        return response.data[0]

    def get_sprint(self, sprint_id: str) -> Optional[dict[str, Any]]:
        """Get a single sprint by ID."""
        response = self.client.table("archon_sprints").select("*").eq("id", sprint_id).execute()
        return response.data[0] if response.data else None

    def list_sprints(
        self,
        project_id: str,
        status: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """List sprints for a project, optionally filtered by status."""
        query = (
            self.client.table("archon_sprints")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
        )
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return response.data or []

    def update_sprint(self, sprint_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        """Update a sprint's fields."""
        # Validate status transition if status is being changed
        if "status" in updates:
            current = self.get_sprint(sprint_id)
            if not current:
                raise ValueError(f"Sprint {sprint_id} not found")

            current_status = current["status"]
            new_status = updates["status"]

            if new_status != current_status:
                allowed = self.VALID_TRANSITIONS.get(current_status, [])
                if new_status not in allowed:
                    raise ValueError(
                        f"Invalid sprint transition from '{current_status}' to '{new_status}'. "
                        f"Allowed: {', '.join(allowed) if allowed else 'none'}"
                    )

        # Get old sprint data for comparison
        old_sprint_response = (
            self.client.table("archon_sprints")
            .select("*")
            .eq("id", sprint_id)
            .execute()
        )
        if not old_sprint_response.data:
            raise ValueError(f"Sprint {sprint_id} not found")

        old_sprint = old_sprint_response.data[0]

        # Update sprint
        response = (
            self.client.table("archon_sprints")
            .update(updates)
            .eq("id", sprint_id)
            .execute()
        )
        if not response.data:
            raise ValueError(f"Sprint {sprint_id} not found")

        updated_sprint = response.data[0]

        # Send notifications on status change
        if "status" in updates and old_sprint["status"] != updated_sprint["status"]:
            # Get all project members to notify
            members_response = (
                self.client.table("archon_project_memberships")
                .select("user_id")
                .eq("project_id", updated_sprint["project_id"])
                .execute()
            )

            member_ids = [m["user_id"] for m in (members_response.data or [])]

            # Notify on sprint start
            if updated_sprint["status"] == "active":
                _send_notification_safe(
                    "notify_sprint_started",
                    sprint_id=sprint_id,
                    sprint_name=updated_sprint["name"],
                    project_id=updated_sprint["project_id"],
                    team_member_ids=member_ids,
                )

        return updated_sprint

    def delete_sprint(self, sprint_id: str) -> bool:
        """Delete a sprint. Tasks linked to it will have sprint_id set to NULL."""
        response = self.client.table("archon_sprints").delete().eq("id", sprint_id).execute()
        return bool(response.data)

    def get_sprint_capacity(self, sprint_id: str) -> dict[str, Any]:
        """Get capacity summary for a sprint."""
        response = (
            self.client.table("sprint_capacity_summary")
            .select("*")
            .eq("sprint_id", sprint_id)
            .execute()
        )
        if not response.data:
            sprint = self.get_sprint(sprint_id)
            if not sprint:
                raise ValueError(f"Sprint {sprint_id} not found")
            return {
                "sprint_id": sprint_id,
                "project_id": sprint["project_id"],
                "sprint_name": sprint["name"],
                "sprint_status": sprint["status"],
                "capacity_hours": sprint.get("capacity_hours", 0),
                "total_story_points": 0,
                "total_tasks": 0,
                "completed_tasks": 0,
                "active_tasks": 0,
                "pending_tasks": 0,
            }
        return response.data[0]

    def assign_task_to_sprint(self, task_id: str, sprint_id: Optional[str]) -> dict[str, Any]:
        """Assign or unassign a task to/from a sprint."""
        response = (
            self.client.table("archon_tasks")
            .update({"sprint_id": sprint_id})
            .eq("id", task_id)
            .execute()
        )
        if not response.data:
            raise ValueError(f"Task {task_id} not found")
        return response.data[0]

    def get_active_sprint(self, project_id: str) -> Optional[dict[str, Any]]:
        """Get the currently active sprint for a project."""
        response = (
            self.client.table("archon_sprints")
            .select("*")
            .eq("project_id", project_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None
