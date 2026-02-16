/**
 * Sprint Query Hooks
 *
 * TanStack Query hooks for sprint management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DISABLED_QUERY_KEY, STALE_TIMES } from "../../shared/config/queryPatterns";
import { useToast } from "../../shared/hooks/useToast";
import { taskKeys } from "../../projects/tasks/hooks/useTaskQueries";
import {
  sprintService,
  type CreateSprintRequest,
  type Sprint,
  type SprintCapacity,
  type SprintStatus,
  type UpdateSprintRequest,
} from "../services/sprintService";

// Query key factory
export const sprintKeys = {
  all: ["sprints"] as const,
  lists: () => [...sprintKeys.all, "list"] as const,
  list: (projectId: string, status?: SprintStatus) =>
    [...sprintKeys.lists(), projectId, status] as const,
  detail: (sprintId: string) => [...sprintKeys.all, "detail", sprintId] as const,
  capacity: (sprintId: string) => [...sprintKeys.all, "capacity", sprintId] as const,
  active: (projectId: string) => [...sprintKeys.all, "active", projectId] as const,
};

/**
 * Hook to list sprints for a project
 */
export function useSprints(projectId: string | undefined, status?: SprintStatus) {
  return useQuery({
    queryKey: projectId ? sprintKeys.list(projectId, status) : DISABLED_QUERY_KEY,
    queryFn: () => (projectId ? sprintService.listSprints(projectId, status) : Promise.reject("No project ID")),
    enabled: !!projectId,
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to get active sprint for a project
 */
export function useActiveSprint(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? sprintKeys.active(projectId) : DISABLED_QUERY_KEY,
    queryFn: () => (projectId ? sprintService.getActiveSprint(projectId) : Promise.reject("No project ID")),
    enabled: !!projectId,
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to get sprint details
 */
export function useSprintDetail(sprintId: string | undefined) {
  return useQuery({
    queryKey: sprintId ? sprintKeys.detail(sprintId) : DISABLED_QUERY_KEY,
    queryFn: () => (sprintId ? sprintService.getSprint(sprintId) : Promise.reject("No sprint ID")),
    enabled: !!sprintId,
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to get sprint capacity
 */
export function useSprintCapacity(sprintId: string | undefined) {
  return useQuery({
    queryKey: sprintId ? sprintKeys.capacity(sprintId) : DISABLED_QUERY_KEY,
    queryFn: () => (sprintId ? sprintService.getSprintCapacity(sprintId) : Promise.reject("No sprint ID")),
    enabled: !!sprintId,
    staleTime: STALE_TIMES.frequent,
  });
}

/**
 * Hook to create sprint
 */
export function useCreateSprint() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateSprintRequest }) =>
      sprintService.createSprint(projectId, data),

    onSuccess: (newSprint, variables) => {
      // Invalidate sprint lists
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sprintKeys.active(variables.projectId) });

      showToast({
        title: "Sprint created",
        description: `Sprint "${newSprint.name}" has been created`,
      });
    },

    onError: (error) => {
      showToast({
        title: "Failed to create sprint",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    },
  });
}

/**
 * Hook to update sprint
 */
export function useUpdateSprint() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ sprintId, updates }: { sprintId: string; updates: UpdateSprintRequest }) =>
      sprintService.updateSprint(sprintId, updates),

    onSuccess: (updatedSprint) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(updatedSprint.id) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.active(updatedSprint.project_id) });
      queryClient.invalidateQueries({ queryKey: sprintKeys.capacity(updatedSprint.id) });

      showToast({
        title: "Sprint updated",
        description: `Sprint "${updatedSprint.name}" has been updated`,
      });
    },

    onError: (error) => {
      showToast({
        title: "Failed to update sprint",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    },
  });
}

/**
 * Hook to delete sprint
 */
export function useDeleteSprint() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (sprintId: string) => sprintService.deleteSprint(sprintId),

    onSuccess: (_, sprintId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(sprintId) });

      showToast({
        title: "Sprint deleted",
        description: "Sprint has been deleted successfully",
      });
    },

    onError: (error) => {
      showToast({
        title: "Failed to delete sprint",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    },
  });
}

/**
 * Hook to assign task to sprint
 */
export function useAssignTaskToSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) =>
      sprintService.assignTaskToSprint(taskId, sprintId),

    onSuccess: () => {
      // Invalidate task and sprint queries
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: sprintKeys.all });
    },
  });
}
