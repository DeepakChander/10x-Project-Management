/**
 * Analytics Service
 *
 * API client for analytics and metrics
 */

import { callAPIWithETag } from "../../shared/api/apiClient";

export interface BurndownData {
  sprint_id: string;
  sprint_name: string;
  start_date: string;
  end_date: string;
  snapshots: Array<{
    snapshot_date: string;
    remaining_tasks: number;
    remaining_story_points: number;
    completed_today_tasks: number;
    total_scope_tasks: number;
  }>;
  ideal_line: Array<{
    day: number;
    ideal_remaining: number;
  }>;
}

export interface VelocityData {
  project_id: string;
  velocity_data: Array<{
    sprint_name: string;
    velocity_points: number;
    completed_story_points: number;
    planned_story_points: number;
    completion_rate: number;
  }>;
  avg_velocity: number;
  sprint_count: number;
}

export interface ProjectDashboard {
  project_id: string;
  active_sprint: any;
  velocity_summary: any;
  burndown: BurndownData;
  velocity_chart: VelocityData;
}

export const analyticsService = {
  /**
   * Get sprint burndown chart data
   */
  async getSprintBurndown(sprintId: string): Promise<BurndownData> {
    try {
      const data = await callAPIWithETag<BurndownData>(
        `/api/analytics/sprints/${sprintId}/burndown`
      );
      return data;
    } catch (error) {
      console.error(`Failed to get burndown for sprint ${sprintId}:`, error);
      throw error;
    }
  },

  /**
   * Get velocity chart data
   */
  async getVelocityChart(projectId: string, limit: number = 10): Promise<VelocityData> {
    try {
      const data = await callAPIWithETag<VelocityData>(
        `/api/analytics/projects/${projectId}/velocity?limit=${limit}`
      );
      return data;
    } catch (error) {
      console.error(`Failed to get velocity for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get project dashboard
   */
  async getProjectDashboard(projectId: string): Promise<ProjectDashboard> {
    try {
      const data = await callAPIWithETag<ProjectDashboard>(
        `/api/analytics/projects/${projectId}/dashboard`
      );
      return data;
    } catch (error) {
      console.error(`Failed to get dashboard for project ${projectId}:`, error);
      throw error;
    }
  },
};
