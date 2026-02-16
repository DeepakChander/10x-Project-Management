/**
 * AI Suggestions Panel Component
 *
 * Shows pending AI suggestions with accept/reject actions
 */

import { CheckCircle, Sparkles, X } from "lucide-react";
import { Button } from "../../ui/primitives/button";
import { cn } from "../../ui/primitives/styles";
import { useAcceptSuggestion, useAISuggestions } from "../hooks/useAIQueries";
import type { AISuggestion } from "../services/aiService";

interface AISuggestionsPanelProps {
  projectId: string;
  className?: string;
}

// Icon and color mapping for suggestion types
const suggestionStyles: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  task_estimation: {
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  sprint_planning: {
    icon: Sparkles,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
  },
  priority_suggestion: {
    icon: Sparkles,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  dependency_detection: {
    icon: Sparkles,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  capacity_warning: {
    icon: Sparkles,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
};

function SuggestionItem({ suggestion }: { suggestion: AISuggestion }) {
  const acceptSuggestionMutation = useAcceptSuggestion();

  const style = suggestionStyles[suggestion.type] || suggestionStyles.task_estimation;
  const Icon = style.icon;

  const handleAccept = () => {
    acceptSuggestionMutation.mutate(suggestion.id);
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        style.bgColor,
        "border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn("w-5 h-5", style.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {suggestion.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {suggestion.description}
          </p>

          {/* Confidence */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full",
                  suggestion.confidence > 0.8
                    ? "bg-green-500"
                    : suggestion.confidence > 0.6
                      ? "bg-yellow-500"
                      : "bg-orange-500"
                )}
                style={{ width: `${suggestion.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAccept}
              disabled={acceptSuggestionMutation.isPending}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                /* TODO: Reject suggestion */
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AISuggestionsPanel({ projectId, className }: AISuggestionsPanelProps) {
  const { data: suggestions = [], isLoading } = useAISuggestions({
    project_id: projectId,
    pending_only: true,
  });

  if (isLoading) {
    return (
      <div className={cn("p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50", className)}>
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Suggestions</h3>
        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
          {suggestions.length} pending
        </span>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionItem key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}
