/**
 * Sprint Timeline Card Component
 *
 * Shows sprint timeline, deadline status, and predictions
 */

import { AlertTriangle, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "../../ui/primitives/styles";

interface SprintTimelineCardProps {
  sprint: {
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  metrics: {
    days_elapsed: number;
    days_remaining: number;
    task_completion_percentage: number;
    story_point_completion_percentage: number;
    timeline_status: "on_track" | "at_risk" | "overdue" | "not_applicable";
  };
  className?: string;
}

export function SprintTimelineCard({ sprint, metrics, className }: SprintTimelineCardProps) {
  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const today = new Date();

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil(metrics.days_elapsed));
  const daysRemaining = Math.max(0, Math.ceil(metrics.days_remaining));

  // Calculate if on track
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const actualProgress = metrics.task_completion_percentage;
  const progressDelta = actualProgress - expectedProgress;

  // Determine status
  const isAhead = progressDelta > 10;
  const isBehind = progressDelta < -10;
  const isOnTime = !isAhead && !isBehind;

  // Timeline status styling
  const statusConfig = {
    on_track: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      icon: CheckCircle,
      label: "On Track",
    },
    at_risk: {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      icon: AlertTriangle,
      label: "At Risk",
    },
    overdue: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      icon: AlertTriangle,
      label: "Overdue",
    },
    not_applicable: {
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900/20",
      border: "border-gray-200 dark:border-gray-800",
      icon: Clock,
      label: "Not Started",
    },
  };

  const status = statusConfig[metrics.timeline_status] || statusConfig.not_applicable;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#C0745F] dark:text-[#D4917A]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Sprint Timeline</h3>
        </div>

        {/* Status Badge */}
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border", status.bg, status.border)}>
          <StatusIcon className={cn("w-4 h-4", status.color)} />
          <span className={cn("text-sm font-medium", status.color)}>{status.label}</span>
        </div>
      </div>

      {/* Timeline Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>{startDate.toLocaleDateString()}</span>
          <span className="font-semibold">
            Day {daysElapsed} of {totalDays}
          </span>
          <span>{endDate.toLocaleDateString()}</span>
        </div>

        <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          {/* Expected progress (lighter) */}
          <div
            className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-gray-700"
            style={{ width: `${Math.min(expectedProgress, 100)}%` }}
          />

          {/* Actual progress (colored) */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 transition-all duration-500",
              isAhead
                ? "bg-green-500"
                : isBehind
                  ? "bg-red-500"
                  : "bg-[#C0745F]"
            )}
            style={{ width: `${Math.min(actualProgress, 100)}%` }}
          />

          {/* Current day marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white"
            style={{ left: `${Math.min((daysElapsed / totalDays) * 100, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-500">Expected: {expectedProgress.toFixed(0)}%</span>
          <span className={cn("font-medium", isAhead ? "text-green-600" : isBehind ? "text-red-600" : "text-[#C0745F]")}>
            Actual: {actualProgress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Time Elapsed */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Time Elapsed</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {daysElapsed}
            <span className="text-sm font-normal text-gray-500 ml-1">days</span>
          </div>
        </div>

        {/* Time Remaining */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
          <div className={cn(
            "text-2xl font-bold",
            daysRemaining < 2 ? "text-red-600 dark:text-red-400" :
            daysRemaining < 5 ? "text-orange-600 dark:text-orange-400" :
            "text-green-600 dark:text-green-400"
          )}>
            {daysRemaining}
            <span className="text-sm font-normal text-gray-500 ml-1">days</span>
          </div>
        </div>

        {/* Velocity */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Current Velocity</div>
          <div className="text-xl font-bold text-[#C0745F] dark:text-[#D4917A]">
            {(metrics.story_point_completion_percentage / Math.max(daysElapsed, 1)).toFixed(1)}
            <span className="text-sm font-normal text-gray-500 ml-1">pts/day</span>
          </div>
        </div>

        {/* Progress Status */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Progress Status</div>
          <div className={cn(
            "text-xl font-bold",
            isAhead ? "text-green-600 dark:text-green-400" :
            isBehind ? "text-red-600 dark:text-red-400" :
            "text-gray-700 dark:text-gray-300"
          )}>
            {isAhead ? `+${progressDelta.toFixed(0)}%` :
             isBehind ? `${progressDelta.toFixed(0)}%` :
             "On Time"}
            <span className="text-xs font-normal text-gray-500 ml-1">
              {isAhead ? "ahead" : isBehind ? "behind" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction */}
      {isBehind && daysRemaining > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Sprint Behind Schedule
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                At current velocity, you'll miss the deadline by ~{Math.abs(progressDelta / 10).toFixed(0)} days.
                Need to complete {Math.ceil((100 - actualProgress) / daysRemaining)}% per day to finish on time.
              </div>
            </div>
          </div>
        </div>
      )}

      {isAhead && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                🎉 Sprint Ahead of Schedule!
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                You're {progressDelta.toFixed(0)}% ahead of expected progress.
                At current velocity, you'll finish ~{Math.ceil(progressDelta / 10)} days early!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
