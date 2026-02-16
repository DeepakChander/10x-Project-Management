/**
 * Task Dependency Types
 *
 * Types for blocking relationships between tasks.
 * task_id IS BLOCKED BY depends_on_id.
 */

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  dependency_type: "blocks";
  created_at: string;
}

export interface TaskDependencyWithTitle extends TaskDependency {
  depends_on_title: string;
  depends_on_status: string;
}

export interface CreateDependencyRequest {
  depends_on_id: string;
}

/**
 * Map of task_id -> { blocks, blocked_by } for efficient lookup.
 * Used by BoardView/TableView to show blocked indicators on cards.
 */
export interface TaskDependencyMap {
  [taskId: string]: {
    blocks: TaskDependencyWithTitle[];
    blocked_by: TaskDependencyWithTitle[];
  };
}
