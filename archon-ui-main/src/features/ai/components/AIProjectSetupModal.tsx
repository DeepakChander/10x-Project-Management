/**
 * AI Project Setup Modal (Magic Moment)
 *
 * Shows AI-generated task suggestions after a new project is created.
 * Users can review, remove individual tasks, then accept or skip.
 */

import { AlertTriangle, BrainCircuit, CheckCircle2, Clock, Loader2, Lock, Sparkles, Trash2, User, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { taskService } from "../../projects/tasks/services/taskService";
import type { CreateTaskRequest } from "../../projects/tasks/types";
import { useToast } from "../../shared/hooks/useToast";
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
import { useRecordAIFeedback, useSuggestProjectSetup, type AITaskSuggestion } from "../hooks/useAIQueries";

interface AIProjectSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  onTasksCreated?: (count: number) => void;
}

function confidenceLabel(confidence: number): { text: string; color: string } {
  if (confidence >= 0.8) return { text: "Expert", color: "text-emerald-400" };
  if (confidence >= 0.6) return { text: "Confident", color: "text-blue-400" };
  if (confidence >= 0.3) return { text: "Learning", color: "text-yellow-400" };
  return { text: "Exploring", color: "text-gray-400" };
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "low":
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
}

export const AIProjectSetupModal: React.FC<AIProjectSetupModalProps> = ({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  projectDescription,
  onTasksCreated,
}) => {
  const { showToast } = useToast();
  const suggestMutation = useSuggestProjectSetup();
  const feedbackMutation = useRecordAIFeedback();

  const [tasks, setTasks] = useState<AITaskSuggestion[]>([]);
  const [suggestionId, setSuggestionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [extraDescription, setExtraDescription] = useState(projectDescription ?? "");
  const [needsDescription, setNeedsDescription] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSuggest = (description: string) => {
    setNeedsDescription(false);
    setErrorMessage(null);
    setTasks([]);
    setSuggestionId(null);

    suggestMutation.mutate(
      { projectId, title: projectTitle, description },
      {
        onSuccess: (data) => {
          if (data.needs_description) {
            // Ask the user for a better description instead of closing
            setNeedsDescription(true);
            return;
          }
          setTasks(data.suggested_tasks);
          setSuggestionId(data.suggestion_id);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          // Show actionable error — likely missing API key
          setErrorMessage(msg);
        },
      }
    );
  };

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (!open || !projectId) return;
    setExtraDescription(projectDescription ?? "");
    runSuggest(projectDescription ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkip = () => {
    if (suggestionId) {
      feedbackMutation.mutate({ suggestionId, userResponse: "rejected" });
    }
    onOpenChange(false);
  };

  const handleAccept = async () => {
    if (tasks.length === 0) return;

    setIsCreating(true);
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const taskData: CreateTaskRequest = {
        project_id: projectId,
        title: t.title,
        description: t.description ?? "",
        status: "todo",
        assignee: t.assignee || "User",
        priority: (t.priority as CreateTaskRequest["priority"]) ?? "medium",
        task_order: (tasks.length - i) * 10,
      };

      try {
        await taskService.createTask(taskData);
        created++;
      } catch {
        errors.push(t.title);
      }
    }

    setIsCreating(false);

    if (suggestionId) {
      feedbackMutation.mutate({
        suggestionId,
        userResponse: errors.length === 0 ? "accepted" : "modified",
        modifications: errors.length > 0 ? { failed_tasks: errors } : undefined,
      });
    }

    if (created > 0) {
      showToast(`${created} task${created === 1 ? "" : "s"} created from AI suggestions`, "success");
      onTasksCreated?.(created);
    }
    if (errors.length > 0) {
      showToast(`${errors.length} task${errors.length === 1 ? "" : "s"} could not be created`, "error");
    }

    onOpenChange(false);
  };

  const isLoading = suggestMutation.isPending;
  const data = suggestMutation.data;
  const confidence = data ? confidenceLabel(data.confidence) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !isCreating && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-[#C0745F]" />
            <span className="bg-gradient-to-r from-[#C0745F] to-[#A85A45] text-transparent bg-clip-text">
              AI Task Suggestions
            </span>
            {confidence && (
              <span className={cn("text-xs font-normal ml-1", confidence.color)}>
                · {confidence.text}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Analyzing your project to suggest a task structure…"
              : `${tasks.length} task${tasks.length === 1 ? "" : "s"} suggested for "${projectTitle}". Remove any you don't need, then accept.`}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <BrainCircuit className="w-10 h-10 animate-pulse text-[#C0745F]" />
              <span className="text-sm">Generating task suggestions…</span>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-300">AI suggestions unavailable</p>
                  <p className="text-xs text-gray-400">
                    Your OpenAI API key is not configured. Go to{" "}
                    <strong className="text-white">Settings → AI Agent</strong> and paste your key, then try again.
                  </p>
                </div>
              </div>
            </div>
          ) : needsDescription ? (
            <div className="flex flex-col gap-3 py-2">
              <p className="text-sm text-gray-400">
                Add a short description so the AI knows what to build.
              </p>
              <textarea
                rows={4}
                value={extraDescription}
                onChange={(e) => setExtraDescription(e.target.value)}
                placeholder="e.g. A customer portal where users can manage subscriptions, view invoices, and submit support tickets. Needs SSO and role-based access."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C0745F]/60 focus:ring-1 focus:ring-[#C0745F]/30 resize-none"
              />
              <button
                type="button"
                onClick={() => runSuggest(extraDescription)}
                disabled={extraDescription.trim().length < 20}
                className="self-start px-4 py-2 rounded-lg bg-[#C0745F] hover:bg-[#A85A45] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Generate suggestions
              </button>
              <p className="text-xs text-gray-500">Minimum 20 characters needed.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <CheckCircle2 className="w-8 h-8" />
              <span className="text-sm">All tasks removed</span>
            </div>
          ) : (
            <ul className="space-y-2 pr-1">
              {tasks.map((task, index) => (
                <li
                  key={index}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg p-3",
                    "bg-white/5 border border-white/10",
                    "hover:border-[#C0745F]/40 transition-colors"
                  )}
                >
                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{task.title}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide shrink-0",
                          priorityColor(task.priority)
                        )}
                      >
                        {task.priority}
                      </span>
                      {task.agent_suitable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border bg-violet-500/20 text-violet-300 border-violet-500/30 font-medium shrink-0">
                          AI-ready
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {task.task_type && (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {task.task_type}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignee}
                      </span>
                      {task.estimated_days && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{task.estimated_days}d
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className={cn(
                      "shrink-0 p-1 rounded text-gray-500 opacity-0 group-hover:opacity-100",
                      "hover:text-red-400 hover:bg-red-500/10 transition-all"
                    )}
                    aria-label="Remove task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="mt-4 flex-row justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading || isCreating}
            className="text-gray-400"
          >
            <X className="w-4 h-4 mr-1.5" />
            Skip
          </Button>

          <Button
            type="button"
            onClick={handleAccept}
            disabled={isLoading || isCreating || tasks.length === 0}
            className="shadow-sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Accept {tasks.length > 0 ? `${tasks.length} ` : ""}Task{tasks.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
