"""
Task Comments API
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_task_permission
from ..utils import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tasks", tags=["comments"])


class CreateCommentRequest(BaseModel):
    comment_text: str
    mentions: list[str] = []


@router.post("/{task_id}/comments")
async def create_comment(
    task_id: str,
    request: CreateCommentRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_task_permission("read")),
):
    """Add comment to task."""
    try:
        client = get_supabase_client()

        comment_data = {
            "task_id": task_id,
            "user_id": user_id,
            "comment_text": request.comment_text,
            "mentions": request.mentions,
        }

        response = client.table("archon_task_comments").insert(comment_data).execute()

        return {"message": "Comment added", "comment": response.data[0] if response.data else {}}

    except Exception as e:
        logger.error(f"Failed to add comment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}/comments")
async def get_comments(
    task_id: str,
    perm: dict = Depends(require_task_permission("read")),
):
    """Get all comments for a task."""
    try:
        client = get_supabase_client()

        response = (
            client.table("archon_task_comments")
            .select("*, archon_users_profile!archon_task_comments_user_id_fkey(display_name, email)")
            .eq("task_id", task_id)
            .order("created_at")
            .execute()
        )

        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get comments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}/status-history")
async def get_status_history(
    task_id: str,
    perm: dict = Depends(require_task_permission("read")),
):
    """Get status change history for a task."""
    try:
        client = get_supabase_client()

        response = (
            client.table("archon_task_status_history")
            .select("*, archon_users_profile!archon_task_status_history_user_id_fkey(display_name)")
            .eq("task_id", task_id)
            .order("created_at")
            .execute()
        )

        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get status history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
