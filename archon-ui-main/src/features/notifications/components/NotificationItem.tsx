/**
 * Notification Item Component
 *
 * Individual notification display with click-to-read and delete actions
 */

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  MessageCircle,
  Target,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { useDeleteNotification, useMarkAsRead } from "../hooks/useNotificationQueries";
import type { Notification, NotificationType } from "../services/notificationService";

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  task_assigned: UserPlus,
  task_status_changed: Target,
  task_comment: MessageCircle,
  sprint_started: Target,
  sprint_ending: AlertCircle,
  sprint_completed: CheckCircle,
  dependency_resolved: CheckCircle,
  mention: MessageCircle,
  review_requested: FileText,
  review_completed: CheckCircle,
};

// Color mapping for notification types
const notificationColors: Record<NotificationType, string> = {
  task_assigned: "text-blue-500 dark:text-blue-400",
  task_status_changed: "text-[#C0745F] dark:text-[#D4917A]",
  task_comment: "text-purple-500 dark:text-purple-400",
  sprint_started: "text-green-500 dark:text-green-400",
  sprint_ending: "text-orange-500 dark:text-orange-400",
  sprint_completed: "text-green-600 dark:text-green-500",
  dependency_resolved: "text-emerald-500 dark:text-emerald-400",
  mention: "text-pink-500 dark:text-pink-400",
  review_requested: "text-indigo-500 dark:text-indigo-400",
  review_completed: "text-teal-500 dark:text-teal-400",
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const Icon = notificationIcons[notification.type];
  const iconColor = notificationColors[notification.type];

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to related resource
    if (notification.task_id && notification.project_id) {
      navigate(`/projects/${notification.project_id}`);
      onClose();
    } else if (notification.project_id) {
      navigate(`/projects/${notification.project_id}`);
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group relative px-4 py-3",
        "hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
        "cursor-pointer transition-colors",
        !notification.read && "bg-[#C0745F]/5 dark:bg-[#C0745F]/10"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full",
            "flex items-center justify-center",
            "bg-gray-100 dark:bg-gray-800",
            !notification.read && "bg-[#C0745F]/10 dark:bg-[#C0745F]/20"
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                "text-sm font-medium",
                notification.read
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-900 dark:text-white"
              )}
            >
              {notification.title}
            </h4>

            {/* Delete Button (visible on hover) */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 opacity-0 group-hover:opacity-100",
                "text-gray-400 hover:text-red-500 dark:hover:text-red-400",
                "transition-opacity"
              )}
              onClick={handleDelete}
              aria-label="Delete notification"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">{timeAgo}</span>

            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-[#C0745F] dark:bg-[#D4917A]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
