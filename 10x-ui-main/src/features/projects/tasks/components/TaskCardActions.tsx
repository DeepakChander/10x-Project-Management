import { Clipboard, Edit, Trash2 } from "lucide-react";
import type React from "react";
import { useToast } from "@/features/shared/hooks/useToast";
import { cn, glassmorphism } from "../../../ui/primitives/styles";
import { SimpleTooltip } from "../../../ui/primitives/tooltip";

interface TaskCardActionsProps {
  taskId: string;
  taskTitle: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const TaskCardActions: React.FC<TaskCardActionsProps> = ({
  taskId,
  taskTitle,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const { showToast } = useToast();

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(taskId);
      showToast("Task ID copied to clipboard", "success");
    } catch {
      // Fallback for older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = taskId;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Task ID copied to clipboard", "success");
      } catch {
        showToast("Failed to copy Task ID", "error");
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <SimpleTooltip content={isDeleting ? "Deleting..." : "Delete task"}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeleting) onDelete();
          }}
          disabled={isDeleting}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            "transition-all duration-300",
            glassmorphism.priority.critical.background,
            glassmorphism.priority.critical.text,
            glassmorphism.priority.critical.hover,
            glassmorphism.priority.critical.glow,
            isDeleting && "opacity-50 cursor-not-allowed",
          )}
          aria-label={isDeleting ? "Deleting task..." : `Delete ${taskTitle}`}
        >
          <Trash2 className={cn("w-3 h-3", isDeleting && "animate-pulse")} />
        </button>
      </SimpleTooltip>

      <SimpleTooltip content="Edit task">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            "transition-all duration-300",
            "bg-[#C0745F]/10 dark:bg-[#C0745F]/20",
            "text-[#C0745F] dark:text-[#D4917A]",
            "hover:bg-[#C0745F]/20 dark:hover:bg-[#C0745F]/30",
            "hover:shadow-sm",
          )}
          aria-label={`Edit ${taskTitle}`}
        >
          <Edit className="w-3 h-3" />
        </button>
      </SimpleTooltip>

      <SimpleTooltip content="Copy Task ID">
        <button
          type="button"
          onClick={handleCopyId}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            "transition-all duration-300",
            glassmorphism.priority.low.background,
            glassmorphism.priority.low.text,
            glassmorphism.priority.low.hover,
            glassmorphism.priority.low.glow,
          )}
          aria-label="Copy Task ID"
        >
          <Clipboard className="w-3 h-3" />
        </button>
      </SimpleTooltip>
    </div>
  );
};
