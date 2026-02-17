"""
Agent Workflow API

Handles agent task acknowledgement, acceptance, decline, and review
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id
from ..services.agent_workflow_service import AgentWorkflowService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent-workflow"])


class AcknowledgeRequest(BaseModel):
    response_time_ms: int
    message: str | None = None


class AcceptRequest(BaseModel):
    message: str | None = None
    conditions: str | None = None


class DeclineRequest(BaseModel):
    reason: str
    suggestion: str | None = None


class SubmitReviewRequest(BaseModel):
    submission_data: dict
    confidence_score: float
    flagged_items: list[str] = []
    message: str | None = None


class ApproveWorkRequest(BaseModel):
    quality_score: int
    comments: str | None = None


# ── Agent Task Acknowledgement ──────────────────────────────────

@router.post("/tasks/{task_id}/acknowledge")
async def acknowledge_task(
    task_id: str,
    request: AcknowledgeRequest,
    agent_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Agent acknowledges task receipt (auto-called within 5 seconds of assignment).
    """
    try:
        service = AgentWorkflowService()
        result = service.acknowledge_task(
            task_id=task_id,
            agent_id=agent_id,
            response_time_ms=request.response_time_ms,
            message=request.message,
        )

        return {"message": "Task acknowledged", "acknowledgement": result}

    except Exception as e:
        logger.error(f"Failed to acknowledge task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/accept")
async def accept_task(
    task_id: str,
    request: AcceptRequest,
    agent_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Agent accepts task and moves it to 'doing' status.
    """
    try:
        service = AgentWorkflowService()
        result = service.accept_task(
            task_id=task_id,
            agent_id=agent_id,
            message=request.message,
            conditions=request.conditions,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to accept task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/decline")
async def decline_task(
    task_id: str,
    request: DeclineRequest,
    agent_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Agent declines task with reason.
    """
    try:
        service = AgentWorkflowService()
        result = service.decline_task(
            task_id=task_id,
            agent_id=agent_id,
            reason=request.reason,
            suggestion=request.suggestion,
        )

        return {"message": "Task declined", "acknowledgement": result}

    except Exception as e:
        logger.error(f"Failed to decline task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/submit-review")
async def submit_for_review(
    task_id: str,
    request: SubmitReviewRequest,
    agent_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Agent submits completed work for supervisor review.
    """
    try:
        service = AgentWorkflowService()
        result = service.submit_for_review(
            task_id=task_id,
            agent_id=agent_id,
            submission_data=request.submission_data,
            confidence_score=request.confidence_score,
            flagged_items=request.flagged_items,
            message=request.message,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to submit for review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Supervisor Review ───────────────────────────────────────────

@router.post("/tasks/{task_id}/approve")
async def approve_agent_work(
    task_id: str,
    agent_id: str,
    request: ApproveWorkRequest,
    reviewer_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Supervisor approves agent's work and marks task as done.
    """
    try:
        service = AgentWorkflowService()
        result = service.approve_agent_work(
            task_id=task_id,
            reviewer_id=reviewer_id,
            agent_id=agent_id,
            quality_score=request.quality_score,
            comments=request.comments,
        )

        return result

    except Exception as e:
        logger.error(f"Failed to approve work: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
