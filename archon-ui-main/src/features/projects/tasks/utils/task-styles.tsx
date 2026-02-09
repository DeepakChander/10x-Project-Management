import { Bot, User } from "lucide-react";
import type { Assignee } from "../types";

// Drag and drop constants
export const ItemTypes = {
  TASK: "task",
};

// Get icon for assignee
export const getAssigneeIcon = (assigneeName: Assignee) => {
  switch (assigneeName) {
    case "User":
      return <User className="w-4 h-4 text-[#C0745F]" />;
    case "Coding Agent":
      return <Bot className="w-4 h-4 text-[#D4917A]" />;
    case "Archon":
      return <img src="/logo-10x.png" alt="10x" className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4 text-[#C0745F]" />;
  }
};

// Get glow effect for assignee
export const getAssigneeGlow = (assigneeName: Assignee) => {
  switch (assigneeName) {
    case "User":
      return "shadow-sm";
    case "Coding Agent":
      return "shadow-sm";
    case "Archon":
      return "shadow-sm";
    default:
      return "shadow-sm";
  }
};

// Get color based on task priority/order
export const getOrderColor = (order: number) => {
  if (order <= 3) return "bg-rose-500 dark:bg-rose-400";
  if (order <= 6) return "bg-orange-500 dark:bg-orange-400";
  if (order <= 10) return "bg-[#C0745F] dark:bg-[#D4917A]";
  return "bg-green-500 dark:bg-green-400";
};

// Get glow effect based on task priority/order
export const getOrderGlow = (order: number) => {
  if (order <= 3) return "shadow-[0_0_10px_rgba(244,63,94,0.7)]";
  if (order <= 6) return "shadow-[0_0_10px_rgba(249,115,22,0.7)]";
  if (order <= 10) return "shadow-sm";
  return "shadow-[0_0_10px_rgba(34,197,94,0.7)]";
};

// Get column header color based on status
export const getColumnColor = (status: "todo" | "doing" | "review" | "done") => {
  switch (status) {
    case "todo":
      return "text-gray-600 dark:text-gray-400";
    case "doing":
      return "text-[#C0745F] dark:text-[#D4917A]";
    case "review":
      return "text-[#C0745F] dark:text-[#D4917A]";
    case "done":
      return "text-green-600 dark:text-green-400";
  }
};

// Get column header glow based on status
export const getColumnGlow = (status: "todo" | "doing" | "review" | "done") => {
  switch (status) {
    case "todo":
      return "bg-gray-500/30 dark:bg-gray-400/40";
    case "doing":
      return "bg-[#C0745F]/30 dark:bg-[#C0745F]/40 shadow-sm";
    case "review":
      return "bg-[#C0745F]/30 dark:bg-[#D4917A]/40 shadow-sm";
    case "done":
      return "bg-green-500/30 dark:bg-green-400/40 shadow-[0_0_10px_2px_rgba(34,197,94,0.2)] dark:shadow-[0_0_10px_2px_rgba(74,222,128,0.3)]";
  }
};
