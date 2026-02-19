"""
Task Dependency Service Module

Manages blocking relationships between tasks. A dependency means
task_id IS BLOCKED BY depends_on_id — the blocked task cannot move
to "doing" until all its blockers are in "done" status.
"""

from typing import Any

from src.server.utils import get_supabase_client

from ...config.logfire_config import get_logger

logger = get_logger(__name__)


class TaskDependencyService:
    """Service class for task dependency operations"""

    def __init__(self, supabase_client=None):
        self.supabase_client = supabase_client or get_supabase_client()

    async def add_dependency(
        self, task_id: str, depends_on_id: str
    ) -> tuple[bool, dict[str, Any]]:
        """
        Add a blocking dependency: task_id is blocked by depends_on_id.

        Validates:
        - Both tasks exist
        - Both tasks are in the same project
        - No circular dependency would result
        - Dependency doesn't already exist
        """
        try:
            # Fetch both tasks
            task_response = (
                self.supabase_client.table("archon_tasks")
                .select("id, project_id, title")
                .eq("id", task_id)
                .execute()
            )
            blocker_response = (
                self.supabase_client.table("archon_tasks")
                .select("id, project_id, title")
                .eq("id", depends_on_id)
                .execute()
            )

            if not task_response.data:
                return False, {"error": f"Task '{task_id}' not found"}
            if not blocker_response.data:
                return False, {"error": f"Blocker task '{depends_on_id}' not found"}

            task = task_response.data[0]
            blocker = blocker_response.data[0]

            # Same project check
            if task["project_id"] != blocker["project_id"]:
                return False, {"error": "Dependencies can only be created between tasks in the same project"}

            # Circular dependency check
            if await self._has_circular_dependency(task_id, depends_on_id):
                return False, {
                    "error": f"Circular dependency detected: adding this dependency would create a cycle"
                }

            # Insert dependency
            dep_data = {
                "task_id": task_id,
                "depends_on_id": depends_on_id,
                "dependency_type": "blocks",
            }

            response = (
                self.supabase_client.table("archon_task_dependencies")
                .insert(dep_data)
                .execute()
            )

            if response.data:
                logger.info(
                    f"Dependency created: '{task['title']}' blocked by '{blocker['title']}'"
                )
                return True, {"dependency": response.data[0]}
            return False, {"error": "Failed to create dependency"}

        except Exception as e:
            error_msg = str(e)
            if "duplicate key" in error_msg or "unique" in error_msg.lower():
                return False, {"error": "This dependency already exists"}
            logger.error(f"Error creating dependency: {error_msg}", exc_info=True)
            return False, {"error": f"Error creating dependency: {error_msg}"}

    async def remove_dependency(self, dependency_id: str) -> tuple[bool, dict[str, Any]]:
        """Remove a dependency by its ID."""
        try:
            response = (
                self.supabase_client.table("archon_task_dependencies")
                .delete()
                .eq("id", dependency_id)
                .execute()
            )

            if response.data:
                return True, {"message": "Dependency removed"}
            return False, {"error": f"Dependency '{dependency_id}' not found"}

        except Exception as e:
            logger.error(f"Error removing dependency: {str(e)}", exc_info=True)
            return False, {"error": f"Error removing dependency: {str(e)}"}

    async def get_dependencies_for_task(self, task_id: str) -> tuple[bool, dict[str, Any]]:
        """
        Get dependencies for a single task.

        Returns:
            blocks: tasks that this task blocks (depends_on_id = task_id)
            blocked_by: tasks that block this task (task_id = task_id)
        """
        try:
            # Tasks blocked BY this task (this task is the blocker)
            blocks_response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("id, task_id, depends_on_id, dependency_type, created_at")
                .eq("depends_on_id", task_id)
                .execute()
            )

            # Tasks that BLOCK this task (this task is blocked)
            blocked_by_response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("id, task_id, depends_on_id, dependency_type, created_at")
                .eq("task_id", task_id)
                .execute()
            )

            # Enrich with task titles and status
            blocks = await self._enrich_dependencies(blocks_response.data or [], "task_id")
            blocked_by = await self._enrich_dependencies(blocked_by_response.data or [], "depends_on_id")

            return True, {"blocks": blocks, "blocked_by": blocked_by}

        except Exception as e:
            logger.error(f"Error getting dependencies for task: {str(e)}", exc_info=True)
            return False, {"error": f"Error getting dependencies: {str(e)}"}

    async def get_dependencies_for_project(self, project_id: str) -> tuple[bool, dict[str, Any]]:
        """
        Get all dependencies for all tasks in a project.

        Returns a map keyed by task_id with blocks and blocked_by arrays.
        """
        try:
            # Get all task IDs in the project (include NULL archived as non-archived)
            tasks_response = (
                self.supabase_client.table("archon_tasks")
                .select("id, title, status")
                .eq("project_id", project_id)
                .or_("archived.is.null,archived.is.false")
                .execute()
            )

            task_map = {t["id"]: t for t in (tasks_response.data or [])}
            task_ids = list(task_map.keys())

            if not task_ids:
                return True, {"dependencies": {}}

            # Get all dependencies where either task is in this project
            deps_response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("id, task_id, depends_on_id, dependency_type, created_at")
                .in_("task_id", task_ids)
                .execute()
            )

            # Also get dependencies where this project's tasks are blockers
            blocker_deps_response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("id, task_id, depends_on_id, dependency_type, created_at")
                .in_("depends_on_id", task_ids)
                .execute()
            )

            # Build the dependency map
            dep_map: dict[str, dict[str, list]] = {}

            # Initialize for all tasks
            for tid in task_ids:
                dep_map[tid] = {"blocks": [], "blocked_by": []}

            # blocked_by: deps where task_id = this task (this task is blocked)
            for dep in (deps_response.data or []):
                tid = dep["task_id"]
                blocker_id = dep["depends_on_id"]
                blocker_info = task_map.get(blocker_id, {})
                dep_map.setdefault(tid, {"blocks": [], "blocked_by": []})
                dep_map[tid]["blocked_by"].append({
                    **dep,
                    "depends_on_title": blocker_info.get("title", "Unknown"),
                    "depends_on_status": blocker_info.get("status", "unknown"),
                })

            # blocks: deps where depends_on_id = this task (this task blocks others)
            for dep in (blocker_deps_response.data or []):
                blocker_id = dep["depends_on_id"]
                blocked_id = dep["task_id"]
                blocked_info = task_map.get(blocked_id, {})
                dep_map.setdefault(blocker_id, {"blocks": [], "blocked_by": []})
                dep_map[blocker_id]["blocks"].append({
                    **dep,
                    "depends_on_title": blocked_info.get("title", "Unknown"),
                    "depends_on_status": blocked_info.get("status", "unknown"),
                })

            return True, {"dependencies": dep_map}

        except Exception as e:
            logger.error(f"Error getting project dependencies: {str(e)}", exc_info=True)
            return False, {"error": f"Error getting project dependencies: {str(e)}"}

    async def get_unresolved_blockers(self, task_id: str) -> list[dict[str, Any]]:
        """
        Get blocking tasks that are NOT in 'done' status.
        Used by TaskService to prevent moving to 'doing' when blocked.
        """
        try:
            # Get all tasks that block this task
            deps_response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("depends_on_id")
                .eq("task_id", task_id)
                .execute()
            )

            if not deps_response.data:
                return []

            blocker_ids = [d["depends_on_id"] for d in deps_response.data]

            # Get blocker tasks that are NOT done
            blockers_response = (
                self.supabase_client.table("archon_tasks")
                .select("id, title, status")
                .in_("id", blocker_ids)
                .neq("status", "done")
                .execute()
            )

            return blockers_response.data or []

        except Exception as e:
            logger.error(f"Error checking unresolved blockers: {str(e)}", exc_info=True)
            return []

    async def _has_circular_dependency(self, task_id: str, depends_on_id: str) -> bool:
        """
        Check if adding depends_on_id as a blocker of task_id would create a cycle.

        Walks the dependency chain starting from task_id (following its 'blocks' edges)
        to see if we can reach depends_on_id.
        """
        visited: set[str] = set()

        async def dfs(current_id: str) -> bool:
            if current_id == depends_on_id:
                return True
            if current_id in visited:
                return False
            visited.add(current_id)

            # Get tasks that current_id blocks (where depends_on_id = current_id)
            response = (
                self.supabase_client.table("archon_task_dependencies")
                .select("task_id")
                .eq("depends_on_id", current_id)
                .execute()
            )

            for dep in (response.data or []):
                if await dfs(dep["task_id"]):
                    return True
            return False

        return await dfs(task_id)

    async def _enrich_dependencies(
        self, deps: list[dict], title_field: str
    ) -> list[dict[str, Any]]:
        """Enrich dependency records with task title and status."""
        if not deps:
            return []

        task_ids = [d[title_field] for d in deps]
        tasks_response = (
            self.supabase_client.table("archon_tasks")
            .select("id, title, status")
            .in_("id", task_ids)
            .execute()
        )

        task_map = {t["id"]: t for t in (tasks_response.data or [])}

        enriched = []
        for dep in deps:
            task_info = task_map.get(dep[title_field], {})
            enriched.append({
                **dep,
                "depends_on_title": task_info.get("title", "Unknown"),
                "depends_on_status": task_info.get("status", "unknown"),
            })
        return enriched
