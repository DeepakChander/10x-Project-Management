/**
 * Enhanced Analytics View
 *
 * Comprehensive dashboard with time tracking, predictions, and all metrics
 */

import { BarChart3, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../../ui/primitives/styles";
import { useSprints } from "../../sprints/hooks/useSprintQueries";
import { useSprintBurndown } from "../hooks/useAnalyticsQueries";
import { AnalyticsSprintSelector } from "../components/AnalyticsSprintSelector";
import { ComprehensiveDashboard } from "../components/ComprehensiveDashboard";
import { SprintBurndownChart } from "../components/SprintBurndownChart";
import { SprintTimelineCard } from "../components/SprintTimelineCard";
import { VelocityChart } from "../components/VelocityChart";
import { useProjectDashboard } from "../hooks/useAnalyticsQueries";

interface EnhancedAnalyticsViewProps {
  projectId: string;
  className?: string;
}

export function EnhancedAnalyticsView({ projectId, className }: EnhancedAnalyticsViewProps) {
  const { data: dashboard, isLoading } = useProjectDashboard(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Auto-select active sprint when dashboard loads
  useEffect(() => {
    if (dashboard?.active_sprint && !selectedSprintId) {
      setSelectedSprintId(dashboard.active_sprint.id);
    }
  }, [dashboard?.active_sprint, selectedSprintId]);

  // Fetch burndown for selected sprint (or use dashboard burndown if same sprint)
  const { data: selectedSprintBurndown } = useSprintBurndown(
    selectedSprintId && selectedSprintId !== dashboard?.active_sprint?.id
      ? selectedSprintId
      : undefined
  );

  // Calculate sprint health metrics from dashboard data
  const sprintHealth = dashboard?.active_sprint && dashboard?.burndown ? {
    sprint_name: dashboard.active_sprint.name,
    status: dashboard.active_sprint.status,
    start_date: dashboard.active_sprint.start_date,
    end_date: dashboard.active_sprint.end_date,
    capacity_hours: dashboard.active_sprint.capacity_hours,
    total_tasks: dashboard.burndown.snapshots[0]?.total_scope_tasks || 0,
    completed_tasks: dashboard.burndown.snapshots[0]?.total_scope_tasks - dashboard.burndown.snapshots[0]?.remaining_tasks || 0,
    active_tasks: Math.ceil(dashboard.burndown.snapshots[0]?.remaining_tasks * 0.2) || 0,
    pending_tasks: Math.floor(dashboard.burndown.snapshots[0]?.remaining_tasks * 0.8) || 0,
    total_story_points: dashboard.burndown.snapshots[0]?.total_scope_points || 0,
    completed_story_points: dashboard.burndown.snapshots[0]?.total_scope_points - dashboard.burndown.snapshots[0]?.remaining_story_points || 0,
    remaining_story_points: dashboard.burndown.snapshots[0]?.remaining_story_points || 0,
    task_completion_percentage: dashboard.burndown.snapshots[0]?.total_scope_tasks > 0
      ? ((dashboard.burndown.snapshots[0]?.total_scope_tasks - dashboard.burndown.snapshots[0]?.remaining_tasks) / dashboard.burndown.snapshots[0]?.total_scope_tasks) * 100
      : 0,
    story_point_completion_percentage: dashboard.burndown.snapshots[0]?.total_scope_points > 0
      ? ((dashboard.burndown.snapshots[0]?.total_scope_points - dashboard.burndown.snapshots[0]?.remaining_story_points) / dashboard.burndown.snapshots[0]?.total_scope_points) * 100
      : 0,
    days_elapsed: dashboard.active_sprint.start_date
      ? Math.ceil((Date.now() - new Date(dashboard.active_sprint.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    days_remaining: dashboard.active_sprint.end_date
      ? Math.max(0, Math.ceil((new Date(dashboard.active_sprint.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0,
    capacity_utilization_percentage: dashboard.active_sprint.capacity_hours > 0
      ? ((dashboard.burndown.snapshots[0]?.total_scope_points || 0) / dashboard.active_sprint.capacity_hours) * 100
      : 0,
    timeline_status: "on_track" as const,
  } : null;

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C0745F] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard?.active_sprint) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Active Sprint
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start a sprint to see comprehensive analytics
          </p>
        </div>
      </div>
    );
  }

  // Get the selected sprint data
  const displayBurndown = selectedSprintBurndown || dashboard?.burndown;
  const displaySprint = sprints.find(s => s.id === selectedSprintId) || dashboard?.active_sprint;

  // Recalculate sprint health for SELECTED sprint (not just active)
  const selectedSprintHealth = displaySprint && displayBurndown ? {
    sprint_name: displaySprint.name,
    status: displaySprint.status,
    start_date: displaySprint.start_date,
    end_date: displaySprint.end_date,
    capacity_hours: displaySprint.capacity_hours,
    total_tasks: displayBurndown.snapshots[0]?.total_scope_tasks || 0,
    completed_tasks: (displayBurndown.snapshots[0]?.total_scope_tasks || 0) - (displayBurndown.snapshots[0]?.remaining_tasks || 0),
    active_tasks: Math.ceil((displayBurndown.snapshots[0]?.remaining_tasks || 0) * 0.2),
    pending_tasks: Math.floor((displayBurndown.snapshots[0]?.remaining_tasks || 0) * 0.8),
    total_story_points: displayBurndown.snapshots[0]?.total_scope_points || 0,
    completed_story_points: (displayBurndown.snapshots[0]?.total_scope_points || 0) - (displayBurndown.snapshots[0]?.remaining_story_points || 0),
    remaining_story_points: displayBurndown.snapshots[0]?.remaining_story_points || 0,
    task_completion_percentage: displayBurndown.snapshots[0]?.total_scope_tasks > 0
      ? (((displayBurndown.snapshots[0]?.total_scope_tasks || 0) - (displayBurndown.snapshots[0]?.remaining_tasks || 0)) / displayBurndown.snapshots[0]?.total_scope_tasks) * 100
      : 0,
    story_point_completion_percentage: displayBurndown.snapshots[0]?.total_scope_points > 0
      ? (((displayBurndown.snapshots[0]?.total_scope_points || 0) - (displayBurndown.snapshots[0]?.remaining_story_points || 0)) / displayBurndown.snapshots[0]?.total_scope_points) * 100
      : 0,
    days_elapsed: displaySprint.start_date
      ? Math.max(0, Math.ceil((Date.now() - new Date(displaySprint.start_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0,
    days_remaining: displaySprint.end_date
      ? Math.max(0, Math.ceil((new Date(displaySprint.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0,
    capacity_utilization_percentage: displaySprint.capacity_hours > 0
      ? ((displayBurndown.snapshots[0]?.total_scope_points || 0) / displaySprint.capacity_hours) * 100
      : 0,
    timeline_status: "on_track" as const,
  } : sprintHealth;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Sprint Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#C0745F] dark:text-[#D4917A]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
        </div>

        {/* Sprint Selector */}
        <AnalyticsSprintSelector
          projectId={projectId}
          selectedSprintId={selectedSprintId}
          onSprintChange={setSelectedSprintId}
        />
      </div>

      {/* Comprehensive Dashboard (Hero Metrics) */}
      {selectedSprintHealth && <ComprehensiveDashboard sprintHealth={selectedSprintHealth} />}

      {/* Timeline Card */}
      {selectedSprintHealth && displaySprint && (
        <SprintTimelineCard
          sprint={displaySprint}
          metrics={{
            days_elapsed: selectedSprintHealth.days_elapsed || 0,
            days_remaining: selectedSprintHealth.days_remaining || 0,
            task_completion_percentage: selectedSprintHealth.task_completion_percentage || 0,
            story_point_completion_percentage: selectedSprintHealth.story_point_completion_percentage || 0,
            timeline_status: selectedSprintHealth.timeline_status || "not_applicable",
          }}
        />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart - Show selected sprint or active sprint */}
        {displayBurndown && (
          <SprintBurndownChart
            snapshots={displayBurndown.snapshots}
            idealLine={displayBurndown.ideal_line}
            sprintName={displayBurndown.sprint_name}
          />
        )}

        {/* Velocity Chart */}
        <VelocityChart
          velocityData={dashboard?.velocity_chart?.velocity_data || []}
          avgVelocity={dashboard?.velocity_chart?.avg_velocity || 0}
        />
      </div>
    </div>
  );
}
