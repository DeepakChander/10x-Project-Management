"""
Notifications API

Handles:
- Fetching user notifications
- Marking notifications as read
- Getting unread counts
- Deleting notifications
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id
from ..services.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class MarkAsReadRequest(BaseModel):
    notification_ids: list[str]


# ── Get User Notifications ──────────────────────────────────────

@router.get("")
async def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Maximum notifications to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user_id: str = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    """
    Get notifications for the current user.

    Requires: Authentication (X-User-Id header)
    """
    try:
        service = NotificationService()
        notifications = service.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only,
            limit=limit,
            offset=offset,
        )
        return notifications

    except Exception as e:
        logger.error(f"Failed to get notifications: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Get Unread Count ────────────────────────────────────────────

@router.get("/unread-count")
async def get_unread_count(
    user_id: str = Depends(get_current_user_id),
) -> dict[str, int]:
    """
    Get count of unread notifications for the current user.

    Requires: Authentication (X-User-Id header)
    """
    try:
        service = NotificationService()
        count = service.get_unread_count(user_id)
        return {"unread_count": count}

    except Exception as e:
        logger.error(f"Failed to get unread count: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Mark as Read ────────────────────────────────────────────────

@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """
    Mark a single notification as read.

    Requires: Authentication (X-User-Id header)
    """
    try:
        service = NotificationService()
        success = service.mark_as_read(notification_id, user_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or you don't have permission",
            )

        return {"message": "Notification marked as read"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/read-all")
async def mark_all_as_read(
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """
    Mark all notifications as read for the current user.

    Requires: Authentication (X-User-Id header)
    """
    try:
        service = NotificationService()
        count = service.mark_all_as_read(user_id)

        return {
            "message": f"Marked {count} notifications as read",
            "count": count,
        }

    except Exception as e:
        logger.error(f"Failed to mark all as read: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Delete Notification ─────────────────────────────────────────

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, str]:
    """
    Delete a notification.

    Requires: Authentication (X-User-Id header)
    """
    try:
        service = NotificationService()
        success = service.delete_notification(notification_id, user_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or you don't have permission",
            )

        return {"message": "Notification deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete notification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
