"""
Notification Service

Handles creation, retrieval, and management of notifications.
Integrates with task/sprint events to trigger notifications.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""

    VALID_TYPES = [
        "task_assigned",
        "task_status_changed",
        "task_comment",
        "sprint_started",
        "sprint_ending",
        "sprint_completed",
        "dependency_resolved",
        "mention",
        "review_requested",
        "review_completed",
    ]

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        project_id: Optional[str] = None,
        task_id: Optional[str] = None,
        sprint_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Create a new notification for a user.

        Args:
            user_id: The user to notify
            notification_type: Type of notification (e.g., 'task_assigned')
            title: Short notification title
            message: Detailed notification message
            project_id: Related project (optional)
            task_id: Related task (optional)
            sprint_id: Related sprint (optional)
            actor_id: User who triggered the notification (optional)
            metadata: Additional context data (optional)

        Returns:
            Created notification record
        """
        if notification_type not in self.VALID_TYPES:
            raise ValueError(f"Invalid notification type: {notification_type}")

        def _is_valid_uuid(value: Optional[str]) -> bool:
            if not value:
                return False
            import uuid as _uuid
            try:
                _uuid.UUID(str(value))
                return True
            except (ValueError, AttributeError):
                return False

        # Sanitize UUID fields — non-UUID strings (e.g. "system", "User") become None
        safe_actor_id = actor_id if _is_valid_uuid(actor_id) else None
        safe_user_id = user_id if _is_valid_uuid(user_id) else None

        if not safe_user_id:
            logger.warning(f"Skipping notification: user_id '{user_id}' is not a valid UUID")
            raise ValueError(f"Invalid user_id for notification: {user_id}")

        notification_data = {
            "user_id": safe_user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "project_id": project_id,
            "task_id": task_id,
            "sprint_id": sprint_id,
            "actor_id": safe_actor_id,
            "metadata": metadata or {},
        }

        try:
            response = self.client.table("archon_notifications").insert(notification_data).execute()

            if response.data:
                logger.info(
                    f"Notification created: type={notification_type} user={user_id} task={task_id}"
                )
                return response.data[0]
            else:
                logger.error("Failed to create notification: No data returned")
                raise Exception("Failed to create notification")

        except Exception as e:
            # If actor_id FK violation, retry without actor_id
            error_str = str(e)
            if "actor_id" in error_str and ("foreign key" in error_str.lower() or "23503" in error_str):
                logger.warning(f"actor_id FK violation, retrying without actor_id: {safe_actor_id}")
                notification_data["actor_id"] = None
                try:
                    response = self.client.table("archon_notifications").insert(notification_data).execute()
                    if response.data:
                        logger.info(
                            f"Notification created (no actor): type={notification_type} user={user_id}"
                        )
                        return response.data[0]
                except Exception as retry_err:
                    logger.error(f"Retry also failed: {retry_err}", exc_info=True)
                    raise retry_err
            logger.error(f"Failed to create notification: {e}", exc_info=True)
            raise

    def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Get notifications for a user.

        Args:
            user_id: User to get notifications for
            unread_only: If True, only return unread notifications
            limit: Maximum number of notifications to return
            offset: Offset for pagination

        Returns:
            List of notification records
        """
        try:
            query = (
                self.client.table("archon_notifications")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
            )

            if unread_only:
                query = query.eq("read", False)

            response = query.execute()
            return response.data or []

        except Exception as e:
            logger.error(f"Failed to get notifications for user {user_id}: {e}", exc_info=True)
            raise

    def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user.

        Args:
            user_id: User to count notifications for

        Returns:
            Number of unread notifications
        """
        try:
            response = (
                self.client.table("archon_notifications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("read", False)
                .execute()
            )

            return response.count or 0

        except Exception as e:
            logger.error(f"Failed to get unread count for user {user_id}: {e}", exc_info=True)
            return 0

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """
        Mark a notification as read.

        Args:
            notification_id: Notification to mark as read
            user_id: User performing the action (for authorization)

        Returns:
            True if successful, False otherwise
        """
        try:
            response = (
                self.client.table("archon_notifications")
                .update({"read": True})
                .eq("id", notification_id)
                .eq("user_id", user_id)  # Ensure user owns the notification
                .execute()
            )

            if response.data:
                logger.info(f"Notification {notification_id} marked as read")
                return True
            else:
                logger.warning(f"Notification {notification_id} not found or unauthorized")
                return False

        except Exception as e:
            logger.error(f"Failed to mark notification as read: {e}", exc_info=True)
            return False

    def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications as read for a user.

        Args:
            user_id: User to mark notifications for

        Returns:
            Number of notifications marked as read
        """
        try:
            response = (
                self.client.table("archon_notifications")
                .update({"read": True})
                .eq("user_id", user_id)
                .eq("read", False)
                .execute()
            )

            count = len(response.data) if response.data else 0
            logger.info(f"Marked {count} notifications as read for user {user_id}")
            return count

        except Exception as e:
            logger.error(f"Failed to mark all notifications as read: {e}", exc_info=True)
            return 0

    def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """
        Delete a notification.

        Args:
            notification_id: Notification to delete
            user_id: User performing the action (for authorization)

        Returns:
            True if successful, False otherwise
        """
        try:
            response = (
                self.client.table("archon_notifications")
                .delete()
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            if response.data:
                logger.info(f"Notification {notification_id} deleted")
                return True
            else:
                logger.warning(f"Notification {notification_id} not found or unauthorized")
                return False

        except Exception as e:
            logger.error(f"Failed to delete notification: {e}", exc_info=True)
            return False

    # ── Notification Triggers ──────────────────────────────────────

    def notify_task_assigned(
        self, task_id: str, assignee_id: str, project_id: str, task_title: str, actor_id: str
    ):
        """Create notification when task is assigned to a user"""
        return self.create_notification(
            user_id=assignee_id,
            notification_type="task_assigned",
            title=f"Task assigned: {task_title}",
            message=f"You have been assigned a new task: {task_title}",
            project_id=project_id,
            task_id=task_id,
            actor_id=actor_id,
            metadata={"task_title": task_title},
        )

    def notify_task_status_changed(
        self,
        task_id: str,
        assignee_id: str,
        project_id: str,
        task_title: str,
        old_status: str,
        new_status: str,
        actor_id: str,
    ):
        """Create notification when task status changes"""
        # Don't notify the person who made the change
        if assignee_id == actor_id:
            return None

        return self.create_notification(
            user_id=assignee_id,
            notification_type="task_status_changed",
            title=f"Task moved: {task_title}",
            message=f"Task '{task_title}' moved from {old_status} to {new_status}",
            project_id=project_id,
            task_id=task_id,
            actor_id=actor_id,
            metadata={"task_title": task_title, "old_status": old_status, "new_status": new_status},
        )

    def notify_sprint_started(self, sprint_id: str, sprint_name: str, project_id: str, team_member_ids: list[str]):
        """Create notifications when sprint starts"""
        notifications = []
        for user_id in team_member_ids:
            notif = self.create_notification(
                user_id=user_id,
                notification_type="sprint_started",
                title=f"Sprint started: {sprint_name}",
                message=f"Sprint '{sprint_name}' is now active!",
                project_id=project_id,
                sprint_id=sprint_id,
                metadata={"sprint_name": sprint_name},
            )
            notifications.append(notif)
        return notifications

    def notify_dependency_resolved(
        self, task_id: str, assignee_id: str, project_id: str, task_title: str, resolved_task_title: str
    ):
        """Create notification when a blocking task is completed"""
        return self.create_notification(
            user_id=assignee_id,
            notification_type="dependency_resolved",
            title=f"Blocker resolved for: {task_title}",
            message=f"The blocking task '{resolved_task_title}' has been completed. You can now proceed with '{task_title}'.",
            project_id=project_id,
            task_id=task_id,
            metadata={"task_title": task_title, "resolved_task_title": resolved_task_title},
        )
