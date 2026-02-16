/**
 * Notification Service
 *
 * API client for notification operations
 */

import { callAPIWithETag } from "../../shared/api/apiClient";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  project_id?: string;
  task_id?: string;
  sprint_id?: string;
  actor_id?: string;
  metadata: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_status_changed"
  | "task_comment"
  | "sprint_started"
  | "sprint_ending"
  | "sprint_completed"
  | "dependency_resolved"
  | "mention"
  | "review_requested"
  | "review_completed";

export interface NotificationParams {
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationService = {
  /**
   * Get notifications for current user
   */
  async getNotifications(params?: NotificationParams): Promise<Notification[]> {
    const queryParams = new URLSearchParams();

    if (params?.unread_only) {
      queryParams.append("unread_only", "true");
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append("offset", params.offset.toString());
    }

    const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    try {
      const notifications = await callAPIWithETag<Notification[]>(url);
      return notifications;
    } catch (error) {
      console.error("Failed to get notifications:", error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await callAPIWithETag<{ unread_count: number }>(
        "/api/notifications/unread-count"
      );
      return response.unread_count;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await callAPIWithETag(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    try {
      const response = await callAPIWithETag<{ count: number }>(
        "/api/notifications/read-all",
        {
          method: "PUT",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await callAPIWithETag(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`Failed to delete notification ${notificationId}:`, error);
      throw error;
    }
  },
};
