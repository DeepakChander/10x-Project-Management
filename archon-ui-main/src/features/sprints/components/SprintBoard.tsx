/**
 * Sprint Board Component
 *
 * Kanban-style board showing tasks in current sprint
 */

import { Target } from "lucide-react";
import { useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useProjectTasks } from "../../projects/tasks/hooks/useTaskQueries";
import { cn } from "../../ui/primitives/styles";
import type { Task } from "../../projects/tasks/types/task";
import { TaskCard } from "../../projects/tasks/components/TaskCard";

interface SprintBoardProps {
  projectId: string;
  sprintId: string | null;
  className?: string;
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-pink-500" },
  { id: "doing", title: "In Progress", color: "bg-[#C0745F]" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
] as const;

export function SprintBoard({ projectId, sprintId, className }: SprintBoardProps) {
  const { data: allTasks = [], isLoading } = useProjectTasks(projectId);

  // Filter tasks in current sprint and group by status
  const tasksByStatus = useMemo(() => {
    // TEMPORARY: Show ALL tasks to debug (remove sprint filter)
    console.log("SprintBoard Debug:", {
      totalTasks: allTasks.length,
      sprintId,
      firstTask: allTasks[0],
      hasSprintId: allTasks[0]?.sprint_id,
    });

    // TEMPORARY: Use all tasks instead of filtering by sprint
    const sprintTasks = allTasks;

    console.log("Tasks to display:", sprintTasks.length);

    return {
      todo: sprintTasks.filter((t) => t.status === "todo" || t.status === "backlog"),
      doing: sprintTasks.filter((t) => t.status === "doing"),
      review: sprintTasks.filter((t) => t.status === "review"),
      done: sprintTasks.filter((t) => t.status === "done"),
    };
  }, [allTasks, sprintId]);

  const totalTasks = Object.values(tasksByStatus).reduce((sum, tasks) => sum + tasks.length, 0);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C0745F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading sprint tasks...</p>
        </div>
      </div>
    );
  }

  if (!sprintId) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No active sprint</p>
          <p className="text-sm text-gray-500">Create a sprint to start planning tasks</p>
        </div>
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No tasks in this sprint</p>
          <p className="text-sm text-gray-500">Assign tasks to this sprint to get started</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("w-full", className)}>
        {/* Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", column.color)} />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {column.title}
                </h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {tasksByStatus[column.id].length}
              </span>
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-2 min-h-[200px] p-2 bg-gray-50/30 dark:bg-gray-900/30 rounded-lg border border-gray-200/30 dark:border-gray-800/30">
              {tasksByStatus[column.id].length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs text-gray-400 dark:text-gray-600">
                  No tasks
                </div>
              ) : (
                tasksByStatus[column.id].map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    projectId={projectId}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </DndProvider>
  );
}
