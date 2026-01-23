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
