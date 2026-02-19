"""
AI API - Intelligent features for task estimation and sprint planning

Handles:
- Task estimation (story points, duration)
- Sprint planning recommendations
- Dependency detection
- Capacity warnings
"""

import logging
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_permission
from ..services.ai_service import AIService
from ..services.ai_learning_service import AILearningService
from ..services.ai.provider_factory import AIProviderFactory
from ..services.projects.task_service import TaskService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class EstimateTaskRequest(BaseModel):
    task_id: str
    title: str
    description: str


class PlanSprintRequest(BaseModel):
    sprint_capacity_hours: int
    current_velocity: float | None = None


class SuggestSetupRequest(BaseModel):
    title: str
    description: str = ""


class SuggestionFeedbackRequest(BaseModel):
    suggestion_type: str = "project_setup"
    context: dict = {}
    suggestion_content: dict = {}
    confidence_at_suggestion: float = 0.0
    user_response: str      # canonical: "accepted_all" | "accepted_with_modifications" | "rejected"
                            # also accepted: "accepted" (→ accepted_all) | "modified" (→ accepted_with_modifications)
    items_suggested: int = 0
    items_kept: int = 0
    items_removed: list[dict] = []
    items_added: list[dict] = []
    items_modified: list[dict] = []
    modifications: dict = {}   # free-form modifications dict from frontend
    project_id: str | None = None
    suggestion_id: str | None = None


# ── Task Estimation ──────────────────────────────────────────────

@router.post("/tasks/{task_id}/estimate")
async def estimate_task(
    task_id: str,
    project_id: str,  # Query parameter for permission check
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("task", "update")),
) -> dict[str, Any]:
    """
    Get AI estimation for a task (story points, duration, priority).

    Requires: task:update permission
    """
    try:
        # Get task details
        task_service = TaskService()
        success, result = task_service.get_task(task_id)

        if not success:
            raise HTTPException(status_code=404, detail="Task not found")

        task = result["task"]

        # Get AI estimation
        ai_service = AIService()
        estimation = await ai_service.estimate_task(
            task_id=task_id,
            title=task["title"],
            description=task.get("description", ""),
            project_context=None,
        )

        return {
            "task_id": task_id,
            "estimation": estimation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to estimate task {task_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Sprint Planning ──────────────────────────────────────────────

@router.post("/projects/{project_id}/plan-sprint")
async def plan_sprint(
    project_id: str,
    request: PlanSprintRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("sprint", "create")),
) -> dict[str, Any]:
    """
    Get AI recommendations for next sprint planning.

    Requires: sprint:create permission
    """
    try:
        ai_service = AIService()
        plan = await ai_service.plan_sprint(
            project_id=project_id,
            sprint_capacity_hours=request.sprint_capacity_hours,
            current_velocity=request.current_velocity,
        )

        return {
            "project_id": project_id,
            "plan": plan,
        }

    except Exception as e:
        logger.error(f"Failed to plan sprint for project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Dependency Detection ─────────────────────────────────────────

@router.post("/tasks/{task_id}/detect-dependencies")
async def detect_dependencies(
    task_id: str,
    project_id: str,  # Query parameter for permission check
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("task", "read")),
) -> dict[str, Any]:
    """
    Detect implicit dependencies from task description.

    Requires: task:read permission
    """
    try:
        # Get task details
        task_service = TaskService()
        success, task_result = task_service.get_task(task_id)

        if not success:
            raise HTTPException(status_code=404, detail="Task not found")

        task = task_result["task"]

        # Get all tasks in project
        success, tasks_result = task_service.list_tasks(project_id=project_id)
        all_tasks = tasks_result.get("tasks", []) if success else []

        # Detect dependencies
        ai_service = AIService()
        dependencies = await ai_service.detect_dependencies(
            task_id=task_id,
            title=task["title"],
            description=task.get("description", ""),
            all_tasks=all_tasks,
        )

        return {
            "task_id": task_id,
            "dependencies": dependencies,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to detect dependencies for task {task_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Get AI Suggestions ───────────────────────────────────────────

@router.get("/suggestions")
async def get_ai_suggestions(
    project_id: str | None = None,
    task_id: str | None = None,
    pending_only: bool = True,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Get AI suggestions for project/task.

    Optional permission check based on project_id.
    """
    try:
        ai_service = AIService()

        query = ai_service.client.table("archon_ai_suggestions").select("*")

        if project_id:
            query = query.eq("project_id", project_id)

        if task_id:
            query = query.eq("task_id", task_id)

        if pending_only:
            query = query.is_("accepted", "null")

        query = query.order("created_at", desc=True).limit(50)

        response = query.execute()
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get AI suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Accept/Reject Suggestion ─────────────────────────────────────

@router.put("/suggestions/{suggestion_id}/accept")
async def accept_suggestion(
    suggestion_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """
    Accept an AI suggestion and apply it.

    Requires: Authentication
    """
    try:
        ai_service = AIService()

        # Update suggestion status
        response = (
            ai_service.client.table("archon_ai_suggestions")
            .update({"accepted": True, "accepted_by": user_id})
            .eq("id", suggestion_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Suggestion not found")

        return {"message": "Suggestion accepted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to accept suggestion {suggestion_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Get Available AI Providers ──────────────────────────────────

@router.get("/providers")
async def get_ai_providers() -> list[dict[str, Any]]:
    """
    Get list of available AI providers and their status.

    No authentication required (read-only).
    """
    try:
        providers = AIProviderFactory.get_available_providers()
        return providers

    except Exception as e:
        logger.error(f"Failed to get AI providers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════
# AI SELF-LEARNING — Phase 3 Endpoints
# ════════════════════════════════════════════════════════════════


# ── Magic Moment: Suggest full project setup ─────────────────────

@router.post("/projects/{project_id}/suggest-setup")
async def suggest_project_setup(
    project_id: str,
    request: SuggestSetupRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("project", "read")),
) -> dict[str, Any]:
    """
    The "Magic Moment" — called when a project is created.
    Analyzes the project description and returns suggested tasks,
    phases, duration estimates, and team assignment recommendations.

    If description is missing or too short, returns needs_description=true
    prompting the frontend to ask the user for more detail.

    Requires: project:read permission
    """
    try:
        learning_service = AILearningService()
        result = await learning_service.generate_tasks_from_description(
            project_id=project_id,
            title=request.title,
            description=request.description,
        )
        return result

    except Exception as e:
        logger.error(f"suggest_project_setup failed for project={project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Project Templates ────────────────────────────────────────────

@router.get("/project-templates")
async def get_project_templates(
    category: str | None = None,
    min_confidence: float = 0.0,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Return all learned project templates, optionally filtered by category.
    Templates are ordered by sample_size (most-learned first).

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        query = (
            learning_service.client.table("ai_project_templates")
            .select("*")
            .gte("confidence", min_confidence)
            .order("sample_size", desc=True)
        )

        if category:
            query = query.eq("category", category)

        response = query.execute()
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get project templates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project-templates/{template_id}/blueprints")
async def get_template_blueprints(
    template_id: str,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Return all task blueprints for a specific project template.
    Ordered by frequency (most common tasks first).

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        blueprints = learning_service.get_task_blueprints(template_id)
        return blueprints

    except Exception as e:
        logger.error(f"Failed to get blueprints for template={template_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Duration Estimates ───────────────────────────────────────────

@router.get("/duration-estimates/{task_type}")
async def get_duration_estimate(
    task_type: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Return the learned duration estimate for a specific task type.
    Includes global average, per-person breakdown, and complexity tiers.

    Returns 404 if no data exists yet for this task type.
    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        estimate = learning_service.get_duration_estimate(task_type)

        if not estimate:
            raise HTTPException(
                status_code=404,
                detail=f"No duration estimate available for task_type='{task_type}'. "
                       "Complete more tasks of this type to build estimates.",
            )

        return estimate

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get duration estimate for {task_type}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Team Intelligence ────────────────────────────────────────────

@router.get("/team-intelligence/{person_id}")
async def get_team_member_profile(
    person_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Return the AI intelligence profile for a team member.
    Includes skills, capacity, velocity, and quality trends.

    Returns 404 if no profile exists yet.
    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        profile = learning_service.get_team_member_profile(person_id)

        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"No AI profile found for person_id='{person_id}'. "
                       "Profile is built automatically as tasks are completed.",
            )

        return profile

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get team profile for person={person_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team-intelligence")
async def get_all_team_profiles(
    min_confidence: float = 0.0,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Return AI intelligence profiles for all team members.
    Ordered by data_points (most-observed members first).

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        response = (
            learning_service.client.table("ai_team_intelligence")
            .select("*")
            .gte("confidence", min_confidence)
            .order("data_points", desc=True)
            .execute()
        )
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get all team profiles: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/best-assignee/{task_type}")
async def get_best_assignee(
    task_type: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Return the best-suited team member for a given task type,
    based on skills, past performance, and approval rates.

    Returns null if no suitable match found.
    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        best = learning_service.get_best_assignee(task_type)
        return {"task_type": task_type, "recommendation": best}

    except Exception as e:
        logger.error(f"Failed to get best assignee for {task_type}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Quality Patterns ─────────────────────────────────────────────

@router.get("/quality-patterns")
async def get_quality_patterns(
    task_type: str | None = None,
    min_rejection_rate: float = 0.0,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Return learned quality patterns — why tasks get rejected and how to prevent it.
    Optionally filter by task_type or minimum rejection rate.

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()

        query = (
            learning_service.client.table("ai_quality_patterns")
            .select("*")
            .gte("rejection_rate", min_rejection_rate)
            .order("rejection_rate", desc=True)
        )

        if task_type:
            query = query.eq("task_type", task_type)

        response = query.execute()
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get quality patterns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality-patterns/{task_type}/tips")
async def get_quality_tips(
    task_type: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Return prevention tips for a specific task type.
    Used to show inline suggestions when a task is created.

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        tips = learning_service.get_quality_tips(task_type)
        return {"task_type": task_type, "tips": tips}

    except Exception as e:
        logger.error(f"Failed to get quality tips for {task_type}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Suggestion Feedback (Learning Loop) ──────────────────────────

@router.post("/suggestions/{suggestion_id}/feedback")
async def record_suggestion_feedback(
    suggestion_id: str,
    request: SuggestionFeedbackRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Record what the user did with an AI suggestion — the richest learning signal.
    Every modification (removed/added/changed item) teaches the AI to improve.

    Records are stored in ai_feedback_loop and learnings are applied asynchronously.

    Requires: Authentication
    """
    # Normalise shorthand values from frontend
    _response_aliases = {
        "accepted": "accepted_all",
        "modified": "accepted_with_modifications",
    }
    normalised_response = _response_aliases.get(request.user_response, request.user_response)

    valid_responses = {"accepted_all", "accepted_with_modifications", "rejected"}
    if normalised_response not in valid_responses:
        raise HTTPException(
            status_code=422,
            detail=f"user_response must be one of: {sorted(valid_responses)} (or shorthand: accepted, modified)",
        )

    try:
        learning_service = AILearningService()
        feedback_id = learning_service.record_suggestion_feedback(
            suggestion_id=suggestion_id,
            project_id=request.project_id,
            suggestion_type=request.suggestion_type,
            context=request.context,
            suggestion_content=request.suggestion_content,
            confidence_at_suggestion=request.confidence_at_suggestion,
            user_response=normalised_response,
            responded_by=user_id,
            items_suggested=request.items_suggested,
            items_kept=request.items_kept,
            items_removed=request.items_removed,
            items_added=request.items_added,
            items_modified=request.items_modified,
        )

        # Trigger observation processing in the background so the learnings
        # are applied without blocking the response
        background_tasks.add_task(_run_observation_processing, batch_size=20)

        return {
            "feedback_id": feedback_id,
            "accuracy_score": round(
                (request.items_kept / request.items_suggested * 100)
                if request.items_suggested > 0 else 0,
                1,
            ),
            "message": "Feedback recorded. AI will improve based on your changes.",
        }

    except Exception as e:
        logger.error(f"Failed to record feedback for suggestion={suggestion_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Observation Processing ───────────────────────────────────────

@router.post("/learn")
async def trigger_learning(
    background_tasks: BackgroundTasks,
    batch_size: int = 50,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("project", "read")),
) -> dict[str, Any]:
    """
    Trigger processing of pending ai_observations.
    Updates all knowledge stores (duration, team profiles, quality patterns, templates).

    Runs in the background — returns immediately with pending count.
    Requires: project:read permission
    """
    try:
        learning_service = AILearningService()
        pending = learning_service.get_pending_observation_count()

        if pending == 0:
            return {"pending": 0, "message": "No pending observations to process."}

        background_tasks.add_task(_run_observation_processing, batch_size)

        return {
            "pending": pending,
            "batch_size": batch_size,
            "message": f"Processing up to {batch_size} of {pending} pending observations in the background.",
        }

    except Exception as e:
        logger.error(f"Failed to trigger learning: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learn/status")
async def get_learning_status(
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Return the current state of the AI learning system:
    - Pending observations count
    - Knowledge store sizes
    - Model accuracy summary

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        pending = learning_service.get_pending_observation_count()

        # Count knowledge store sizes
        def count_table(table: str) -> int:
            try:
                r = learning_service.client.table(table).select("id", count="exact").execute()
                return r.count or 0
            except Exception:
                return 0

        return {
            "pending_observations": pending,
            "knowledge_stores": {
                "project_templates": count_table("ai_project_templates"),
                "task_blueprints": count_table("ai_task_blueprints"),
                "dependency_patterns": count_table("ai_dependency_patterns"),
                "duration_estimates": count_table("ai_duration_estimates"),
                "team_profiles": count_table("ai_team_intelligence"),
                "quality_patterns": count_table("ai_quality_patterns"),
                "feedback_records": count_table("ai_feedback_loop"),
                "total_observations": count_table("ai_observations"),
            },
        }

    except Exception as e:
        logger.error(f"Failed to get learning status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Full Rebuild (Admin) ─────────────────────────────────────────

@router.post("/rebuild")
async def full_knowledge_rebuild(
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_permission("settings", "update")),
) -> dict[str, Any]:
    """
    Rebuild ALL AI knowledge stores from historical project data.
    This is a heavy operation — runs in the background.

    Use this after importing historical data or resetting the AI.
    Requires: settings:update permission (admin/owner only)
    """
    try:
        background_tasks.add_task(_run_full_rebuild)
        return {
            "message": "Full AI knowledge rebuild started in background. "
                       "This may take a few minutes depending on data volume.",
        }

    except Exception as e:
        logger.error(f"Failed to start full rebuild: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Model Accuracy ───────────────────────────────────────────────

@router.get("/accuracy")
async def get_model_accuracy(
    period_type: str = "monthly",
    limit: int = 12,
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Return AI suggestion accuracy over time.
    Shows whether the AI is getting better with each period.

    Requires: Authentication
    """
    try:
        learning_service = AILearningService()
        response = (
            learning_service.client.table("ai_model_accuracy")
            .select("*")
            .eq("period_type", period_type)
            .order("period_start", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get model accuracy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Background task helpers (not routes) ────────────────────────

def _run_observation_processing(batch_size: int = 50) -> None:
    """Background task: process pending observations."""
    try:
        learning_service = AILearningService()
        result = learning_service.process_observations(batch_size=batch_size)
        logger.info(f"Background observation processing complete | {result}")
    except Exception as e:
        logger.error(f"Background observation processing failed: {e}", exc_info=True)


def _run_full_rebuild() -> None:
    """Background task: full knowledge store rebuild."""
    try:
        learning_service = AILearningService()
        result = learning_service.full_rebuild()
        logger.info(f"Background full rebuild complete | {result}")
    except Exception as e:
        logger.error(f"Background full rebuild failed: {e}", exc_info=True)
