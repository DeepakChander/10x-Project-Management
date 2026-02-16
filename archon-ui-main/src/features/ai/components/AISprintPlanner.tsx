/**
 * AI Sprint Planner Component
 *
 * Button and modal for AI-powered sprint planning
 */

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/primitives/dialog";
import { cn } from "../../ui/primitives/styles";
import { usePlanSprint } from "../hooks/useAIQueries";
import type { SprintPlan } from "../services/aiService";

interface AISprintPlannerProps {
  projectId: string;
  capacityHours: number;
  onPlanAccepted?: (taskIds: string[]) => void;
}

export function AISprintPlanner({
  projectId,
  capacityHours,
  onPlanAccepted,
}: AISprintPlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SprintPlan | null>(null);

  const planSprintMutation = usePlanSprint();

  const handleGeneratePlan = () => {
    planSprintMutation.mutate(
      { projectId, capacityHours },
      {
        onSuccess: (plan) => {
          setCurrentPlan(plan);
          setIsOpen(true);
        },
      }
    );
  };

  const handleAcceptPlan = () => {
    if (currentPlan) {
      onPlanAccepted?.(currentPlan.recommended_tasks);
      setIsOpen(false);
      setCurrentPlan(null);
    }
  };

  return (
    <>
      {/* AI Plan Sprint Button */}
      <Button
        variant="default"
        size="sm"
        className={cn(
          "h-8 gap-1.5",
          "bg-gradient-to-r from-purple-600 to-pink-600",
          "hover:from-purple-700 hover:to-pink-700"
        )}
        onClick={handleGeneratePlan}
        disabled={planSprintMutation.isPending}
      >
        <Sparkles className="w-4 h-4" />
        {planSprintMutation.isPending ? "Planning..." : "AI Plan Sprint"}
      </Button>

      {/* Sprint Plan Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Sprint Plan
            </DialogTitle>
            <DialogDescription>
              AI analyzed your backlog and recommends these tasks for the sprint.
            </DialogDescription>
          </DialogHeader>

          {currentPlan && (
            <div className="space-y-4 py-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {currentPlan.recommended_tasks.length}
                  </div>
                </div>

                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Story Points</div>
                  <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                    {currentPlan.total_story_points}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Capacity</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {Math.round(currentPlan.capacity_utilization * 100)}%
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Capacity Utilization</span>
                  <span className="font-medium">{Math.round(currentPlan.capacity_utilization * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      currentPlan.capacity_utilization > 0.9
                        ? "bg-red-500"
                        : currentPlan.capacity_utilization > 0.7
                          ? "bg-orange-500"
                          : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(currentPlan.capacity_utilization * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Warnings */}
              {currentPlan.warnings.length > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                    Warnings:
                  </div>
                  {currentPlan.warnings.map((warning, idx) => (
                    <div key={idx} className="text-sm text-orange-700 dark:text-orange-300">
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  AI Reasoning:
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPlan.reasoning}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptPlan}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Accept Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
