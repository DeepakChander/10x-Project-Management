/**
 * Notification Bell Component
 *
 * Displays notification bell icon with unread count badge
 * Opens notification panel on click
 */

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { useUnreadCount } from "../hooks/useNotificationQueries";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9",
          "text-gray-600 dark:text-gray-400",
          "hover:text-[#C0745F] dark:hover:text-[#D4917A]",
          "hover:bg-[#C0745F]/10 dark:hover:bg-[#C0745F]/20",
          isOpen && "bg-[#C0745F]/10 dark:bg-[#C0745F]/20 text-[#C0745F] dark:text-[#D4917A]"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1",
              "flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1",
              "bg-[#C0745F] text-white",
              "text-[10px] font-bold",
              "rounded-full",
              "shadow-sm",
              "animate-in fade-in zoom-in duration-200"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel (Dropdown) */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel - Positioned to the right of navigation sidebar */}
          <div className="fixed left-[120px] top-[100px] z-50">
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
