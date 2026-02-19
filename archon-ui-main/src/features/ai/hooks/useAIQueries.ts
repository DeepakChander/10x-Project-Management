/**
 * AI Query Hooks
 *
 * TanStack Query hooks for AI features
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_TIMES } from "../../shared/config/queryPatterns";
import { useToast } from "../../shared/hooks/useToast";
import {
  aiService,
  type AIProjectSetupSuggestion,
  type AISuggestion,
  type AITaskSuggestion,
} from "../services/aiService";

// Query key factory
export const aiKeys = {
  all: ["ai"] as const,
  suggestions: () => [...aiKeys.all, "suggestions"] as const,
  suggestion: (params?: any) => [...aiKeys.suggestions(), params] as const,
  estimation: (taskId: string) => [...aiKeys.all, "estimation", taskId] as const,
  sprintPlan: (projectId: string) => [...aiKeys.all, "sprint-plan", projectId] as const,
  projectSetup: (projectId: string) => [...aiKeys.all, "project-setup", projectId] as const,
  learningStatus: () => [...aiKeys.all, "learning-status"] as const,
  teamProfiles: () => [...aiKeys.all, "team-profiles"] as const,
  qualityPatterns: () => [...aiKeys.all, "quality-patterns"] as const,
  modelAccuracy: () => [...aiKeys.all, "model-accuracy"] as const,
};

// Re-export types needed by components
export type { AIProjectSetupSuggestion, AITaskSuggestion };

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

    onSuccess: (estimation) => {
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

/** Learning system status — pending observations + knowledge store sizes */
export function useLearningStatus() {
  return useQuery({
    queryKey: aiKeys.learningStatus(),
    queryFn: () => aiService.getLearningStatus(),
    staleTime: STALE_TIMES.frequent,
  });
}

/** All team intelligence profiles */
export function useTeamProfiles() {
  return useQuery({
    queryKey: aiKeys.teamProfiles(),
    queryFn: () => aiService.getTeamProfiles(),
    staleTime: STALE_TIMES.normal,
  });
}

/** Quality patterns — high rejection rates by task type */
export function useQualityPatterns() {
  return useQuery({
    queryKey: aiKeys.qualityPatterns(),
    queryFn: () => aiService.getQualityPatterns(0.0),
    staleTime: STALE_TIMES.normal,
  });
}

/** Model accuracy trend over time */
export function useModelAccuracy() {
  return useQuery({
    queryKey: aiKeys.modelAccuracy(),
    queryFn: () => aiService.getModelAccuracy(12),
    staleTime: STALE_TIMES.rare,
  });
}

/** Trigger background observation processing */
export function useTriggerLearning() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (batchSize: number) => aiService.triggerLearning(batchSize),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.learningStatus() });
      showToast(data.message || "Learning triggered", "success");
    },
    onError: (error) => {
      showToast(
        `Failed to trigger learning: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    },
  });
}

/**
 * Hook to get AI task suggestions for a new project (Magic Moment).
 * Returns a mutation that fetches suggestions when called.
 */
export function useSuggestProjectSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      title,
      description,
    }: {
      projectId: string;
      title: string;
      description?: string;
    }) => aiService.suggestProjectSetup(projectId, title, description),

    onSuccess: (data) => {
      // Cache the result so it can be read without re-fetching
      queryClient.setQueryData(aiKeys.projectSetup(data.project_id), data);
    },
  });
}

/**
 * Hook to record feedback on an AI project setup suggestion.
 */
export function useRecordAIFeedback() {
  return useMutation({
    mutationFn: ({
      suggestionId,
      userResponse,
      modifications,
    }: {
      suggestionId: string;
      userResponse: "accepted" | "rejected" | "modified";
      modifications?: Record<string, unknown>;
    }) => aiService.recordFeedback(suggestionId, userResponse, modifications),
  });
}
