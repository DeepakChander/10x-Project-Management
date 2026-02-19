/**
 * AI Service
 *
 * API client for AI-powered features
 */

import { callAPIWithETag } from "../../shared/api/apiClient";

export interface TaskEstimation {
  story_points: number;
  duration_hours: number;
  confidence: number;
  reasoning: string;
}

export interface SprintPlan {
  recommended_tasks: string[];
  total_story_points: number;
  capacity_utilization: number;
  reasoning: string;
  warnings: string[];
}

export interface AISuggestion {
  id: string;
  project_id?: string;
  task_id?: string;
  sprint_id?: string;
  type: AISuggestionType;
  title: string;
  description: string;
  confidence: number;
  suggestion_data: Record<string, any>;
  accepted: boolean | null;
  accepted_at?: string;
  accepted_by?: string;
  model_used?: string;
  created_at: string;
}

export type AISuggestionType =
  | "task_estimation"
  | "sprint_planning"
  | "priority_suggestion"
  | "dependency_detection"
  | "capacity_warning"
  | "project_setup"
  | "task_blueprint"
  | "team_assignment"
  | "stall_warning"
  | "quality_tip"
  | "retrospective";

export interface AITaskSuggestion {
  title: string;
  description?: string;
  task_type: string;
  priority: string;
  assignee: string;
  agent_suitable: boolean;
  estimated_days?: number;
}

export interface AIProjectSetupSuggestion {
  project_id: string;
  suggestion_id: string | null;
  confidence: number;
  template_used: string | null;
  suggested_tasks: AITaskSuggestion[];
  cold_start: boolean;
  message: string;
  needs_description?: boolean;
}

export const aiService = {
  /**
   * Get AI estimation for a task
   */
  async estimateTask(taskId: string, projectId: string): Promise<TaskEstimation> {
    try {
      const response = await callAPIWithETag<{ task_id: string; estimation: TaskEstimation }>(
        `/api/ai/tasks/${taskId}/estimate?project_id=${projectId}`,
        { method: "POST" }
      );
      return response.estimation;
    } catch (error) {
      console.error(`Failed to estimate task ${taskId}:`, error);
      throw error;
    }
  },

  /**
   * Get AI sprint planning recommendations
   */
  async planSprint(projectId: string, capacityHours: number): Promise<SprintPlan> {
    try {
      const response = await callAPIWithETag<{ project_id: string; plan: SprintPlan }>(
        `/api/ai/projects/${projectId}/plan-sprint`,
        {
          method: "POST",
          body: JSON.stringify({ sprint_capacity_hours: capacityHours }),
        }
      );
      return response.plan;
    } catch (error) {
      console.error(`Failed to plan sprint for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Detect dependencies for a task
   */
  async detectDependencies(
    taskId: string,
    projectId: string
  ): Promise<Array<{ depends_on_task_id: string; depends_on_title: string; confidence: number; reasoning: string }>> {
    try {
      const response = await callAPIWithETag<{ task_id: string; dependencies: any[] }>(
        `/api/ai/tasks/${taskId}/detect-dependencies?project_id=${projectId}`,
        { method: "POST" }
      );
      return response.dependencies;
    } catch (error) {
      console.error(`Failed to detect dependencies for task ${taskId}:`, error);
      throw error;
    }
  },

  /**
   * Get AI suggestions
   */
  async getSuggestions(params?: {
    project_id?: string;
    task_id?: string;
    pending_only?: boolean;
  }): Promise<AISuggestion[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.project_id) queryParams.append("project_id", params.project_id);
      if (params?.task_id) queryParams.append("task_id", params.task_id);
      if (params?.pending_only !== undefined)
        queryParams.append("pending_only", String(params.pending_only));

      const url = `/api/ai/suggestions${queryParams.toString() ? `?${queryParams}` : ""}`;
      const suggestions = await callAPIWithETag<AISuggestion[]>(url);
      return suggestions;
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      throw error;
    }
  },

  /**
   * Get AI learning system status
   */
  async getLearningStatus(): Promise<{
    pending_observations: number;
    knowledge_stores: Record<string, number>;
  }> {
    return callAPIWithETag("/api/ai/learn/status");
  },

  /**
   * Get all team intelligence profiles
   */
  async getTeamProfiles(): Promise<Array<Record<string, unknown>>> {
    return callAPIWithETag("/api/ai/team-intelligence");
  },

  /**
   * Get quality patterns (high-rejection task types)
   */
  async getQualityPatterns(minRejectionRate = 0.0): Promise<Array<Record<string, unknown>>> {
    return callAPIWithETag(`/api/ai/quality-patterns?min_rejection_rate=${minRejectionRate}`);
  },

  /**
   * Get model accuracy over time
   */
  async getModelAccuracy(limit = 12): Promise<Array<Record<string, unknown>>> {
    return callAPIWithETag(`/api/ai/accuracy?limit=${limit}`);
  },

  /**
   * Trigger background observation processing
   */
  async triggerLearning(batchSize = 50): Promise<{ pending: number; message: string }> {
    return callAPIWithETag(`/api/ai/learn?batch_size=${batchSize}`, { method: "POST" });
  },

  /**
   * Get AI-generated task suggestions for a new project (Magic Moment)
   */
  async suggestProjectSetup(projectId: string, title: string, description?: string): Promise<AIProjectSetupSuggestion> {
    try {
      const response = await callAPIWithETag<AIProjectSetupSuggestion>(
        `/api/ai/projects/${projectId}/suggest-setup`,
        {
          method: "POST",
          body: JSON.stringify({ title, description }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to get project setup suggestions for ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Record feedback on an AI suggestion (accept/reject/modify)
   */
  async recordFeedback(
    suggestionId: string,
    userResponse: "accepted" | "rejected" | "modified",
    modifications?: Record<string, unknown>
  ): Promise<void> {
    try {
      await callAPIWithETag(`/api/ai/suggestions/${suggestionId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ user_response: userResponse, modifications }),
      });
    } catch (error) {
      console.error(`Failed to record feedback for suggestion ${suggestionId}:`, error);
      throw error;
    }
  },

  /**
   * Accept an AI suggestion
   */
  async acceptSuggestion(suggestionId: string): Promise<void> {
    try {
      await callAPIWithETag(`/api/ai/suggestions/${suggestionId}/accept`, {
        method: "PUT",
      });
    } catch (error) {
      console.error(`Failed to accept suggestion ${suggestionId}:`, error);
      throw error;
    }
  },
};
