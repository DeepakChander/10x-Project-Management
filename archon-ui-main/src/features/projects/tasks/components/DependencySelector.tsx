import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Lock } from "lucide-react";
import { DISABLED_QUERY_KEY, STALE_TIMES } from "../../../shared/config/queryPatterns";
import { useToast } from "../../../shared/hooks/useToast";
import { taskService } from "../services";
import { useProjectTasks } from "../hooks/useTaskQueries";
import { ComboBox, type ComboBoxOption, Label } from "../../../ui/primitives";
import type { TaskDependency } from "../types";

interface DependencySelectorProps {
  taskId: string;
  projectId: string;
}

export function DependencySelector({ taskId, projectId }: DependencySelectorProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState("");

  // All tasks in the project (for the dropdown)
  const { data: allTasks = [] } = useProjectTasks(projectId);

  // Current dependencies for this task
  const { data: deps } = useQuery<{ blocks: TaskDependency[]; blocked_by: TaskDependency[] }>({
    queryKey: taskId ? ["tasks", taskId, "dependencies"] : DISABLED_QUERY_KEY,
    queryFn: () => taskService.getTaskDependencies(taskId),
    enabled: !!taskId,
    staleTime: STALE_TIMES.normal,
  });

  const blockedBy = deps?.blocked_by ?? [];

  const existingBlockerIds = new Set(blockedBy.map((d) => d.depends_on_id));

  const addMutation = useMutation({
    mutationFn: (dependsOnId: string) => taskService.addDependency(taskId, dependsOnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "dependencies"] });
      setSelectedId("");
    },
    onError: (err: Error) => {
      showToast(err.message || "Failed to add dependency", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (depId: string) => taskService.removeDependency(depId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "dependencies"] });
    },
    onError: () => {
      showToast("Failed to remove dependency", "error");
    },
  });

  const handleAdd = useCallback(
    (value: string) => {
      if (!value || value === taskId || existingBlockerIds.has(value)) return;
      setSelectedId(value);
      addMutation.mutate(value);
    },
    [taskId, existingBlockerIds, addMutation],
  );

  // Build dropdown options: exclude self + already-added blockers
  const options: ComboBoxOption[] = allTasks
    .filter((t) => t.id !== taskId && !existingBlockerIds.has(t.id))
    .map((t) => ({ value: t.id, label: t.title, description: t.status }));

  return (
    <div className="space-y-2">
      <Label>Blocked By</Label>

      {blockedBy.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {blockedBy.map((dep) => {
            const isDone = dep.depends_on_status === "done";
            return (
              <span
                key={dep.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                  isDone
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-red-500/40 bg-red-500/10 text-red-400"
                }`}
              >
                <Lock className="h-3 w-3" />
                {dep.depends_on_title || dep.depends_on_id}
                <button
                  type="button"
                  className="ml-1 hover:text-white"
                  onClick={() => removeMutation.mutate(dep.id)}
                  disabled={removeMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <ComboBox
        options={options}
        value={selectedId}
        onValueChange={handleAdd}
        placeholder="Add a blocker task..."
        searchPlaceholder="Search tasks..."
        emptyMessage="No tasks found"
        className="w-full"
        disabled={addMutation.isPending || options.length === 0}
      />
      {options.length === 0 && blockedBy.length === 0 && (
        <p className="text-xs text-white/40">No other tasks available in this project.</p>
      )}
    </div>
  );
}
