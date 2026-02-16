/**
 * AI Query Hooks
 *
 * TanStack Query hooks for AI features
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DISABLED_QUERY_KEY, STALE_TIMES } from "../../shared/config/queryPatterns";
import { useToast } from "../../shared/hooks/useToast";
import { aiService, type AISuggestion, type SprintPlan, type TaskEstimation } from "../services/aiService";

// Query key factory
export const aiKeys = {
  all: ["ai"] as const,
  suggestions: () => [...aiKeys.all, "suggestions"] as const,
  suggestion: (params?: any) => [...aiKeys.suggestions(), params] as const,
  estimation: (taskId: string) => [...aiKeys.all, "estimation", taskId] as const,
  sprintPlan: (projectId: string) => [...aiKeys.all, "sprint-plan", projectId] as const,
};

/**
 * Hook to get AI suggestions
 */
export function useAISuggestions(params?: {
  project_id?: string;
  task_id?: string;
  pending_only?: boolean;
}) {
  return useQuery({
    queryKey: aiKeys.suggestion(params),
    queryFn: () => aiService.getSuggestions(params),
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to estimate a task
 */
export function useEstimateTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ taskId, projectId }: { taskId: string; projectId: string }) =>
      aiService.estimateTask(taskId, projectId),

    onSuccess: (estimation, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.suggestions() });

      showToast(
        `AI suggests ${estimation.story_points} story points (${estimation.duration_hours} hours)`,
        "success"
      );
    },

    onError: (error) => {
      showToast(
        `Failed to estimate task: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });
}

/**
 * Hook to plan sprint with AI
 */
export function usePlanSprint() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ projectId, capacityHours }: { projectId: string; capacityHours: number }) =>
      aiService.planSprint(projectId, capacityHours),

    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.suggestions() });

      const warningText = plan.warnings.length > 0 ? ` ${plan.warnings[0]}` : "";

      showToast(
        `AI recommends ${plan.recommended_tasks.length} tasks (${plan.total_story_points} points).${warningText}`,
        "success"
      );
    },

    onError: (error) => {
      showToast(
        `Failed to plan sprint: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });
}

/**
 * Hook to accept AI suggestion
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (suggestionId: string) => aiService.acceptSuggestion(suggestionId),

    onMutate: async (suggestionId) => {
      // Optimistically update suggestion to accepted
      queryClient.setQueriesData<AISuggestion[]>(
        { queryKey: aiKeys.suggestions() },
        (old) => {
          if (!old) return old;
          return old.map((s) =>
            s.id === suggestionId
              ? { ...s, accepted: true, accepted_at: new Date().toISOString() }
              : s
          );
        }
      );
    },

    onSuccess: () => {
      showToast("AI suggestion accepted and applied", "success");
    },

    onError: (error) => {
      showToast(
        `Failed to accept suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.suggestions() });
    },
  });
}
