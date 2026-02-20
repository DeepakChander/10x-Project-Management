/**
 * Sprint Service
 *
 * API client for sprint operations
 */

import { callAPIWithETag } from "../../shared/api/apiClient";

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  start_date?: string;
  end_date?: string;
  capacity_hours: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SprintStatus = "planning" | "active" | "completed" | "cancelled";

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  capacity_hours?: number;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  start_date?: string;
  end_date?: string;
  capacity_hours?: number;
}

export interface SprintCapacity {
  sprint_id: string;
  project_id: string;
  sprint_name: string;
  sprint_status: SprintStatus;
  capacity_hours: number;
  total_story_points: number;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  pending_tasks: number;
}

export const sprintService = {
  /**
   * Create a new sprint
   */
  async createSprint(projectId: string, data: CreateSprintRequest): Promise<Sprint> {
    try {
      const response = await callAPIWithETag<Sprint>(
        `/api/projects/${projectId}/sprints`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to create sprint:", error);
      throw error;
    }
  },

  /**
   * List sprints for a project
   */
  async listSprints(projectId: string, status?: SprintStatus): Promise<Sprint[]> {
    try {
      const url = status
        ? `/api/projects/${projectId}/sprints?status=${status}`
        : `/api/projects/${projectId}/sprints`;

      const sprints = await callAPIWithETag<Sprint[]>(url);
      return sprints;
    } catch (error) {
      console.error(`Failed to list sprints for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get a specific sprint
   */
  async getSprint(sprintId: string): Promise<Sprint> {
    try {
      const sprint = await callAPIWithETag<Sprint>(`/api/sprints/${sprintId}`);
      return sprint;
    } catch (error) {
      console.error(`Failed to get sprint ${sprintId}:`, error);
      throw error;
    }
  },

  /**
   * Update a sprint
   */
  async updateSprint(sprintId: string, updates: UpdateSprintRequest): Promise<Sprint> {
    try {
      const response = await callAPIWithETag<Sprint>(`/api/sprints/${sprintId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return response;
    } catch (error) {
      console.error(`Failed to update sprint ${sprintId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a sprint
   */
  async deleteSprint(sprintId: string): Promise<void> {
    try {
      await callAPIWithETag<{ status: string }>(`/api/sprints/${sprintId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`Failed to delete sprint ${sprintId}:`, error);
      throw error;
    }
  },

  /**
   * Get sprint capacity summary
   */
  async getSprintCapacity(sprintId: string): Promise<SprintCapacity> {
    try {
      const capacity = await callAPIWithETag<SprintCapacity>(
        `/api/sprints/${sprintId}/capacity`
      );
      return capacity;
    } catch (error) {
      console.error(`Failed to get sprint capacity ${sprintId}:`, error);
      throw error;
    }
  },

  /**
   * Get active sprint for a project
   */
  async getActiveSprint(projectId: string): Promise<Sprint | null> {
    const response = await callAPIWithETag<{ sprint: Sprint | null }>(
      `/api/projects/${projectId}/sprints/active`
    );
    return response.sprint;
  },

  /**
   * Assign task to sprint
   */
  async assignTaskToSprint(taskId: string, sprintId: string | null): Promise<void> {
    try {
      await callAPIWithETag(`/api/tasks/${taskId}/sprint`, {
        method: "PUT",
        body: JSON.stringify({ sprint_id: sprintId }),
      });
    } catch (error) {
      console.error(`Failed to assign task ${taskId} to sprint:`, error);
      throw error;
    }
  },
};
