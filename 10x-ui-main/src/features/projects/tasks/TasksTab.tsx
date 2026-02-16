import { Filter, LayoutGrid, Plus, Table } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useToast } from "../../shared/hooks/useToast";
import { DeleteConfirmModal } from "../../ui/components/DeleteConfirmModal";
import { Button, Card } from "../../ui/primitives";
import { cn, glassmorphism } from "../../ui/primitives/styles";
import { TaskEditModal } from "./components/TaskEditModal";
import { useDeleteTask, useProjectDependencies, useProjectTasks, useUpdateTask } from "./hooks";
import type { Task, TaskPriority } from "./types";
import { getReorderTaskOrder, ORDER_INCREMENT, validateTaskOrder } from "./utils";
import { BoardView, TableView } from "./views";

interface TasksTabProps {
  projectId: string;
}

export const TasksTab = ({ projectId }: TasksTabProps) => {
  const [viewMode, setViewMode] = useState<"table" | "board">("board");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");

  // Fetch tasks using TanStack Query
  const { data: tasks = [], isLoading: isLoadingTasks } = useProjectTasks(projectId);

  // Fetch dependencies for blocked indicators
  const { data: dependencyMap } = useProjectDependencies(projectId);

  const { showToast } = useToast();

  // Mutations for task operations
  const updateTaskMutation = useUpdateTask(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);

  // Filter tasks by priority
  const filteredTasks = useMemo(() => {
    if (priorityFilter === "all") return tasks as Task[];
    return (tasks as Task[]).filter((t) => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  // Modal management functions
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  // Delete modal management functions
  const openDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;

    deleteTaskMutation.mutate(taskToDelete.id, {
      onSuccess: () => {
        closeDeleteModal();
      },
      onError: (error) => {
        console.error("Failed to delete task:", error);
      },
    });
  };

  // Get default order for new tasks in a status
  const getDefaultTaskOrder = useCallback((statusTasks: Task[]) => {
    if (statusTasks.length === 0) return ORDER_INCREMENT;
    const maxOrder = Math.max(...statusTasks.map((t) => t.task_order));
    return maxOrder + ORDER_INCREMENT;
  }, []);

  // Task reordering - immediate update
  const handleTaskReorder = useCallback(
    async (taskId: string, targetIndex: number, status: Task["status"]) => {
      // Get all tasks in the target status, sorted by current order
      const statusTasks = (tasks as Task[])
        .filter((task) => task.status === status)
        .sort((a, b) => a.task_order - b.task_order);

      const movingTaskIndex = statusTasks.findIndex((task) => task.id === taskId);
      if (movingTaskIndex === -1 || targetIndex < 0 || targetIndex > statusTasks.length) return;
      if (movingTaskIndex === targetIndex) return;

      // Calculate new position using battle-tested utility
      const newPosition = getReorderTaskOrder(statusTasks, taskId, targetIndex);

      // Update immediately with optimistic updates
      try {
        await updateTaskMutation.mutateAsync({
          taskId,
          updates: {
            task_order: newPosition,
          },
        });
      } catch (error) {
        console.error("Failed to reorder task:", error, {
          taskId,
          newPosition,
        });
        // Error toast handled by mutation
      }
    },
    [tasks, updateTaskMutation],
  );

  // Move task to different status
  const moveTask = useCallback(
    async (taskId: string, newStatus: Task["status"]) => {
      const movingTask = (tasks as Task[]).find((task) => task.id === taskId);
      if (!movingTask || movingTask.status === newStatus) return;

      // Client-side block: prevent moving to "doing" when blocked
      if (newStatus === "doing" && dependencyMap?.[taskId]) {
        const blockers = dependencyMap[taskId].blocked_by?.filter((dep) => dep.depends_on_status !== "done") ?? [];
        if (blockers.length > 0) {
          const names = blockers
            .slice(0, 3)
            .map((b) => b.depends_on_title)
            .join(", ");
          const suffix = blockers.length > 3 ? ` (+${blockers.length - 3} more)` : "";
          showToast(`Cannot move to 'doing': blocked by ${names}${suffix}`, "error");
          return;
        }
      }

      try {
        // Calculate position for new status
        const tasksInNewStatus = (tasks as Task[]).filter((t) => t.status === newStatus);
        const newOrder = getDefaultTaskOrder(tasksInNewStatus);

        // Update via mutation (handles optimistic updates)
        await updateTaskMutation.mutateAsync({
          taskId,
          updates: {
            status: newStatus,
            task_order: newOrder,
          },
        });

        // Success handled by mutation
      } catch (error) {
        console.error("Failed to move task:", error, { taskId, newStatus });
        // Error toast handled by mutation
      }
    },
    [tasks, updateTaskMutation, getDefaultTaskOrder, dependencyMap, showToast],
  );

  const completeTask = useCallback(
    (taskId: string) => {
      moveTask(taskId, "done");
    },
    [moveTask],
  );

  // Inline update for task fields
  const updateTaskInline = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Validate task_order if present (ensures integer precision)
      const processedUpdates = { ...updates };
      if (processedUpdates.task_order !== undefined) {
        processedUpdates.task_order = validateTaskOrder(processedUpdates.task_order);
      }

      await updateTaskMutation.mutateAsync({
        taskId,
        updates: processedUpdates,
      });
    } catch (error) {
      console.error("Failed to update task:", error, { taskId, updates });
      // Error toast handled by mutation
    }
  };

  if (isLoadingTasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C0745F]"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-[70vh] relative">
        {/* Main content - Table or Board view */}
        <div className="relative h-[calc(100vh-220px)] overflow-auto">
          {viewMode === "table" ? (
            <TableView
              tasks={filteredTasks}
              projectId={projectId}
              onTaskView={openEditModal}
              onTaskComplete={completeTask}
              onTaskDelete={openDeleteModal}
              onTaskReorder={handleTaskReorder}
              onTaskUpdate={updateTaskInline}
              dependencyMap={dependencyMap}
            />
          ) : (
            <BoardView
              tasks={filteredTasks}
              projectId={projectId}
              onTaskMove={moveTask}
              onTaskReorder={handleTaskReorder}
              onTaskEdit={openEditModal}
              onTaskDelete={openDeleteModal}
              dependencyMap={dependencyMap}
            />
          )}
        </div>

        {/* Fixed View Controls using Radix primitives */}
        <ViewControls
          viewMode={viewMode}
          onViewChange={setViewMode}
          onAddTask={openCreateModal}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />

        {/* Edit/Create Task Modal */}
        <TaskEditModal isModalOpen={isModalOpen} editingTask={editingTask} projectId={projectId} onClose={closeModal} />

        {/* Delete Task Modal */}
        <DeleteConfirmModal
          open={showDeleteModal}
          itemName={taskToDelete?.title || ""}
          onConfirm={confirmDeleteTask}
          onCancel={closeDeleteModal}
          onOpenChange={setShowDeleteModal}
          type="task"
          size="compact"
        />
      </div>
    </DndProvider>
  );
};

// Priority filter options
type PriorityFilterValue = "all" | TaskPriority;

const PRIORITY_FILTER_OPTIONS: Array<{ value: PriorityFilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// Extracted ViewControls component using Radix primitives
interface ViewControlsProps {
  viewMode: "table" | "board";
  onViewChange: (mode: "table" | "board") => void;
  onAddTask: () => void;
  priorityFilter: PriorityFilterValue;
  onPriorityFilterChange: (value: PriorityFilterValue) => void;
}

const ViewControls = ({
  viewMode,
  onViewChange,
  onAddTask,
  priorityFilter,
  onPriorityFilterChange,
}: ViewControlsProps) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="flex items-center gap-4">
        {/* Add Task Button with Glassmorphism */}
        <Button
          onClick={onAddTask}
          variant="outline"
          className={cn(
            "pointer-events-auto relative",
            glassmorphism.background.subtle,
            glassmorphism.border.default,
            glassmorphism.shadow.elevated,
            "text-[#C0745F] dark:text-[#D4917A]",
            "hover:text-[#A85A45] dark:hover:text-[#C0745F]",
            "transition-all duration-300",
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Task</span>
          {/* Glow effect */}
          <span
            className={cn(
              "absolute bottom-0 left-0 right-0 h-[2px]",
              "bg-gradient-to-r from-transparent via-[#C0745F] to-transparent",
              "shadow-sm",
            )}
          />
        </Button>

        {/* Priority Filter with Glassmorphism */}
        <Card
          blur="lg"
          transparency="medium"
          size="none"
          className="flex items-center overflow-hidden pointer-events-auto rounded-lg"
        >
          <div className="flex items-center gap-1 px-2">
            <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </div>
          {PRIORITY_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriorityFilterChange(option.value)}
              className={cn(
                "px-3 py-2.5 text-sm transition-all duration-300",
                priorityFilter === option.value
                  ? "text-[#C0745F] dark:text-[#D4917A] font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </Card>

        {/* View Toggle Controls with Glassmorphism */}
        <Card
          blur="lg"
          transparency="medium"
          size="none"
          className="flex items-center overflow-hidden pointer-events-auto rounded-lg"
        >
          <button
            type="button"
            onClick={() => onViewChange("table")}
            aria-label="Switch to table view"
            aria-pressed={viewMode === "table"}
            className={cn(
              "px-5 py-2.5 flex items-center gap-2 relative transition-all duration-300",
              viewMode === "table"
                ? "text-[#C0745F] dark:text-[#D4917A]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300",
            )}
          >
            <Table className="w-4 h-4" aria-hidden="true" />
            <span>Table</span>
            {viewMode === "table" && (
              <span
                className={cn(
                  "absolute bottom-0 left-[15%] right-[15%] w-[70%] mx-auto h-[2px]",
                  "bg-[#C0745F]",
                  "shadow-sm",
                )}
              />
            )}
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
          <button
            type="button"
            onClick={() => onViewChange("board")}
            aria-label="Switch to board view"
            aria-pressed={viewMode === "board"}
            className={cn(
              "px-5 py-2.5 flex items-center gap-2 relative transition-all duration-300",
              viewMode === "board"
                ? "text-[#C0745F] dark:text-[#D4917A]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300",
            )}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span>Board</span>
            {viewMode === "board" && (
              <span
                className={cn(
                  "absolute bottom-0 left-[15%] right-[15%] w-[70%] mx-auto h-[2px]",
                  "bg-[#C0745F]",
                  "shadow-sm",
                )}
              />
            )}
          </button>
        </Card>
      </div>
    </div>
  );
};
