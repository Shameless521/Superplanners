import YAML from 'yaml';
import {
  ProjectData,
  ProjectDataSchema,
  TaskPlan,
  TaskPlanSchema,
} from '../types.js';

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseProjectData(yamlContent: string): ParseResult<ProjectData> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = ProjectDataSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Schema 校验失败: ' + result.error.message,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: 'YAML 解析失败: ' + (e instanceof Error ? e.message : String(e)),
    };
  }
}

export function parseTaskPlan(yamlContent: string): ParseResult<TaskPlan> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = TaskPlanSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Schema 校验失败: ' + result.error.message,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: 'YAML 解析失败: ' + (e instanceof Error ? e.message : String(e)),
    };
  }
}

import type { Task, SubTask } from '../types.js';

export type TaskLookupResult = {
  task: Task | SubTask;
  isSubtask: boolean;
  parentId?: string;
};

export function findTaskById(
  tasks: Task[],
  taskId: string
): TaskLookupResult | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return { task, isSubtask: false };
    }

    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        if (subtask.id === taskId) {
          return { task: subtask, isSubtask: true, parentId: task.id };
        }
      }
    }
  }

  return null;
}

export function traverseTasks(
  tasks: Task[],
  callback: (task: Task | SubTask, isSubtask: boolean, parentId?: string) => void
): void {
  for (const task of tasks) {
    callback(task, false);

    if (task.subtasks) {
      for (const subtask of task.subtasks) {
        callback(subtask, true, task.id);
      }
    }
  }
}

export function getAllTasks(tasks: Task[]): (Task | SubTask)[] {
  const result: (Task | SubTask)[] = [];

  traverseTasks(tasks, (task) => {
    result.push(task);
  });

  return result;
}
