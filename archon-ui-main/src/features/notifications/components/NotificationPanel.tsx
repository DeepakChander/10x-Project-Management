/**
 * Notification Panel Component
 *
 * Dropdown panel showing list of notifications
 */

import { CheckCheck, Loader2, X } from "lucide-react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { useMarkAllAsRead, useNotifications } from "../hooks/useNotificationQueries";
import { NotificationItem } from "./NotificationItem";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { data: notifications = [], isLoading } = useNotifications({ limit: 20 });
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const hasUnread = unreadNotifications.length > 0;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div
      className={cn(
        "w-[400px] max-h-[600px]",
        "bg-white/95 dark:bg-zinc-900/95",
        "backdrop-blur-xl",
        "border border-gray-200/50 dark:border-gray-800/50",
        "rounded-lg shadow-2xl",
        "overflow-hidden",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {hasUnread && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadNotifications.length} unread
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mark All Read Button */}
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-[#C0745F] hover:text-[#A85A45] hover:bg-[#C0745F]/10"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#C0745F]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Bell className="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              No notifications yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
              You'll see updates about tasks and sprints here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
            Showing {Math.min(20, notifications.length)} most recent notifications
          </p>
        </div>
      )}
    </div>
  );
}

// Missing Bell import from lucide-react
import { Bell } from "lucide-react";
