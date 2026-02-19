"""
AI Learning Service — Main Orchestrator

The public entry point for the AI self-learning engine.
Exposes methods that the API layer and background tasks call.

Responsibilities:
  1. Process pending observations (event-driven learning)
  2. Trigger full data rebuilds (on-demand or scheduled)
  3. Query the knowledge stores for suggestions
  4. Record feedback loop entries when users respond to suggestions
  5. Compute and store model accuracy metrics
"""

import json
import logging
from typing import Any, Optional

from ..config.database import get_supabase_client
from .ai.observation_processor import AIObservationProcessor
from .ai.pattern_extractor import AIPatternExtractorService
from .ai.team_intelligence import AITeamIntelligenceService
from .ai.quality_patterns import AIQualityPatternService
from .ai.provider_factory import AIProviderFactory

logger = logging.getLogger(__name__)


class AILearningService:
    def __init__(self, supabase_client=None, ai_provider: Optional[str] = None):
        self.client = supabase_client or get_supabase_client()
        self.ai_provider = AIProviderFactory.get_provider(provider_name=ai_provider)

        # All sub-services share the same Supabase client
        self.observation_processor = AIObservationProcessor(self.client)
        self.pattern_extractor = AIPatternExtractorService(self.client)
        self.team_intelligence = AITeamIntelligenceService(self.client)
        self.quality_patterns = AIQualityPatternService(self.client)

    # ── Observation Processing ───────────────────────────────────────────────

    def process_observations(self, batch_size: int = 50) -> dict:
        """
        Process the next batch of unprocessed ai_observations.
        Call this from a background task or a POST /api/ai/learn endpoint.

        Returns: {processed: int, failed: int, total: int}
        """
        return self.observation_processor.process_pending(batch_size=batch_size)

    def get_pending_observation_count(self) -> int:
        """How many observations are waiting to be processed."""
        return self.observation_processor.get_pending_count()

    # ── Knowledge Store Queries ──────────────────────────────────────────────

    def get_project_template(self, category: str) -> Optional[dict]:
        """
        Return the best matching project template for a given category.
        Returns None if no template exists or confidence is too low.
        """
        try:
            response = (
                self.client.table("ai_project_templates")
                .select("*")
                .eq("category", category)
                .gte("confidence", 0.30)          # Only suggest when confident enough
                .order("sample_size", desc=True)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None

        except Exception as e:
            logger.warning(f"Failed to get project template for category={category}: {e}")
            return None

    def get_task_blueprints(self, template_id: str) -> list[dict]:
        """Return all task blueprints for a given project template."""
        try:
            response = (
                self.client.table("ai_task_blueprints")
                .select("*")
                .eq("template_id", template_id)
                .order("frequency", desc=True)
                .execute()
            )
            return response.data or []

        except Exception as e:
            logger.warning(f"Failed to get blueprints for template_id={template_id}: {e}")
            return []

    def get_duration_estimate(self, task_type: str) -> Optional[dict]:
        """
        Return learned duration estimate for a task type.
        Returns None if no data or confidence too low.
        """
        from .ai.quality_patterns import TASK_TYPE_CATEGORY_MAP
        category = TASK_TYPE_CATEGORY_MAP.get(task_type, "general")

        try:
            response = (
                self.client.table("ai_duration_estimates")
                .select("*")
                .eq("task_type", task_type)
                .eq("category", category)
                .limit(1)
                .execute()
            )

            if not response.data:
                return None

            estimate = response.data[0]
            if (estimate.get("confidence") or 0) < 0.15:
                return None  # Too few data points

            return estimate

        except Exception as e:
            logger.warning(f"Failed to get duration estimate for {task_type}: {e}")
            return None

    def get_team_member_profile(self, person_id: str) -> Optional[dict]:
        """Return AI intelligence profile for a team member."""
        return self.team_intelligence.get_profile(person_id)

    def get_best_assignee(self, task_type: str) -> Optional[dict]:
        """Return the best-suited team member for a given task type."""
        return self.team_intelligence.get_best_assignee_for_task(task_type)

    def get_quality_tips(self, task_type: str) -> list[str]:
        """Return prevention tips for a task type based on past rejection patterns."""
        return self.quality_patterns.get_prevention_tips(task_type)

    def get_high_rejection_patterns(self) -> list[dict]:
        """Return all task types with a high rejection rate."""
        return self.quality_patterns.get_high_rejection_types()

    def suggest_project_setup(self, project_id: str) -> dict:
        """
        The "Magic Moment" — generate a full project setup suggestion.
        Reads project title/description, finds matching template,
        and returns suggested tasks, phases, durations, and team assignments.

        Returns a suggestion dict (stored in archon_ai_suggestions by the caller).
        """
        try:
            # Fetch project details
            response = (
                self.client.table("archon_projects")
                .select("id, title, description")
                .eq("id", project_id)
                .limit(1)
                .execute()
            )

            if not response.data:
                return {"error": "Project not found", "confidence": 0.0}

            project = response.data[0]
            title = project.get("title", "")
            description = project.get("description", "") or ""

            # Classify the project
            from .ai.pattern_extractor import _classify_project_category
            category = _classify_project_category(title, description)

            # Find matching template
            template = self.get_project_template(category)

            if not template:
                return self._cold_start_suggestion(category, project)

            # Build suggestion from template
            blueprints = self.get_task_blueprints(template["id"])

            return {
                "confidence": template.get("confidence", 0.0),
                "template_id": template["id"],
                "template_name": template["name"],
                "category": category,
                "sample_size": template.get("sample_size", 0),
                "typical_duration_days": {
                    "min": template.get("typical_duration_days_min"),
                    "max": template.get("typical_duration_days_max"),
                },
                "typical_task_count": {
                    "min": template.get("typical_task_count_min"),
                    "max": template.get("typical_task_count_max"),
                },
                "risk_factors": template.get("risk_factors") or [],
                "suggested_tasks": self._build_task_suggestions(blueprints),
                "phases": template.get("typical_phases") or [],
            }

        except Exception as e:
            logger.error(f"suggest_project_setup failed for project={project_id}: {e}", exc_info=True)
            return {"error": str(e), "confidence": 0.0}

    # ── Feedback Loop ────────────────────────────────────────────────────────

    def record_suggestion_feedback(
        self,
        suggestion_id: Optional[str],
        project_id: Optional[str],
        suggestion_type: str,
        context: dict,
        suggestion_content: dict,
        confidence_at_suggestion: float,
        user_response: str,           # "accepted_all" | "accepted_with_modifications" | "rejected"
        responded_by: Optional[str],
        items_suggested: int,
        items_kept: int,
        items_removed: list[dict],
        items_added: list[dict],
        items_modified: list[dict],
    ) -> Optional[str]:
        """
        Record what the user did with an AI suggestion.
        This is the richest source of learning — every modification teaches the AI something.
        Returns the feedback_loop record ID.
        """
        accuracy_score = (items_kept / items_suggested * 100) if items_suggested > 0 else 0.0

        # Extract learnings from what the user changed
        learnings = self._extract_learnings_from_feedback(
            suggestion_type=suggestion_type,
            items_removed=items_removed,
            items_added=items_added,
            items_modified=items_modified,
            context=context,
        )

        try:
            result = self.client.table("ai_feedback_loop").insert({
                "suggestion_type": suggestion_type,
                "context": context,
                "suggestion_content": suggestion_content,
                "confidence_at_suggestion": confidence_at_suggestion,
                "user_response": user_response,
                "responded_by": responded_by,
                "items_suggested": items_suggested,
                "items_kept": items_kept,
                "items_removed": items_removed,
                "items_added": items_added,
                "items_modified": items_modified,
                "accuracy_score": round(accuracy_score, 2),
                "learnings_extracted": learnings,
                "suggestion_id": suggestion_id,
                "project_id": project_id,
            }).execute()

            feedback_id = result.data[0]["id"] if result.data else None

            logger.info(
                f"Feedback recorded | type={suggestion_type} "
                f"response={user_response} accuracy={accuracy_score:.1f}%"
            )

            # Apply learnings to knowledge stores
            if learnings:
                self._apply_learnings(learnings, context)

            return feedback_id

        except Exception as e:
            logger.error(f"Failed to record suggestion feedback: {e}", exc_info=True)
            return None

    # ── Model Accuracy ───────────────────────────────────────────────────────

    def compute_monthly_accuracy(self, year: int, month: int) -> dict:
        """
        Compute and store monthly accuracy metrics from ai_feedback_loop.
        Call at end of month or on-demand.
        Returns summary of metrics computed.
        """
        from datetime import datetime
        import calendar

        period_start = datetime(year, month, 1, tzinfo=None)
        last_day = calendar.monthrange(year, month)[1]
        period_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=None)
        period_label = f"{year}-{str(month).zfill(2)}"

        try:
            response = (
                self.client.table("ai_feedback_loop")
                .select("suggestion_type, user_response, accuracy_score, confidence_at_suggestion")
                .gte("created_at", period_start.isoformat())
                .lte("created_at", period_end.isoformat())
                .execute()
            )

            records = response.data or []
            if not records:
                return {"period": period_label, "total": 0}

            # Group by suggestion_type
            by_type: dict[str, list[dict]] = {}
            for r in records:
                st = r.get("suggestion_type", "unknown")
                by_type.setdefault(st, []).append(r)

            metrics_stored = 0
            for suggestion_type, type_records in by_type.items():
                total = len(type_records)
                accepted_all = sum(1 for r in type_records if r["user_response"] == "accepted_all")
                modified = sum(1 for r in type_records if r["user_response"] == "accepted_with_modifications")
                rejected = sum(1 for r in type_records if r["user_response"] == "rejected")

                scores = [r.get("accuracy_score") for r in type_records if r.get("accuracy_score") is not None]
                avg_score = sum(scores) / len(scores) if scores else 0.0

                confs = [r.get("confidence_at_suggestion") for r in type_records if r.get("confidence_at_suggestion") is not None]
                avg_conf = sum(confs) / len(confs) if confs else 0.0

                self.client.table("ai_model_accuracy").upsert({
                    "period_type": "monthly",
                    "period_label": period_label,
                    "period_start": period_start.isoformat(),
                    "period_end": period_end.isoformat(),
                    "suggestion_type": suggestion_type,
                    "total_suggestions": total,
                    "accepted_all_count": accepted_all,
                    "accepted_modified_count": modified,
                    "rejected_count": rejected,
                    "avg_accuracy_score": round(avg_score, 2),
                    "avg_confidence_at_suggestion": round(avg_conf, 2),
                }, on_conflict="period_type,period_label,suggestion_type").execute()

                metrics_stored += 1

            logger.info(f"Monthly accuracy computed | period={period_label} types={metrics_stored}")
            return {"period": period_label, "total_records": len(records), "types_computed": metrics_stored}

        except Exception as e:
            logger.error(f"Failed to compute monthly accuracy for {period_label}: {e}", exc_info=True)
            return {"period": period_label, "error": str(e)}

    # ── Full Rebuild (Admin/Init) ─────────────────────────────────────────────

    def full_rebuild(self) -> dict:
        """
        Rebuild ALL knowledge stores from historical data.
        Use this for initial setup or after bulk data imports.
        WARNING: This is a heavy operation — runs synchronously.
        """
        logger.info("Starting full AI knowledge store rebuild")
        results: dict[str, Any] = {}

        # 1. Rebuild duration estimates from all completed tasks
        results["duration_estimates"] = self.pattern_extractor.rebuild_all_duration_estimates()

        # 2. Rebuild team intelligence from all completed tasks
        results["team_intelligence"] = self.team_intelligence.refresh_all_profiles()

        # 3. Process any pending observations
        results["observations"] = self.observation_processor.process_pending(batch_size=500)

        logger.info(f"Full rebuild complete | summary={results}")
        return results

    # ── Project Description → Task Generation ────────────────────────────────

    async def generate_tasks_from_description(
        self,
        project_id: str,
        title: str,
        description: str,
    ) -> dict:
        """
        The "Magic Moment" entry point called when a project is created.

        - If description is empty → return a prompt asking for one.
        - If description is short (<20 chars) → ask for more detail.
        - If description is good → use AI to generate task suggestions,
          enriched with any matching template from the knowledge store.

        Returns a dict with:
          {
            needs_description: bool,     # True = ask user for description first
            confidence: float,
            tasks: [...],                # Suggested task list
            phases: [...],
            message: str,               # Human-readable explanation
          }
        """
        # Guard: no description provided
        if not description or len(description.strip()) < 20:
            return {
                "needs_description": True,
                "confidence": 0.0,
                "tasks": [],
                "message": (
                    "Please provide a short description of the project "
                    "so I can suggest the right tasks for you."
                ),
            }

        # Check knowledge base for a matching template
        from .ai.pattern_extractor import _classify_project_category
        category = _classify_project_category(title, description)
        template_suggestion = self.suggest_project_setup(project_id)

        # Build AI prompt enriched with template context
        template_context = ""
        if not template_suggestion.get("cold_start") and template_suggestion.get("suggested_tasks"):
            task_titles = [t["title"] for t in template_suggestion["suggested_tasks"][:10]]
            template_context = (
                f"\n\nBased on {template_suggestion.get('sample_size', 0)} similar past projects, "
                f"typical tasks include: {', '.join(task_titles)}."
            )

        prompt = f"""You are an expert project manager. A user just created a new project.
Analyze the project description and suggest a practical task list.

Project Title: {title}
Project Description: {description}{template_context}

Generate a task list to complete this project. Return ONLY valid JSON in this exact format:
{{
  "tasks": [
    {{
      "title": "Task title (short, action-oriented)",
      "description": "What needs to be done",
      "priority": "high|medium|low",
      "estimated_days": 1,
      "phase": "Phase name (e.g. Research, Development, Review)",
      "task_type": "short_type_slug (e.g. blog_post, api_endpoint, design_mockup)"
    }}
  ],
  "phases": ["Phase 1", "Phase 2"],
  "total_estimated_days": 10,
  "reasoning": "Brief explanation of why these tasks were chosen"
}}

Rules:
- Suggest 5 to 15 tasks (realistic scope)
- Group tasks into 2-4 phases
- Keep task titles concise and action-oriented (start with a verb)
- Estimate days realistically (1 day = 8 working hours)
- Match task types to what is being built"""

        try:
            raw = (await self.ai_provider.generate_text(prompt, max_tokens=2048)).strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            result = json.loads(raw)
            tasks = result.get("tasks", [])
            phases = result.get("phases", [])
            reasoning = result.get("reasoning", "")

            # Merge template suggestions to enrich confidence/agent flags
            if template_suggestion.get("suggested_tasks"):
                tasks = self._enrich_tasks_with_template(
                    tasks, template_suggestion["suggested_tasks"]
                )

            # Store the suggestion and capture its ID for the feedback loop
            confidence = min(
                0.70 + (template_suggestion.get("confidence") or 0) * 0.25,
                0.90,
            )
            # Normalise tasks: ensure assignee and task_type fields are always present
            for task in tasks:
                task.setdefault("assignee", "User")
                task.setdefault("task_type", "general")
                task.setdefault("agent_suitable", False)

            suggestion_id = self._store_project_setup_suggestion(
                project_id=project_id,
                tasks=tasks,
                phases=phases,
                confidence=confidence,
                reasoning=reasoning,
            )

            logger.info(
                f"Task generation complete | project={project_id} "
                f"tasks={len(tasks)} confidence={confidence:.2f}"
            )

            return {
                "project_id": project_id,
                "suggestion_id": suggestion_id,
                "needs_description": False,
                "confidence": round(confidence, 2),
                "cold_start": False,
                "template_used": template_suggestion.get("template_name"),
                "suggested_tasks": tasks,
                "phases": phases,
                "total_estimated_days": result.get("total_estimated_days"),
                "message": (
                    f"I found {len(tasks)} suggested tasks based on your project description"
                    + (f" and {template_suggestion.get('sample_size', 0)} similar past projects." if not template_suggestion.get("cold_start") else ".")
                ),
            }

        except Exception as e:
            logger.warning(f"AI task generation failed, falling back to template: {e}")

            # Fallback: return template tasks if available, else cold start
            if template_suggestion.get("suggested_tasks"):
                fallback_tasks = template_suggestion["suggested_tasks"]
                for task in fallback_tasks:
                    task.setdefault("assignee", "User")
                    task.setdefault("task_type", "general")
                    task.setdefault("agent_suitable", False)
                return {
                    "project_id": project_id,
                    "suggestion_id": None,
                    "needs_description": False,
                    "cold_start": False,
                    "template_used": template_suggestion.get("template_name"),
                    "confidence": template_suggestion.get("confidence", 0.1),
                    "suggested_tasks": fallback_tasks,
                    "phases": [p.get("name") for p in (template_suggestion.get("phases") or [])],
                    "message": (
                        f"Suggested {len(fallback_tasks)} tasks "
                        f"based on {template_suggestion.get('sample_size', 0)} similar projects."
                    ),
                }

            return self._cold_start_suggestion(category, {"title": title})

    def _enrich_tasks_with_template(
        self,
        ai_tasks: list[dict],
        template_tasks: list[dict],
    ) -> list[dict]:
        """
        Merge AI-generated tasks with template knowledge.
        Adds agent_suitable, estimated_days from blueprint if AI didn't provide them.
        """
        template_by_type = {t.get("task_type"): t for t in template_tasks if t.get("task_type")}

        for task in ai_tasks:
            task_type = task.get("task_type")
            if task_type and task_type in template_by_type:
                bp = template_by_type[task_type]
                # Fill in blueprint data if AI left gaps
                if not task.get("estimated_days") and bp.get("estimated_days"):
                    task["estimated_days"] = bp["estimated_days"]
                if bp.get("agent_suitable"):
                    task["agent_suitable"] = True
                    task["agent_confidence"] = bp.get("agent_confidence")

        return ai_tasks

    def _store_project_setup_suggestion(
        self,
        project_id: str,
        tasks: list[dict],
        phases: list[str],
        confidence: float,
        reasoning: str,
    ) -> Optional[str]:
        """
        Persist the project setup suggestion to archon_ai_suggestions.
        Returns the suggestion ID so it can be referenced in feedback.
        """
        try:
            result = self.client.table("archon_ai_suggestions").insert({
                "project_id": project_id,
                "type": "project_setup",
                "title": f"Suggested {len(tasks)} tasks for your project",
                "description": reasoning or "Task suggestions based on your project description.",
                "confidence": round(confidence, 2),
                "suggestion_data": {
                    "tasks": tasks,
                    "phases": phases,
                    "task_count": len(tasks),
                },
                "model_used": self.ai_provider.get_model_name(),
            }).execute()

            return result.data[0]["id"] if result.data else None

        except Exception as e:
            logger.warning(f"Failed to store project setup suggestion: {e}")
            return None

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _cold_start_suggestion(self, category: str, project: dict) -> dict:
        """
        Return a cold-start suggestion when no template exists.
        Uses generic best practices for the category.
        """
        COLD_START_PHASES: dict[str, list[str]] = {
            "marketing": ["Research", "Content Creation", "Design", "Review & Approval", "Launch"],
            "engineering": ["Planning", "Design", "Implementation", "Testing", "Deployment"],
            "design": ["Discovery", "Concept", "Design", "Review", "Delivery"],
            "research": ["Scoping", "Data Collection", "Analysis", "Synthesis", "Reporting"],
            "general": ["Planning", "Execution", "Review", "Delivery"],
        }

        phases = COLD_START_PHASES.get(category, COLD_START_PHASES["general"])

        return {
            "project_id": project.get("id"),
            "suggestion_id": None,
            "needs_description": False,
            "confidence": 0.0,
            "cold_start": True,
            "template_used": None,
            "category": category,
            "sample_size": 0,
            "message": (
                f"This is the first '{category}' project. "
                "I'll learn your patterns after it completes."
            ),
            "phases": phases,
            "suggested_tasks": [],
        }

    def _build_task_suggestions(self, blueprints: list[dict]) -> list[dict]:
        """Convert task blueprints to suggestion format for the frontend."""
        suggestions = []
        for bp in blueprints:
            if (bp.get("confidence") or 0) < 0.10:
                continue  # Skip very uncertain blueprints

            suggestions.append({
                "task_type": bp.get("task_type"),
                "title": bp.get("task_title"),
                "phase": bp.get("phase"),
                "priority": bp.get("priority", "medium"),
                "estimated_days": bp.get("avg_duration_days"),
                "frequency": bp.get("frequency"),
                "agent_suitable": bp.get("agent_suitable", False),
                "agent_confidence": bp.get("agent_confidence"),
                "suggested_subtasks": bp.get("suggested_subtasks") or [],
                "success_criteria": bp.get("success_criteria"),
                "confidence": bp.get("confidence"),
            })

        return suggestions

    def _extract_learnings_from_feedback(
        self,
        suggestion_type: str,
        items_removed: list[dict],
        items_added: list[dict],
        items_modified: list[dict],
        context: dict,
    ) -> list[dict]:
        """Extract structured learnings from user modifications."""
        learnings = []

        for item in items_removed:
            learnings.append({
                "type": "remove_from_template",
                "item": item.get("item_title"),
                "reason": item.get("reason"),
                "context_category": context.get("category"),
            })

        for item in items_added:
            learnings.append({
                "type": "add_to_template",
                "item": item.get("item_title"),
                "context_category": context.get("category"),
            })

        for item in items_modified:
            learnings.append({
                "type": "modify_suggestion",
                "item": item.get("item_title"),
                "field": item.get("field_changed"),
                "original": item.get("original_value"),
                "changed_to": item.get("new_value"),
                "context_category": context.get("category"),
            })

        return learnings

    def _apply_learnings(self, learnings: list[dict], context: dict) -> None:
        """
        Apply extracted learnings back to the knowledge stores.
        Currently logs learnings — full template mutation logic is Phase 3.
        """
        for learning in learnings:
            logger.info(
                f"Learning recorded | type={learning.get('type')} "
                f"item={learning.get('item')} category={learning.get('context_category')}"
            )
