"""
Agent Workflow Service

Handles agent task acknowledgement, acceptance, and review submission
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from ..utils import get_supabase_client
from .projects.task_service import TaskService

logger = logging.getLogger(__name__)


class AgentWorkflowService:
    """Service for agent task workflow"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def acknowledge_task(
        self,
        task_id: str,
        agent_id: str,
        response_time_ms: int,
        message: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Agent acknowledges receipt of task assignment.

        Args:
            task_id: Task ID
            agent_id: Agent user ID
            response_time_ms: Time from assignment to acknowledgement
            message: Optional acknowledgement message

        Returns:
            Acknowledgement record
        """
        try:
            ack_data = {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "acknowledged",
                "response_time_ms": response_time_ms,
                "agent_message": message or "Task received. Processing.",
            }

            response = self.client.table("archon_task_acknowledgements").insert(ack_data).execute()

            if response.data:
                logger.info(f"Task acknowledged | task={task_id} | agent={agent_id} | time={response_time_ms}ms")
                return response.data[0]
            else:
                raise Exception("Failed to record acknowledgement")

        except Exception as e:
            logger.error(f"Failed to acknowledge task: {e}", exc_info=True)
            raise

    async def accept_task(
        self,
        task_id: str,
        agent_id: str,
        message: Optional[str] = None,
        conditions: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Agent accepts task assignment.

        Args:
            task_id: Task ID
            agent_id: Agent user ID
            message: Acceptance message
            conditions: Any conditions for acceptance

        Returns:
            Updated task and acknowledgement
        """
        try:
            # Update acknowledgement
            ack_data = {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "accepted",
                "agent_message": message or "Task accepted. Starting work.",
                "conditions": conditions,
            }

            self.client.table("archon_task_acknowledgements").insert(ack_data).execute()

            # Move task to "doing" using TaskService to enforce validation
            task_service = TaskService(self.client)
            success, result = await task_service.update_task(task_id, {"status": "doing"})

            if not success:
                raise Exception(f"Failed to update task status: {result.get('error', 'Unknown error')}")

            logger.info(f"Task accepted by agent | task={task_id} | agent={agent_id}")

            return {"message": "Task accepted", "status": "doing"}

        except Exception as e:
            logger.error(f"Failed to accept task: {e}", exc_info=True)
            raise

    def decline_task(
        self,
        task_id: str,
        agent_id: str,
        reason: str,
        suggestion: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Agent declines task assignment.

        Args:
            task_id: Task ID
            agent_id: Agent user ID
            reason: Why agent is declining
            suggestion: Optional suggestion for human

        Returns:
            Acknowledgement record
        """
        try:
            ack_data = {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "declined",
                "decline_reason": reason,
                "agent_message": suggestion,
            }

            response = self.client.table("archon_task_acknowledgements").insert(ack_data).execute()

            # Keep task in current status (don't change to doing)
            # Notify supervisor about decline

            logger.info(f"Task declined by agent | task={task_id} | agent={agent_id} | reason={reason}")

            return response.data[0] if response.data else {}

        except Exception as e:
            logger.error(f"Failed to decline task: {e}", exc_info=True)
            raise

    async def submit_for_review(
        self,
        task_id: str,
        agent_id: str,
        submission_data: dict,
        confidence_score: float,
        flagged_items: list[str],
        message: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Agent submits completed work for human review.

        Args:
            task_id: Task ID
            agent_id: Agent user ID
            submission_data: Work output/results
            confidence_score: Agent's confidence (0.0-1.0)
            flagged_items: Items needing human review
            message: Submission message

        Returns:
            Updated task and acknowledgement
        """
        try:
            ack_data = {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "submitted_for_review",
                "submission_data": submission_data,
                "confidence_score": confidence_score,
                "flagged_items": flagged_items,
                "agent_message": message or "Work completed. Ready for review.",
            }

            self.client.table("archon_task_acknowledgements").insert(ack_data).execute()

            # Move task to "review" status using TaskService to enforce validation
            task_service = TaskService(self.client)
            success, result = await task_service.update_task(task_id, {"status": "review"})

            if not success:
                raise Exception(f"Failed to update task status: {result.get('error', 'Unknown error')}")

            # TODO: Notify supervisor for review

            logger.info(
                f"Task submitted for review | task={task_id} | agent={agent_id} | "
                f"confidence={confidence_score} | flagged={len(flagged_items)}"
            )

            return {"message": "Submitted for review", "status": "review"}

        except Exception as e:
            logger.error(f"Failed to submit for review: {e}", exc_info=True)
            raise

    async def approve_agent_work(
        self,
        task_id: str,
        reviewer_id: str,
        agent_id: str,
        quality_score: int,
        comments: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Supervisor approves agent's work.

        Args:
            task_id: Task ID
            reviewer_id: Supervisor user ID
            agent_id: Agent who did the work
            quality_score: 1-10 rating
            comments: Review comments

        Returns:
            Review record and updated task
        """
        try:
            # Create review record
            review_data = {
                "task_id": task_id,
                "agent_id": agent_id,
                "reviewer_id": reviewer_id,
                "decision": "approved",
                "review_comments": comments,
                "quality_score": quality_score,
            }

            self.client.table("archon_agent_task_reviews").insert(review_data).execute()

            # Move task to "done" using TaskService to enforce validation
            task_service = TaskService(self.client)
            success, result = await task_service.update_task(task_id, {"status": "done"})

            if not success:
                raise Exception(f"Failed to update task status: {result.get('error', 'Unknown error')}")

            logger.info(f"Agent work approved | task={task_id} | reviewer={reviewer_id} | score={quality_score}")

            return {"message": "Work approved", "status": "done"}

        except Exception as e:
            logger.error(f"Failed to approve work: {e}", exc_info=True)
            raise
