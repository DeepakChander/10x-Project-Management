"""
AI Pattern Extractor Service

Extracts patterns from completed projects and historical task data.
Updates the following knowledge stores:
  - ai_project_templates   (what projects look like)
  - ai_task_blueprints     (what tasks are needed)
  - ai_dependency_patterns (what blocks what)
  - ai_duration_estimates  (how long things take)
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from ...config.database import get_supabase_client
from .quality_patterns import TASK_TYPE_CATEGORY_MAP

logger = logging.getLogger(__name__)

# Confidence milestones by sample_size
# 1 project → 0.10 (cold start), 3 → 0.35, 6 → 0.60, 11+ → 0.80+
def _confidence_from_samples(sample_size: int) -> float:
    return min(round((sample_size / 12.0) * 0.95, 2), 0.95)


def _parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO timestamp string to datetime, handling timezone."""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
    except Exception:
        return None


def _duration_days(started_at: Optional[str], completed_at: Optional[str]) -> Optional[float]:
    """Calculate working duration in days between two ISO timestamps."""
    start = _parse_iso(started_at)
    end = _parse_iso(completed_at)
    if not start or not end or end <= start:
        return None
    return (end - start).total_seconds() / 86400.0


# Simple keyword classifier for project categories
_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "marketing": ["marketing", "campaign", "content", "social", "blog", "brand", "launch", "email"],
    "engineering": ["app", "software", "api", "backend", "frontend", "feature", "bug", "deploy", "refactor"],
    "design": ["design", "ui", "ux", "brand", "visual", "mockup", "prototype", "figma"],
    "research": ["research", "analysis", "survey", "study", "report", "audit", "competitive"],
    "management": ["planning", "roadmap", "sprint", "retrospective", "kickoff", "stakeholder"],
}


def _classify_project_category(title: str, description: str = "") -> str:
    text = f"{title} {description}".lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return category
    return "general"


def _infer_category(task_type: str) -> str:
    return TASK_TYPE_CATEGORY_MAP.get(task_type, "general")


class AIPatternExtractorService:
    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    # ── Duration Estimates ───────────────────────────────────────────────────

    def update_duration_estimate(self, event_data: dict) -> None:
        """
        Update the ai_duration_estimates record for a task type
        using data from a single completed task observation.
        """
        task_type = event_data.get("task_type") or "general"
        duration_days = event_data.get("duration_actual_days")
        assignee = event_data.get("assignee") or "unknown"

        if not duration_days or duration_days <= 0 or duration_days > 365:
            logger.debug(f"Skipping duration update: invalid duration={duration_days}")
            return

        category = _infer_category(task_type)

        try:
            response = (
                self.client.table("ai_duration_estimates")
                .select("*")
                .eq("task_type", task_type)
                .eq("category", category)
                .limit(1)
                .execute()
            )

            if response.data:
                self._update_duration_stats(response.data[0], duration_days, assignee)
            else:
                self._create_duration_estimate(task_type, category, duration_days, assignee)

        except Exception as e:
            logger.warning(f"Failed to update duration estimate for {task_type}: {e}")

    # ── Project Templates ────────────────────────────────────────────────────

    def extract_project_template(self, project_id: str) -> Optional[str]:
        """
        Analyze a completed project and create or update a project template.
        Returns the template_id if successful, None otherwise.
        Called when a project is marked as completed.
        """
        logger.info(f"Extracting project template from project_id={project_id}")

        try:
            project = self._fetch_project(project_id)
            if not project:
                logger.warning(f"Project {project_id} not found, skipping template extraction")
                return None

            tasks = self._fetch_project_tasks(project_id)
            if not tasks:
                logger.debug(f"No tasks found for project {project_id}, skipping")
                return None

            category = _classify_project_category(
                project.get("title", ""),
                project.get("description", ""),
            )

            # Find existing template for this category or create a new one
            template = self._find_matching_template(category)

            if template:
                template_id = self._update_template(template, project, tasks)
            else:
                template_id = self._create_template(project, tasks, category)

            logger.info(
                f"Project template {'updated' if template else 'created'} "
                f"| template_id={template_id} | category={category}"
            )
            return template_id

        except Exception as e:
            logger.error(f"Failed to extract template from project {project_id}: {e}", exc_info=True)
            return None

    def rebuild_all_duration_estimates(self) -> dict:
        """
        Full rebuild of all duration estimates from historical task data.
        Useful for initial setup or after bulk imports.
        """
        logger.info("Starting full duration estimates rebuild")
        processed = 0
        skipped = 0

        try:
            response = (
                self.client.table("archon_tasks")
                .select("task_type, assignee, started_at, completed_at, story_points")
                .eq("status", "done")
                .not_.is_("started_at", "null")
                .not_.is_("completed_at", "null")
                .execute()
            )

            tasks = response.data or []

            for task in tasks:
                days = _duration_days(task.get("started_at"), task.get("completed_at"))
                if days and 0 < days < 365:
                    self.update_duration_estimate({
                        "task_type": task.get("task_type") or "general",
                        "duration_actual_days": days,
                        "assignee": task.get("assignee") or "unknown",
                    })
                    processed += 1
                else:
                    skipped += 1

            logger.info(f"Duration rebuild complete | processed={processed} skipped={skipped}")
            return {"processed": processed, "skipped": skipped}

        except Exception as e:
            logger.error(f"Duration rebuild failed: {e}", exc_info=True)
            return {"processed": 0, "skipped": 0, "error": str(e)}

    # ── Internal: Duration helpers ───────────────────────────────────────────

    def _create_duration_estimate(
        self,
        task_type: str,
        category: str,
        duration_days: float,
        assignee: str,
    ) -> None:
        """Create first duration estimate record for a new task type."""
        by_person = {assignee: {"avg_days": round(duration_days, 2), "task_count": 1}}

        self.client.table("ai_duration_estimates").insert({
            "task_type": task_type,
            "category": category,
            "global_avg_days": round(duration_days, 2),
            "global_median_days": round(duration_days, 2),
            "global_min_days": round(duration_days, 2),
            "global_max_days": round(duration_days, 2),
            "by_person": by_person,
            "sample_size": 1,
            "confidence": 0.05,  # Very low: only one data point
        }).execute()

        logger.debug(f"Created duration estimate | task_type={task_type} days={duration_days}")

    def _update_duration_stats(self, existing: dict, new_duration: float, assignee: str) -> None:
        """Update running statistics for an existing duration estimate."""
        task_type = existing.get("task_type", "?")
        category = existing.get("category", "general")
        sample_size = (existing.get("sample_size") or 0)
        new_sample_size = sample_size + 1

        # Incremental mean: avg = prev_avg + (new_val - prev_avg) / new_count
        current_avg = existing.get("global_avg_days") or new_duration
        new_avg = current_avg + (new_duration - current_avg) / new_sample_size

        current_min = existing.get("global_min_days") or new_duration
        current_max = existing.get("global_max_days") or new_duration

        # Per-person breakdown update
        by_person: dict = existing.get("by_person") or {}
        person_data = by_person.get(assignee, {"avg_days": new_duration, "task_count": 0})
        pc = person_data.get("task_count", 0)
        pa = person_data.get("avg_days", new_duration)
        person_data["task_count"] = pc + 1
        person_data["avg_days"] = round(pa + (new_duration - pa) / (pc + 1), 2)
        by_person[assignee] = person_data

        self.client.table("ai_duration_estimates").update({
            "global_avg_days": round(new_avg, 2),
            "global_min_days": round(min(current_min, new_duration), 2),
            "global_max_days": round(max(current_max, new_duration), 2),
            "by_person": by_person,
            "sample_size": new_sample_size,
            "confidence": _confidence_from_samples(new_sample_size),
        }).eq("task_type", task_type).eq("category", category).execute()

    # ── Internal: Project template helpers ──────────────────────────────────

    def _fetch_project(self, project_id: str) -> Optional[dict]:
        response = (
            self.client.table("archon_projects")
            .select("id, title, description, created_at, updated_at")
            .eq("id", project_id)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    def _fetch_project_tasks(self, project_id: str) -> list[dict]:
        response = (
            self.client.table("archon_tasks")
            .select(
                "id, title, task_type, status, priority, story_points, "
                "assignee, started_at, completed_at"
            )
            .eq("project_id", project_id)
            .or_("archived.is.null,archived.is.false")
            .execute()
        )
        return response.data or []

    def _find_matching_template(self, category: str) -> Optional[dict]:
        """Find the best-fit existing template for a given category."""
        response = (
            self.client.table("ai_project_templates")
            .select("*")
            .eq("category", category)
            .order("sample_size", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    def _create_template(self, project: dict, tasks: list[dict], category: str) -> Optional[str]:
        """Create a new project template from a completed project."""
        completed_tasks = [t for t in tasks if t.get("status") == "done"]
        task_count = len(completed_tasks)

        # Calculate project duration in days
        proj_start = _parse_iso(project.get("created_at"))
        proj_end = _parse_iso(project.get("updated_at"))
        duration_days: Optional[int] = None
        if proj_start and proj_end and proj_end > proj_start:
            duration_days = int((proj_end - proj_start).total_seconds() / 86400)

        template_data = {
            "name": f"{category.title()} Project",
            "description": f"Auto-generated from: {project.get('title', 'Unknown project')}",
            "category": category,
            "tags": [category],
            "learned_from_projects": [str(project["id"])],
            "sample_size": 1,
            "typical_task_count_min": task_count,
            "typical_task_count_max": task_count,
            "typical_duration_days_min": duration_days,
            "typical_duration_days_max": duration_days,
            "typical_phases": self._extract_phases(tasks),
            "confidence": 0.10,
        }

        result = self.client.table("ai_project_templates").insert(template_data).execute()
        if not result.data:
            return None

        template_id = result.data[0]["id"]

        # Create task blueprints from all tasks in this project
        self._create_task_blueprints(template_id, completed_tasks)

        return template_id

    def _update_template(self, template: dict, project: dict, tasks: list[dict]) -> str:
        """Update an existing template with data from another completed project."""
        template_id = template["id"]

        # Append this project to learned_from_projects (deduplicated)
        learned_from = list(template.get("learned_from_projects") or [])
        project_id_str = str(project["id"])
        if project_id_str not in learned_from:
            learned_from.append(project_id_str)

        new_sample_size = (template.get("sample_size") or 1) + 1
        completed_tasks = [t for t in tasks if t.get("status") == "done"]
        task_count = len(completed_tasks)

        current_min = template.get("typical_task_count_min") or task_count
        current_max = template.get("typical_task_count_max") or task_count

        self.client.table("ai_project_templates").update({
            "learned_from_projects": learned_from,
            "sample_size": new_sample_size,
            "typical_task_count_min": min(current_min, task_count),
            "typical_task_count_max": max(current_max, task_count),
            "confidence": _confidence_from_samples(new_sample_size),
        }).eq("id", template_id).execute()

        # Update or create task blueprints
        self._upsert_task_blueprints(template_id, completed_tasks)

        return template_id

    def _extract_phases(self, tasks: list[dict]) -> list[dict]:
        """
        Group tasks into phases. Simplified: uses task_type category as the phase name.
        Returns [{name, avg_task_count, frequency}]
        """
        phase_counts: dict[str, int] = {}
        for task in tasks:
            task_type = task.get("task_type") or "general"
            category = _infer_category(task_type)
            phase_counts[category] = phase_counts.get(category, 0) + 1

        total = len(tasks) or 1
        return [
            {
                "name": phase.title(),
                "avg_task_count": count,
                "frequency": round(count / total, 2),
            }
            for phase, count in phase_counts.items()
        ]

    def _create_task_blueprints(self, template_id: str, tasks: list[dict]) -> None:
        """Create task blueprint records from a list of tasks."""
        for task in tasks:
            task_type = task.get("task_type") or "general"
            category = _infer_category(task_type)
            duration = _duration_days(task.get("started_at"), task.get("completed_at"))

            blueprint = {
                "template_id": template_id,
                "phase": category.title(),
                "task_title": task.get("title", "Untitled Task"),
                "task_type": task_type,
                "category": category,
                "priority": task.get("priority") or "medium",
                "avg_duration_days": round(duration, 2) if duration else None,
                "frequency": 1.0,
                "sample_size": 1,
                "confidence": 0.10,
            }

            try:
                self.client.table("ai_task_blueprints").insert(blueprint).execute()
            except Exception as e:
                logger.debug(f"Blueprint insert skipped for '{task.get('title')}': {e}")

    def _upsert_task_blueprints(self, template_id: str, tasks: list[dict]) -> None:
        """Update existing blueprints or create new ones for tasks in a template."""
        for task in tasks:
            task_type = task.get("task_type") or "general"
            duration = _duration_days(task.get("started_at"), task.get("completed_at"))

            try:
                response = (
                    self.client.table("ai_task_blueprints")
                    .select("id, avg_duration_days, sample_size")
                    .eq("template_id", template_id)
                    .eq("task_type", task_type)
                    .limit(1)
                    .execute()
                )

                if response.data:
                    existing = response.data[0]
                    new_sample = (existing.get("sample_size") or 1) + 1
                    update: dict = {
                        "sample_size": new_sample,
                        "confidence": _confidence_from_samples(new_sample),
                    }

                    if duration and existing.get("avg_duration_days"):
                        old_avg = existing["avg_duration_days"]
                        update["avg_duration_days"] = round(
                            old_avg + (duration - old_avg) / new_sample, 2
                        )

                    self.client.table("ai_task_blueprints").update(update).eq("id", existing["id"]).execute()
                else:
                    # New task type not seen in this template before
                    self._create_task_blueprints(template_id, [task])

            except Exception as e:
                logger.debug(f"Blueprint upsert failed for task_type={task_type}: {e}")
