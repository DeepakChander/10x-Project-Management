import { Link2, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, ComboBox, type ComboBoxOption, Label } from "../../../ui/primitives";
import { cn } from "../../../ui/primitives/styles";
import { useAddDependency, useProjectDependencies, useProjectTasks, useRemoveDependency } from "../hooks";
import type { Task, TaskDependencyWithTitle } from "../types";

interface DependencySelectorProps {
  taskId: string;
  projectId: string;
}

export const DependencySelector = ({ taskId, projectId }: DependencySelectorProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const { data: tasks = [] as Task[] } = useProjectTasks(projectId);
  const { data: dependencyMap, isLoading: isLoadingDeps } = useProjectDependencies(projectId);
  const addDependency = useAddDependency(projectId);
  const removeDependency = useRemoveDependency(projectId);

  const taskDeps = dependencyMap?.[taskId];
  const blockedBy: TaskDependencyWithTitle[] = taskDeps?.blocked_by ?? [];

  // Build ComboBox options: exclude self and already-added deps
  const existingDepIds = useMemo(() => new Set(blockedBy.map((d) => d.depends_on_id)), [blockedBy]);

  const availableOptions: ComboBoxOption[] = useMemo(
    () =>
      tasks
        .filter((t) => t.id !== taskId && !existingDepIds.has(t.id))
        .map((t) => ({
          value: t.id,
          label: t.title,
          description: t.status,
        })),
    [tasks, taskId, existingDepIds],
  );

  const handleAdd = () => {
    if (!selectedTaskId) return;
    addDependency.mutate({ taskId, dependsOnId: selectedTaskId }, { onSuccess: () => setSelectedTaskId("") });
  };

  const handleRemove = (dependencyId: string) => {
    removeDependency.mutate(dependencyId);
  };

  if (isLoadingDeps) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading dependencies...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" />
        Blocked By
      </Label>

      {/* Existing dependencies as removable chips */}
      {blockedBy.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {blockedBy.map((dep) => (
            <div
              key={dep.id}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                "border border-gray-200 dark:border-gray-700",
                dep.depends_on_status === "done" && "opacity-50 line-through",
              )}
            >
              <span className="truncate max-w-[200px]">{dep.depends_on_title}</span>
              <span className="text-gray-400">({dep.depends_on_status})</span>
              <button
                type="button"
                onClick={() => handleRemove(dep.id)}
                disabled={removeDependency.isPending}
                className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove dependency on ${dep.depends_on_title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new dependency */}
      <div className="flex items-center gap-2">
        <ComboBox
          options={availableOptions}
          value={selectedTaskId}
          onValueChange={setSelectedTaskId}
          placeholder="Search tasks to add blocker..."
          searchPlaceholder="Type to search..."
          emptyMessage="No matching tasks"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!selectedTaskId || addDependency.isPending}
          loading={addDependency.isPending}
        >
          Add
        </Button>
      </div>
    </div>
  );
};
