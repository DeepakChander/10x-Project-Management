/**
 * Analytics View Component
 *
 * Dashboard showing sprint burndown, velocity trends, and team performance
 */

import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "../../ui/primitives/styles";
import { useProjectDashboard } from "../hooks/useAnalyticsQueries";
import { SprintBurndownChart } from "../components/SprintBurndownChart";
import { VelocityChart } from "../components/VelocityChart";

interface AnalyticsViewProps {
  projectId: string;
  className?: string;
}

export function AnalyticsView({ projectId, className }: AnalyticsViewProps) {
  const { data: dashboard, isLoading } = useProjectDashboard(projectId);

  // Debug logging
  console.log("AnalyticsView Debug:", {
    projectId,
    isLoading,
    hasDashboard: !!dashboard,
    activeSprint: dashboard?.active_sprint?.name,
    burndown: !!dashboard?.burndown,
    velocityCount: dashboard?.velocity_chart?.velocity_data?.length,
  });

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C0745F] dark:text-[#D4917A] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[#C0745F] dark:text-[#D4917A]" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
      </div>

      {/* Quick Stats */}
      {dashboard.velocity_summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">Sprints Completed</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {dashboard.velocity_summary.sprints_completed || 0}
            </div>
          </div>

          <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Velocity</div>
            <div className="text-3xl font-bold text-[#C0745F] dark:text-[#D4917A] mt-1">
              {dashboard.velocity_summary.avg_velocity_points?.toFixed(1) || "0.0"}
              <span className="text-sm ml-1 font-normal text-gray-500">pts</span>
            </div>
          </div>

          <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {dashboard.velocity_summary.avg_completion_rate?.toFixed(0) || "0"}%
            </div>
          </div>

          <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Sprint</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1 truncate">
              {dashboard.active_sprint?.name || "None"}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        {dashboard.burndown && (
          <SprintBurndownChart
            snapshots={dashboard.burndown.snapshots}
            idealLine={dashboard.burndown.ideal_line}
            sprintName={dashboard.burndown.sprint_name}
          />
        )}

        {/* Velocity Chart */}
        <VelocityChart
          velocityData={dashboard.velocity_chart.velocity_data}
          avgVelocity={dashboard.velocity_chart.avg_velocity}
        />
      </div>

      {/* Empty State */}
      {!dashboard.active_sprint && !dashboard.velocity_summary?.sprints_completed && (
        <div className="p-12 text-center bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm rounded-lg border border-gray-200/30 dark:border-gray-800/30">
          <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Analytics Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete your first sprint to see velocity trends and burndown charts
          </p>
        </div>
      )}
    </div>
  );
}
