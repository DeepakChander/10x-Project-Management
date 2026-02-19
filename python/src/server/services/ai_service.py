"""
AI Service - Intelligent task estimation and sprint planning

Uses LLM to provide:
- Task story point estimation
- Sprint planning recommendations
- Priority suggestions
- Dependency detection
"""

import json
import logging
from typing import Any, Optional

from ..utils import get_supabase_client
from .ai.provider_factory import AIProviderFactory

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered PM features"""

    def __init__(self, supabase_client=None, ai_provider: Optional[str] = None):
        self.client = supabase_client or get_supabase_client()
        self.ai_provider = AIProviderFactory.get_provider(provider_name=ai_provider)

    async def estimate_task(
        self,
        task_id: str,
        title: str,
        description: str,
        project_context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Estimate story points and duration for a task using AI.

        Args:
            task_id: Task to estimate
            title: Task title
            description: Task description
            project_context: Additional project context (optional)

        Returns:
            {
                "story_points": int (1, 2, 3, 5, 8, 13),
                "duration_hours": int,
                "confidence": float (0.0-1.0),
                "reasoning": str
            }
        """
        try:
            # Try AI provider first
            try:
                estimation = await self.ai_provider.estimate_task(
                    title=title,
                    description=description,
                    project_context=project_context,
                )
                logger.info(
                    f"AI estimation complete | task={task_id} | points={estimation['story_points']} | "
                    f"provider={self.ai_provider.get_provider_name()} | model={self.ai_provider.get_model_name()}"
                )
            except Exception as ai_error:
                # Fallback to heuristic if AI fails
                logger.warning(f"AI provider failed, using heuristic fallback: {ai_error}")
                estimation = self._simple_estimation_heuristic(title, description)
                logger.info(f"Using heuristic estimation | task={task_id} | points={estimation['story_points']}")

            # Store suggestion in database
            self._store_suggestion(
                suggestion_type="task_estimation",
                task_id=task_id,
                title=f"Estimation for: {title}",
                description=f"Suggested {estimation['story_points']} story points",
                confidence=estimation["confidence"],
                suggestion_data=estimation,
            )

            logger.info(
                f"AI estimation complete | task={task_id} | points={estimation['story_points']} | "
                f"provider={self.ai_provider.get_provider_name()} | model={self.ai_provider.get_model_name()}"
            )

            return estimation

        except Exception as e:
            logger.error(f"Failed to estimate task {task_id}: {e}", exc_info=True)
            raise

    async def plan_sprint(
        self,
        project_id: str,
        sprint_capacity_hours: int,
        current_velocity: Optional[float] = None,
    ) -> dict[str, Any]:
        """
        Suggest which tasks should go into the next sprint.

        Args:
            project_id: Project to plan sprint for
            sprint_capacity_hours: Available team capacity
            current_velocity: Recent velocity (story points per sprint)

        Returns:
            {
                "recommended_tasks": [task_ids],
                "total_story_points": int,
                "capacity_utilization": float (0.0-1.0),
                "reasoning": str,
                "warnings": [str]
            }
        """
        try:
            # Get backlog tasks
            backlog_tasks = self._get_backlog_tasks(project_id)

            # Try AI provider first
            try:
                plan = await self.ai_provider.plan_sprint(
                    backlog_tasks=backlog_tasks,
                    capacity_hours=sprint_capacity_hours,
                    current_velocity=current_velocity,
                )
                logger.info(
                    f"AI sprint planning complete | project={project_id} | tasks={len(plan['recommended_tasks'])} | "
                    f"provider={self.ai_provider.get_provider_name()}"
                )
            except Exception as ai_error:
                # Fallback to heuristic if AI fails
                logger.warning(f"AI provider failed, using heuristic fallback: {ai_error}")
                plan = self._simple_sprint_planning(backlog_tasks, sprint_capacity_hours)
                logger.info(f"Using heuristic sprint planning | project={project_id} | tasks={len(plan['recommended_tasks'])}")

            # Store suggestion
            self._store_suggestion(
                suggestion_type="sprint_planning",
                project_id=project_id,
                title="Sprint Planning Recommendation",
                description=f"Suggested {len(plan['recommended_tasks'])} tasks",
                confidence=plan.get("confidence", 0.8),
                suggestion_data=plan,
            )

            logger.info(
                f"AI sprint planning complete | project={project_id} | tasks={len(plan['recommended_tasks'])} | "
                f"provider={self.ai_provider.get_provider_name()}"
            )

            return plan

        except Exception as e:
            logger.error(f"Failed to plan sprint for project {project_id}: {e}", exc_info=True)
            raise

    async def detect_dependencies(
        self,
        task_id: str,
        title: str,
        description: str,
        all_tasks: list[dict],
    ) -> list[dict[str, Any]]:
        """
        Analyze task description to detect implicit dependencies.

        Returns:
            [
                {
                    "depends_on_task_id": str,
                    "depends_on_title": str,
                    "confidence": float,
                    "reasoning": str
                }
            ]
        """
        try:
            # Use AI provider for dependency detection
            dependencies = await self.ai_provider.detect_dependencies(
                task_title=title,
                task_description=description,
                all_tasks=all_tasks,
            )

            logger.info(
                f"AI dependency detection complete | task={task_id} | dependencies={len(dependencies)} | "
                f"provider={self.ai_provider.get_provider_name()}"
            )

            return dependencies

        except Exception as e:
            logger.error(f"Failed to detect dependencies for task {task_id}: {e}", exc_info=True)
            return []

    # ── Helper Methods ──────────────────────────────────────────────

    def _build_estimation_prompt(
        self, title: str, description: str, context: Optional[dict]
    ) -> str:
        """Build prompt for AI estimation"""
        return f"""
Estimate the effort required for this task:

Title: {title}
Description: {description}

Consider:
- Complexity of requirements
- Technical challenges
- Testing needs
- Documentation

Provide estimation in Fibonacci scale (1, 2, 3, 5, 8, 13 story points).
"""

    def _simple_estimation_heuristic(
        self, title: str, description: str
    ) -> dict[str, Any]:
        """
        Simple heuristic for task estimation (placeholder for AI).
        Will be replaced with LLM in production.
        """
        # Count complexity indicators
        complexity_keywords = ["refactor", "design", "architecture", "system", "complex"]
        simple_keywords = ["fix", "update", "add", "remove", "typo"]

        text = (title + " " + description).lower()

        complexity_score = sum(1 for kw in complexity_keywords if kw in text)
        simplicity_score = sum(1 for kw in simple_keywords if kw in text)

        # Estimate based on text length and keywords
        word_count = len(description.split())

        if word_count < 20 and simplicity_score > complexity_score:
            story_points = 1
            duration_hours = 2
        elif word_count < 50 and simplicity_score >= complexity_score:
            story_points = 2
            duration_hours = 4
        elif word_count < 100:
            story_points = 3
            duration_hours = 6
        elif complexity_score > simplicity_score:
            story_points = 8
            duration_hours = 16
        else:
            story_points = 5
            duration_hours = 10

        return {
            "story_points": story_points,
            "duration_hours": duration_hours,
            "confidence": 0.7,
            "reasoning": f"Estimated based on description length ({word_count} words) and complexity indicators",
        }

    def _get_backlog_tasks(self, project_id: str) -> list[dict]:
        """Get all backlog/todo tasks for a project"""
        response = (
            self.client.table("archon_tasks")
            .select("*")
            .eq("project_id", project_id)
            .in_("status", ["backlog", "todo"])
            .or_("archived.is.null,archived.is.false")
            .order("priority", desc=True)
            .execute()
        )
        return response.data or []

    def _simple_sprint_planning(
        self, backlog_tasks: list[dict], capacity_hours: int
    ) -> dict[str, Any]:
        """
        Simple sprint planning algorithm (placeholder for AI).
        Will be replaced with LLM in production.
        """
        recommended_tasks = []
        total_story_points = 0
        warnings = []

        # Sort by priority: critical > high > medium > low
        priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        sorted_tasks = sorted(
            backlog_tasks,
            key=lambda t: priority_order.get(t.get("priority", "medium"), 2),
            reverse=True,
        )

        # Add tasks until capacity is ~80% full (leave buffer)
        target_points = int(capacity_hours * 0.8)

        for task in sorted_tasks:
            points = task.get("story_points") or 3  # Default to 3 if null/not set

            if total_story_points + points <= target_points:
                recommended_tasks.append(task["id"])
                total_story_points += points

        capacity_utilization = total_story_points / capacity_hours if capacity_hours > 0 else 0

        if capacity_utilization > 0.9:
            warnings.append("⚠️ Sprint is over 90% capacity - consider reducing scope")

        return {
            "recommended_tasks": recommended_tasks,
            "total_story_points": total_story_points,
            "capacity_utilization": round(capacity_utilization, 2),
            "reasoning": f"Selected {len(recommended_tasks)} high-priority tasks within capacity",
            "warnings": warnings,
        }

    def _simple_dependency_detection(
        self, title: str, description: str, all_tasks: list[dict]
    ) -> list[dict[str, Any]]:
        """
        Simple dependency detection (placeholder for AI).
        Looks for keywords like "after", "depends on", "requires"
        """
        dependencies = []
        text = (title + " " + description).lower()

        dependency_keywords = ["after", "depends on", "requires", "needs", "blocked by"]

        if any(kw in text for kw in dependency_keywords):
            # Look for task references in other tasks
            for task in all_tasks[:5]:  # Check first 5 tasks
                if task["title"].lower() in text:
                    dependencies.append(
                        {
                            "depends_on_task_id": task["id"],
                            "depends_on_title": task["title"],
                            "confidence": 0.6,
                            "reasoning": f"Task mentions '{task['title']}' with dependency keyword",
                        }
                    )

        return dependencies

    def _store_suggestion(
        self,
        suggestion_type: str,
        title: str,
        description: str,
        confidence: float,
        suggestion_data: dict,
        project_id: Optional[str] = None,
        task_id: Optional[str] = None,
        sprint_id: Optional[str] = None,
    ):
        """Store AI suggestion in database"""
        try:
            data = {
                "type": suggestion_type,
                "title": title,
                "description": description,
                "confidence": confidence,
                "suggestion_data": suggestion_data,
                "project_id": project_id,
                "task_id": task_id,
                "sprint_id": sprint_id,
                "model_used": "heuristic-v1",  # Will be actual model name later
            }

            self.client.table("archon_ai_suggestions").insert(data).execute()
            logger.info(f"AI suggestion stored: type={suggestion_type} confidence={confidence}")

        except Exception as e:
            logger.warning(f"Failed to store AI suggestion: {e}")
