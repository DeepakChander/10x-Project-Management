/**
 * Analytics Query Hooks
 *
 * TanStack Query hooks for analytics data
 */

import { useQuery } from "@tanstack/react-query";
import { DISABLED_QUERY_KEY, STALE_TIMES } from "../../shared/config/queryPatterns";
import { analyticsService } from "../services/analyticsService";

const isRealUuid = (id: string | undefined): boolean =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Query key factory
export const analyticsKeys = {
  all: ["analytics"] as const,
  burndown: (sprintId: string) => [...analyticsKeys.all, "burndown", sprintId] as const,
  velocity: (projectId: string) => [...analyticsKeys.all, "velocity", projectId] as const,
  dashboard: (projectId: string) => [...analyticsKeys.all, "dashboard", projectId] as const,
};

/**
 * Hook to get sprint burndown data
 */
export function useSprintBurndown(sprintId: string | undefined) {
  return useQuery({
    queryKey: sprintId ? analyticsKeys.burndown(sprintId) : DISABLED_QUERY_KEY,
    queryFn: () =>
      sprintId ? analyticsService.getSprintBurndown(sprintId) : Promise.reject("No sprint ID"),
    enabled: !!sprintId,
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to get velocity chart data
 */
export function useVelocityChart(projectId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: isRealUuid(projectId) ? analyticsKeys.velocity(projectId!) : DISABLED_QUERY_KEY,
    queryFn: () =>
      projectId ? analyticsService.getVelocityChart(projectId, limit) : Promise.reject("No project ID"),
    enabled: isRealUuid(projectId),
    staleTime: STALE_TIMES.normal,
  });
}

/**
 * Hook to get project dashboard
 */
export function useProjectDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: isRealUuid(projectId) ? analyticsKeys.dashboard(projectId!) : DISABLED_QUERY_KEY,
    queryFn: () =>
      projectId ? analyticsService.getProjectDashboard(projectId) : Promise.reject("No project ID"),
    enabled: isRealUuid(projectId),
    staleTime: STALE_TIMES.normal,
  });
}
