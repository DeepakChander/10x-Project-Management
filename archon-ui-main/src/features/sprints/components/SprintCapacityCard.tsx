/**
 * Sprint Capacity Card Component
 *
 * Visual display of sprint capacity and progress
 */

import { Activity, CheckCircle2, Clock, ListTodo, Target } from "lucide-react";
import { cn } from "../../ui/primitives/styles";
import { useSprintCapacity } from "../hooks/useSprintQueries";

interface SprintCapacityCardProps {
  sprintId: string;
  className?: string;
}

export function SprintCapacityCard({ sprintId, className }: SprintCapacityCardProps) {
  const { data: capacity, isLoading } = useSprintCapacity(sprintId);

  if (isLoading) {
    return (
      <div className={cn("p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#C0745F] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!capacity) {
    return null;
  }

  const completionPercentage = capacity.total_tasks > 0
    ? Math.round((capacity.completed_tasks / capacity.total_tasks) * 100)
    : 0;

  const utilizationPercentage = capacity.capacity_hours > 0
    ? Math.round((capacity.total_story_points / capacity.capacity_hours) * 100)
    : 0;

  return (
    <div
      className={cn(
        "p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#C0745F] dark:text-[#D4917A]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {capacity.sprint_name}
          </h3>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            capacity.sprint_status === "active" &&
              "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
            capacity.sprint_status === "planning" &&
              "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
            capacity.sprint_status === "completed" &&
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}
        >
          {capacity.sprint_status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Sprint Progress</span>
          <span className="font-semibold">{completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C0745F] to-[#D4917A] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Tasks */}
        <div className="flex flex-col items-center p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
          <ListTodo className="w-4 h-4 text-gray-600 dark:text-gray-400 mb-1" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {capacity.total_tasks}
          </span>
          <span className="text-xs text-gray-500">Total</span>
        </div>

        {/* Active Tasks */}
        <div className="flex flex-col items-center p-2 bg-[#C0745F]/5 dark:bg-[#C0745F]/10 rounded-lg">
          <Activity className="w-4 h-4 text-[#C0745F] dark:text-[#D4917A] mb-1" />
          <span className="text-lg font-bold text-[#C0745F] dark:text-[#D4917A]">
            {capacity.active_tasks}
          </span>
          <span className="text-xs text-gray-500">Active</span>
        </div>

        {/* Completed Tasks */}
        <div className="flex flex-col items-center p-2 bg-green-50/50 dark:bg-green-900/10 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mb-1" />
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {capacity.completed_tasks}
          </span>
          <span className="text-xs text-gray-500">Done</span>
        </div>
      </div>

      {/* Capacity Utilization */}
      {capacity.capacity_hours > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Capacity</span>
            </div>
            <span className="font-semibold">
              {capacity.total_story_points} / {capacity.capacity_hours} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                utilizationPercentage > 90
                  ? "bg-red-500"
                  : utilizationPercentage > 70
                    ? "bg-orange-500"
                    : "bg-green-500"
              )}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          {utilizationPercentage > 90 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              ⚠️ Sprint over capacity!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
