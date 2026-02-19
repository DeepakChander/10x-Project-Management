"""
Analytics Service

Calculates metrics, generates chart data, and tracks performance
"""

import logging
from datetime import date, datetime, timedelta
from typing import Any, Optional

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics and metrics"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def get_sprint_burndown(self, sprint_id: str) -> dict[str, Any]:
        """
        Get burndown data for a sprint.

        Returns chart data with daily remaining work.
        """
        try:
            # Get sprint details
            sprint_response = (
                self.client.table("archon_sprints")
                .select("*")
                .eq("id", sprint_id)
                .execute()
            )

            if not sprint_response.data:
                raise ValueError(f"Sprint {sprint_id} not found")

            sprint = sprint_response.data[0]

            # Get burndown snapshots
            burndown_response = (
                self.client.table("archon_sprint_burndown")
                .select("*")
                .eq("sprint_id", sprint_id)
                .order("snapshot_date")
                .execute()
            )

            snapshots = burndown_response.data or []

            # If no snapshots, create current snapshot
            if not snapshots:
                current_snapshot = self._create_burndown_snapshot(sprint_id)
                snapshots = [current_snapshot] if current_snapshot else []

            # Calculate ideal burndown line
            if sprint.get("start_date") and sprint.get("end_date"):
                start = datetime.fromisoformat(sprint["start_date"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(sprint["end_date"].replace("Z", "+00:00"))
                total_days = (end - start).days

                # Get initial scope
                initial_points = snapshots[0]["total_scope_points"] if snapshots else 0

                ideal_line = []
                for day in range(total_days + 1):
                    remaining = initial_points * (1 - day / total_days) if total_days > 0 else 0
                    ideal_line.append({
                        "day": day,
                        "ideal_remaining": round(remaining, 2),
                    })
            else:
                ideal_line = []

            return {
                "sprint_id": sprint_id,
                "sprint_name": sprint["name"],
                "start_date": sprint.get("start_date"),
                "end_date": sprint.get("end_date"),
                "snapshots": snapshots,
                "ideal_line": ideal_line,
            }

        except Exception as e:
            logger.error(f"Failed to get burndown for sprint {sprint_id}: {e}", exc_info=True)
            raise

    def get_velocity_chart(self, project_id: str, limit: int = 10) -> dict[str, Any]:
        """
        Get velocity trend data for a project.

        Returns last N sprints with completed story points.
        """
        try:
            # Get velocity history
            velocity_response = (
                self.client.table("archon_velocity_history")
                .select("*")
                .eq("project_id", project_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            velocity_data = list(reversed(velocity_response.data or []))

            # Calculate average
            if velocity_data:
                avg_velocity = sum(v["velocity_points"] or 0 for v in velocity_data) / len(velocity_data)
            else:
                avg_velocity = 0

            return {
                "project_id": project_id,
                "velocity_data": velocity_data,
                "avg_velocity": round(avg_velocity, 2),
                "sprint_count": len(velocity_data),
            }

        except Exception as e:
            logger.error(f"Failed to get velocity for project {project_id}: {e}", exc_info=True)
            raise

    def get_team_performance(
        self,
        project_id: str,
        sprint_id: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        Get team member performance metrics.

        Returns performance data for each team member.
        """
        try:
            query = (
                self.client.table("archon_member_performance")
                .select("*, archon_users_profile!archon_member_performance_user_id_fkey(display_name)")
                .eq("project_id", project_id)
            )

            if sprint_id:
                query = query.eq("sprint_id", sprint_id)

            response = query.execute()

            return response.data or []

        except Exception as e:
            logger.error(f"Failed to get team performance: {e}", exc_info=True)
            raise

    def get_project_dashboard(self, project_id: str) -> dict[str, Any]:
        """
        Get comprehensive dashboard data for a project.

        Returns all analytics in one call.
        """
        try:
            # Get active sprint
            active_sprint_response = (
                self.client.table("archon_sprints")
                .select("*")
                .eq("project_id", project_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            )

            active_sprint = active_sprint_response.data[0] if active_sprint_response.data else None

            # Get velocity summary
            velocity_response = (
                self.client.table("project_velocity_summary")
                .select("*")
                .eq("project_id", project_id)
                .execute()
            )

            velocity_summary = velocity_response.data[0] if velocity_response.data else None

            # Get burndown if active sprint
            burndown = None
            if active_sprint:
                try:
                    burndown = self.get_sprint_burndown(active_sprint["id"])
                except Exception as e:
                    logger.warning(f"Failed to get burndown: {e}")

            # Get recent velocity
            velocity_chart = self.get_velocity_chart(project_id, limit=5)

            return {
                "project_id": project_id,
                "active_sprint": active_sprint,
                "velocity_summary": velocity_summary,
                "burndown": burndown,
                "velocity_chart": velocity_chart,
            }

        except Exception as e:
            logger.error(f"Failed to get dashboard for project {project_id}: {e}", exc_info=True)
            raise

    # ── Helper Methods ──────────────────────────────────────────────

    def _create_burndown_snapshot(self, sprint_id: str) -> Optional[dict]:
        """Create a burndown snapshot for current moment"""
        try:
            # Get current sprint state
            response = (
                self.client.table("sprint_capacity_summary")
                .select("*")
                .eq("sprint_id", sprint_id)
                .execute()
            )

            if not response.data:
                return None

            capacity = response.data[0]

            today = date.today()

            # Create snapshot
            snapshot_data = {
                "sprint_id": sprint_id,
                "project_id": capacity["project_id"],
                "snapshot_date": today.isoformat(),
                "remaining_story_points": capacity.get("total_story_points", 0),
                "remaining_tasks": capacity.get("pending_tasks", 0) + capacity.get("active_tasks", 0),
                "completed_today_points": 0,  # TODO: Calculate from task history
                "completed_today_tasks": 0,
                "total_scope_points": capacity.get("total_story_points", 0),
                "total_scope_tasks": capacity.get("total_tasks", 0),
            }

            # Insert snapshot
            insert_response = (
                self.client.table("archon_sprint_burndown")
                .insert(snapshot_data)
                .execute()
            )

            return insert_response.data[0] if insert_response.data else None

        except Exception as e:
            logger.warning(f"Failed to create burndown snapshot: {e}")
            return None

    def record_sprint_completion(self, sprint_id: str) -> bool:
        """
        Record sprint completion in velocity history.

        Called when sprint status changes to 'completed'.
        """
        try:
            # Get sprint and capacity
            sprint_response = (
                self.client.table("archon_sprints")
                .select("*")
                .eq("id", sprint_id)
                .execute()
            )

            if not sprint_response.data:
                return False

            sprint = sprint_response.data[0]

            capacity_response = (
                self.client.table("sprint_capacity_summary")
                .select("*")
                .eq("sprint_id", sprint_id)
                .execute()
            )

            capacity = capacity_response.data[0] if capacity_response.data else {}

            # Calculate actual completed story points from tasks
            completed_tasks_response = (
                self.client.table("archon_tasks")
                .select("story_points")
                .eq("sprint_id", sprint_id)
                .eq("status", "done")
                .execute()
            )

            # Sum up story points from completed tasks
            completed_points = sum(
                task.get("story_points", 0) or 0
                for task in (completed_tasks_response.data or [])
            )

            # Calculate metrics
            total_points = capacity.get("total_story_points", 0)
            completion_rate = (completed_points / total_points * 100) if total_points > 0 else 0

            # Store in velocity history
            velocity_data = {
                "project_id": sprint["project_id"],
                "sprint_id": sprint_id,
                "sprint_name": sprint["name"],
                "sprint_start_date": sprint.get("start_date"),
                "sprint_end_date": sprint.get("end_date"),
                "planned_story_points": total_points,
                "completed_story_points": completed_points,
                "planned_tasks": capacity.get("total_tasks", 0),
                "completed_tasks": capacity.get("completed_tasks", 0),
                "velocity_points": completed_points,
                "velocity_tasks": capacity.get("completed_tasks", 0),
                "completion_rate": round(completion_rate, 2),
                "sprint_status": sprint["status"],
            }

            self.client.table("archon_velocity_history").insert(velocity_data).execute()

            logger.info(f"Sprint completion recorded | sprint={sprint_id} | velocity={completed_points} points")

            return True

        except Exception as e:
            logger.error(f"Failed to record sprint completion: {e}", exc_info=True)
            return False
