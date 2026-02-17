/**
 * WIP Limit Warning Component
 * Warns when user has too many tasks in "doing" status
 */

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../ui/primitives/styles";

const MAX_WIP = 3; // Maximum tasks in "doing" per person

export function WIPLimitWarning({ assignee }: { assignee: string }) {
  const [wipCount, setWipCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);

  useEffect(() => {
    async function checkWIP() {
      try {
        const userId = localStorage.getItem("10x-user-id");
        const response = await fetch(`/api/tasks?assignee=${assignee}&status=doing`, {
          headers: { "X-User-Id": userId || "" },
        });

        if (response.ok) {
          const data = await response.json();
          const tasks = data.tasks || [];
          setWipCount(tasks.length);
          setIsOverLimit(tasks.length >= MAX_WIP);
        }
      } catch (error) {
        console.error("Failed to check WIP:", error);
      }
    }

    if (assignee) {
      checkWIP();
    }
  }, [assignee]);

  if (!isOverLimit) return null;

  return (
    <div className={cn(
      "p-3 rounded-lg border flex items-start gap-2",
      wipCount >= MAX_WIP + 2
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
    )}>
      <AlertTriangle className={cn(
        "w-5 h-5 mt-0.5",
        wipCount >= MAX_WIP + 2 ? "text-red-600" : "text-orange-600"
      )} />
      <div className="flex-1">
        <div className={cn(
          "font-medium text-sm",
          wipCount >= MAX_WIP + 2
            ? "text-red-800 dark:text-red-200"
            : "text-orange-800 dark:text-orange-200"
        )}>
          {wipCount >= MAX_WIP + 2 ? "🚨 WIP Limit Exceeded!" : "⚠️ At WIP Limit"}
        </div>
        <div className={cn(
          "text-xs mt-1",
          wipCount >= MAX_WIP + 2
            ? "text-red-700 dark:text-red-300"
            : "text-orange-700 dark:text-orange-300"
        )}>
          {assignee} has {wipCount} tasks in "Doing" (max: {MAX_WIP}).
          Consider finishing current tasks before starting new ones.
        </div>
      </div>
    </div>
  );
}
