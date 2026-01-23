import type { Task, SubTask, TaskStatus } from '../types.js';

export type UpdateResult =
  | { success: true; tasks: Task[] }
  | { success: false; error: string };

export function updateTaskStatus(
  tasks: Task[],
  taskId: string,
  newStatus: TaskStatus,
  notes?: string
): UpdateResult {
  const now = new Date().toISOString();
  let found = false;

  const newTasks = tasks.map((task) => {
    if (task.id === taskId) {
      found = true;
      return updateTask(task, newStatus, now, notes);
    }

    if (task.subtasks) {
      const subtaskIndex = task.subtasks.findIndex((st) => st.id === taskId);
      if (subtaskIndex !== -1) {
        found = true;
        const newSubtasks = [...task.subtasks];
        newSubtasks[subtaskIndex] = updateSubtask(
          newSubtasks[subtaskIndex],
          newStatus,
          notes
        );
        return { ...task, subtasks: newSubtasks };
      }
    }

    return task;
  });

  if (!found) {
    return { success: false, error: `任务 ${taskId} 不存在` };
  }

  return { success: true, tasks: newTasks };
}

function updateTask(
  task: Task,
  newStatus: TaskStatus,
  now: string,
  notes?: string
): Task {
  const updated: Task = { ...task, status: newStatus };

  if (newStatus === 'in_progress' && !task.started_at) {
    updated.started_at = now;
  }

  if (newStatus === 'completed' && !task.completed_at) {
    updated.completed_at = now;
  }

  if (notes !== undefined) {
    updated.notes = notes;
  }

  return updated;
}

function updateSubtask(
  subtask: SubTask,
  newStatus: TaskStatus,
  notes?: string
): SubTask {
  const updated: SubTask = { ...subtask, status: newStatus };

  if (notes !== undefined) {
    updated.notes = notes;
  }

  return updated;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['pending', 'in_progress', 'completed', 'blocked', 'skipped'],
  in_progress: ['in_progress', 'completed', 'blocked', 'skipped'],
  blocked: ['blocked', 'in_progress', 'skipped'],
  completed: ['completed'],
  skipped: ['skipped'],
};

export function validateStatusTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): ValidationResult {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (allowedTransitions.includes(newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `不允许从 ${currentStatus} 转换到 ${newStatus}`,
  };
}

export function updateTaskStatusWithValidation(
  tasks: Task[],
  taskId: string,
  newStatus: TaskStatus,
  notes?: string
): UpdateResult {
  const found = findTaskForValidation(tasks, taskId);

  if (!found) {
    return { success: false, error: `任务 ${taskId} 不存在` };
  }

  const validation = validateStatusTransition(found.status, newStatus);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  return updateTaskStatus(tasks, taskId, newStatus, notes);
}

function findTaskForValidation(
  tasks: Task[],
  taskId: string
): { status: TaskStatus } | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return { status: task.status };
    }
    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        if (subtask.id === taskId) {
          return { status: subtask.status };
        }
      }
    }
  }
  return null;
}
