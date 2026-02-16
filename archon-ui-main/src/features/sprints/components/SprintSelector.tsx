/**
 * Sprint Selector Component
 *
 * Dropdown to select current sprint or create new one
 */

import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/primitives/select";
import { cn } from "../../ui/primitives/styles";
import { useActiveSprint, useSprints, useUpdateSprint } from "../hooks/useSprintQueries";
import type { Sprint } from "../services/sprintService";
import { NewSprintModal } from "./NewSprintModal";

interface SprintSelectorProps {
  projectId: string;
  onSprintChange?: (sprint: Sprint | null) => void;
}

export function SprintSelector({ projectId, onSprintChange }: SprintSelectorProps) {
  const [isNewSprintModalOpen, setIsNewSprintModalOpen] = useState(false);

  const { data: sprints = [], isLoading } = useSprints(projectId);
  const { data: activeSprint } = useActiveSprint(projectId);
  const updateSprintMutation = useUpdateSprint();

  const handleSprintChange = (sprintId: string) => {
    const selectedSprint = sprints.find((s) => s.id === sprintId) || null;
    onSprintChange?.(selectedSprint);
  };

  const handleStartSprint = (sprint: Sprint) => {
    updateSprintMutation.mutate({
      sprintId: sprint.id,
      updates: { status: "active" },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
        <div className="w-4 h-4 border-2 border-[#C0745F] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading sprints...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Sprint Selector */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50">
          <Target className="w-4 h-4 text-[#C0745F] dark:text-[#D4917A]" />
          <Select
            value={activeSprint?.id || ""}
            onValueChange={handleSprintChange}
          >
            <SelectTrigger className="w-[200px] h-8 border-0 bg-transparent focus:ring-0">
              <SelectValue placeholder="No active sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.length === 0 ? (
                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                  No sprints yet
                </div>
              ) : (
                sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>{sprint.name}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          sprint.status === "active" &&
                            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                          sprint.status === "planning" &&
                            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                          sprint.status === "completed" &&
                            "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {sprint.status}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* New Sprint Button */}
        <Button
          variant="default"
          size="sm"
          className="h-8"
          onClick={() => setIsNewSprintModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Sprint
        </Button>

        {/* Start Sprint Button (for planning sprints) */}
        {activeSprint?.status === "planning" && (
          <Button
            variant="default"
            size="sm"
            className="h-8 bg-green-600 hover:bg-green-700"
            onClick={() => handleStartSprint(activeSprint)}
            disabled={updateSprintMutation.isPending}
          >
            Start Sprint
          </Button>
        )}
      </div>

      {/* New Sprint Modal */}
      <NewSprintModal
        projectId={projectId}
        isOpen={isNewSprintModalOpen}
        onClose={() => setIsNewSprintModalOpen(false)}
      />
    </>
  );
}
