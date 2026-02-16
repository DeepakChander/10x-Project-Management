/**
 * Notification Query Hooks
 *
 * TanStack Query hooks for notification management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_TIMES } from "../../shared/config/queryPatterns";
import { useSmartPolling } from "../../shared/hooks/useSmartPolling";
import { useToast } from "../../shared/hooks/useToast";
import { notificationService, type Notification, type NotificationParams } from "../services/notificationService";

// Query key factory
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params?: NotificationParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

/**
 * Hook to get notifications
 */
export function useNotifications(params?: NotificationParams) {
  const { refetchInterval } = useSmartPolling(10_000); // Poll every 10 seconds

  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
    staleTime: STALE_TIMES.frequent, // 5 seconds
    refetchInterval,
  });
}

/**
 * Hook to get unread count
 */
export function useUnreadCount() {
  const { refetchInterval } = useSmartPolling(10_000); // Poll every 10 seconds

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: STALE_TIMES.frequent, // 5 seconds
    refetchInterval,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),

    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(notificationKeys.list());

      // Optimistically update the notification to read
      queryClient.setQueriesData<Notification[]>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          );
        }
      );

      // Optimistically update unread count
      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(),
        (old) => Math.max(0, (old || 0) - 1)
      );

      return { previousNotifications };
    },

    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(),
          context.previousNotifications
        );
      }
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),

    onSuccess: (data) => {
      // Update all notifications to read
      queryClient.setQueriesData<Notification[]>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((n) => ({
            ...n,
            read: true,
            read_at: n.read ? n.read_at : new Date().toISOString(),
          }));
        }
      );

      // Set unread count to 0
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);

      showToast({
        title: "All notifications marked as read",
        description: `${data.count} notification${data.count !== 1 ? "s" : ""} marked as read`,
      });
    },

    onError: (error) => {
      showToast({
        title: "Failed to mark all as read",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(notificationId),

    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(notificationKeys.list());

      // Optimistically remove the notification
      queryClient.setQueriesData<Notification[]>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          const notification = old.find((n) => n.id === notificationId);
          const wasUnread = notification && !notification.read;

          // Update unread count if the deleted notification was unread
          if (wasUnread) {
            queryClient.setQueryData<number>(
              notificationKeys.unreadCount(),
              (count) => Math.max(0, (count || 0) - 1)
            );
          }

          return old.filter((n) => n.id !== notificationId);
        }
      );

      return { previousNotifications };
    },

    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(),
          context.previousNotifications
        );
      }
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
