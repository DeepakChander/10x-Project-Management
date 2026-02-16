/**
 * AI Estimation Badge Component
 *
 * Shows AI-suggested story points on task cards
 */

import { Sparkles } from "lucide-react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/primitives/tooltip";
import { useEstimateTask } from "../hooks/useAIQueries";

interface AIEstimationBadgeProps {
  taskId: string;
  projectId: string;
  currentStoryPoints?: number;
  onEstimationAccepted?: (storyPoints: number) => void;
}

export function AIEstimationBadge({
  taskId,
  projectId,
  currentStoryPoints,
  onEstimationAccepted,
}: AIEstimationBadgeProps) {
  const estimateTaskMutation = useEstimateTask();

  const handleGetEstimation = () => {
    estimateTaskMutation.mutate({ taskId, projectId });
  };

  // If task already has story points, don't show the badge
  if (currentStoryPoints && currentStoryPoints > 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs gap-1",
            "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
            "hover:from-purple-500/20 hover:to-pink-500/20",
            "border border-purple-300/30 dark:border-purple-500/30",
            "text-purple-700 dark:text-purple-300"
          )}
          onClick={handleGetEstimation}
          disabled={estimateTaskMutation.isPending}
        >
          <Sparkles className="w-3 h-3" />
          {estimateTaskMutation.isPending ? "Estimating..." : "AI Estimate"}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Get AI story point estimation</p>
      </TooltipContent>
    </Tooltip>
  );
}
