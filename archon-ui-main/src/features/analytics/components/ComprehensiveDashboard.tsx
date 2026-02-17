/**
 * Comprehensive Analytics Dashboard
 *
 * Shows all analytics: time, deadlines, predictions, velocity, burndown
 */

import { AlertTriangle, BarChart3, Calendar, CheckCircle, Clock, Target, TrendingUp } from "lucide-react";
import { cn } from "../../ui/primitives/styles";

interface DashboardProps {
  sprintHealth: {
    sprint_name: string;
    status: string;
    total_tasks: number;
    completed_tasks: number;
    active_tasks: number;
    pending_tasks: number;
    total_story_points: number;
    completed_story_points: number;
    remaining_story_points: number;
    task_completion_percentage: number;
    story_point_completion_percentage: number;
    days_elapsed: number;
    days_remaining: number;
    capacity_utilization_percentage: number;
    timeline_status: string;
    start_date: string;
    end_date: string;
  };
  className?: string;
}

export function ComprehensiveDashboard({ sprintHealth, className }: DashboardProps) {
  const progress = sprintHealth.task_completion_percentage;
  const expectedProgress = (sprintHealth.days_elapsed / (sprintHealth.days_elapsed + sprintHealth.days_remaining)) * 100;
  const progressDelta = progress - expectedProgress;

  const isAhead = progressDelta > 10;
  const isBehind = progressDelta < -10;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sprint Progress */}
        <div className="p-4 bg-gradient-to-br from-[#C0745F]/10 to-[#D4917A]/5 dark:from-[#C0745F]/20 dark:to-[#D4917A]/10 rounded-lg border border-[#C0745F]/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#C0745F]" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Sprint Progress</span>
          </div>
          <div className="text-3xl font-bold text-[#C0745F] dark:text-[#D4917A]">
            {progress.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {sprintHealth.completed_tasks} / {sprintHealth.total_tasks} tasks
          </div>
        </div>

        {/* Time Remaining */}
        <div className={cn(
          "p-4 rounded-lg border",
          sprintHealth.days_remaining < 2
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : sprintHealth.days_remaining < 5
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={cn(
              "w-4 h-4",
              sprintHealth.days_remaining < 2 ? "text-red-600" :
              sprintHealth.days_remaining < 5 ? "text-orange-600" : "text-green-600"
            )} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Days Left</span>
          </div>
          <div className={cn(
            "text-3xl font-bold",
            sprintHealth.days_remaining < 2 ? "text-red-600 dark:text-red-400" :
            sprintHealth.days_remaining < 5 ? "text-orange-600 dark:text-orange-400" :
            "text-green-600 dark:text-green-400"
          )}>
            {Math.ceil(sprintHealth.days_remaining)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of {Math.ceil(sprintHealth.days_elapsed + sprintHealth.days_remaining)} days
          </div>
        </div>

        {/* Story Points */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Story Points</span>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {sprintHealth.completed_story_points}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            / {sprintHealth.total_story_points} completed
          </div>
        </div>

        {/* Timeline Status */}
        <div className={cn("p-4 rounded-lg border", status.bg, status.border)}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={cn("w-4 h-4", status.color)} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Timeline Status</span>
          </div>
          <div className={cn("text-2xl font-bold", status.color)}>
            {isAhead ? `${progressDelta.toFixed(0)}%` :
             isBehind ? `${progressDelta.toFixed(0)}%` :
             "On Time"}
          </div>
          <div className={cn("text-xs mt-1", status.color)}>
            {isAhead ? "Ahead of schedule" :
             isBehind ? "Behind schedule" :
             "Right on track"}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Progress */}
        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">Task Completion</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium">{sprintHealth.completed_tasks} / {sprintHealth.total_tasks}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">In Progress</span>
              <span className="font-medium">{sprintHealth.active_tasks}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C0745F] transition-all duration-500"
                style={{ width: `${(sprintHealth.active_tasks / sprintHealth.total_tasks) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium">{sprintHealth.pending_tasks}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-500"
                style={{ width: `${(sprintHealth.pending_tasks / sprintHealth.total_tasks) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">Capacity Utilization</div>

          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {sprintHealth.capacity_utilization_percentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sprintHealth.total_story_points} pts / {sprintHealth.capacity_hours || 160} hrs capacity
            </div>
          </div>

          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                sprintHealth.capacity_utilization_percentage > 100
                  ? "bg-red-500"
                  : sprintHealth.capacity_utilization_percentage > 90
                    ? "bg-orange-500"
                    : sprintHealth.capacity_utilization_percentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
              )}
              style={{ width: `${Math.min(sprintHealth.capacity_utilization_percentage, 100)}%` }}
            />
          </div>

          {sprintHealth.capacity_utilization_percentage > 100 && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400">
              ⚠️ Over capacity by {(sprintHealth.capacity_utilization_percentage - 100).toFixed(0)}%!
              Consider reducing scope.
            </div>
          )}
        </div>
      </div>

      {/* Predictions & Warnings */}
      {isBehind && sprintHealth.days_remaining > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Sprint At Risk
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <div>• You're {Math.abs(progressDelta).toFixed(0)}% behind expected progress</div>
                <div>• Need to complete {Math.ceil(sprintHealth.remaining_story_points / sprintHealth.days_remaining)} points/day to finish on time</div>
                <div>• Current velocity: {(sprintHealth.completed_story_points / Math.max(sprintHealth.days_elapsed, 1)).toFixed(1)} points/day</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
