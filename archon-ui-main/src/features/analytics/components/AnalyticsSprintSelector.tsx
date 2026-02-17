/**
 * Analytics Sprint Selector Component
 *
 * Dropdown to select which sprint's analytics to view
 */

import { ChevronDown, Target } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/primitives/select";
import { cn } from "../../ui/primitives/styles";
import { useSprints } from "../../sprints/hooks/useSprintQueries";
import type { Sprint } from "../../sprints/services/sprintService";

interface AnalyticsSprintSelectorProps {
  projectId: string;
  selectedSprintId: string | null;
  onSprintChange: (sprintId: string | null) => void;
  className?: string;
}

export function AnalyticsSprintSelector({
  projectId,
  selectedSprintId,
  onSprintChange,
  className,
}: AnalyticsSprintSelectorProps) {
  const { data: sprints = [], isLoading } = useSprints(projectId);

  // Sort: active first, then by date
  const sortedSprints = [...sprints].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50", className)}>
        <div className="w-4 h-4 border-2 border-[#C0745F] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading sprints...</span>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50", className)}>
        <Target className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">No sprints yet</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50", className)}>
      <Target className="w-4 h-4 text-[#C0745F] dark:text-[#D4917A]" />
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">View Sprint:</span>

      <Select value={selectedSprintId || ""} onValueChange={(value) => onSprintChange(value || null)}>
        <SelectTrigger className="w-[250px] h-8 border-0 bg-transparent focus:ring-0">
          <SelectValue placeholder="Select sprint...">
            {selectedSprint ? (
              <div className="flex items-center gap-2">
                <span>{selectedSprint.name}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    selectedSprint.status === "active" &&
                      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                    selectedSprint.status === "completed" &&
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                    selectedSprint.status === "planning" &&
                      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                    selectedSprint.status === "cancelled" &&
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}
                >
                  {selectedSprint.status}
                </span>
              </div>
            ) : (
              "Select sprint..."
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortedSprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              <div className="flex items-center justify-between gap-3 w-full">
                <span>{sprint.name}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    sprint.status === "active" &&
                      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                    sprint.status === "completed" &&
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                    sprint.status === "planning" &&
                      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                    sprint.status === "cancelled" &&
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}
                >
                  {sprint.status}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sprints.length > 1 && (
        <span className="text-xs text-gray-500">
          ({sprints.length} total)
        </span>
      )}
    </div>
  );
}
