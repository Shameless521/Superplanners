import type { Task, TaskSummary, ProgressInfo } from '../types.js';
import { traverseTasks } from './parser.js';

/**
 * 计算任务统计摘要
 * 递归统计所有任务（包括子任务）的状态
 */
export function calculateTaskSummary(tasks: Task[]): TaskSummary {
  const summary: TaskSummary = {
    total: 0,
    completed: 0,
    in_progress: 0,
    blocked: 0,
    pending: 0,
    skipped: 0,
  };

  traverseTasks(tasks, (task) => {
    summary.total++;

    switch (task.status) {
      case 'completed':
        summary.completed++;
        break;
      case 'in_progress':
        summary.in_progress++;
        break;
      case 'blocked':
        summary.blocked++;
        break;
      case 'pending':
        summary.pending++;
        break;
      case 'skipped':
        summary.skipped++;
        break;
    }
  });

  return summary;
}

/**
 * 计算完成进度和百分比
 */
export function calculateProgress(tasks: Task[]): ProgressInfo {
  const summary = calculateTaskSummary(tasks);

  const percentage =
    summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  return {
    completed: summary.completed,
    total: summary.total,
    percentage,
  };
}

/**
 * 生成进度字符串 (如 3/12)
 */
export function formatProgressString(tasks: Task[]): string {
  const summary = calculateTaskSummary(tasks);
  return `${summary.completed}/${summary.total}`;
}
