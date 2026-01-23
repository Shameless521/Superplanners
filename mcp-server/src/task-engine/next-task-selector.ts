import type { Task, TaskPriority, NextTaskInfo } from '../types.js';
import { areDependenciesMet } from './dependency-resolver.js';

/**
 * 优先级权重映射
 */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * 解析预估时间字符串，返回分钟数
 * 支持格式: 1h, 30m, 2d
 */
function parseEstimate(estimate?: string): number {
  if (!estimate) return Infinity;

  const match = estimate.match(/^(\d+(?:\.\d+)?)(h|m|d)?$/i);
  if (!match) return Infinity;

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'h').toLowerCase();

  switch (unit) {
    case 'm':
      return value;
    case 'h':
      return value * 60;
    case 'd':
      return value * 60 * 8; // 假设一天 8 小时
    default:
      return value * 60;
  }
}

/**
 * 选择下一个可执行的任务
 * 按优先级和预估时间排序，选择最优先且预估时间最短的任务
 */
export function selectNextTask(tasks: Task[]): NextTaskInfo {
  // 筛选出待处理且依赖已满足的任务
  const candidates = tasks.filter((task) => {
    if (task.status !== 'pending') return false;
    return areDependenciesMet(tasks, task.id);
  });

  if (candidates.length === 0) {
    return null;
  }

  // 按优先级降序、预估时间升序排序
  candidates.sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const estimateA = parseEstimate(a.estimate);
    const estimateB = parseEstimate(b.estimate);
    return estimateA - estimateB;
  });

  const selected = candidates[0];
  return {
    id: selected.id,
    title: selected.title,
  };
}

/**
 * 获取无可执行任务的原因
 */
export function getNextTaskReason(tasks: Task[]): string {
  // 检查是否全部完成
  const allCompleted = tasks.every(
    (t) => t.status === 'completed' || t.status === 'skipped'
  );
  if (allCompleted) {
    return '所有任务已完成';
  }

  // 检查阻塞任务
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  if (blockedCount > 0) {
    return `存在 ${blockedCount} 个阻塞任务`;
  }

  // 检查依赖未满足的任务
  const pendingWithUnmetDeps = tasks.filter(
    (t) => t.status === 'pending' && !areDependenciesMet(tasks, t.id)
  );
  if (pendingWithUnmetDeps.length > 0) {
    return `${pendingWithUnmetDeps.length} 个任务的依赖未完成`;
  }

  // 检查进行中的任务
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  if (inProgressCount > 0) {
    return `${inProgressCount} 个任务正在进行中`;
  }

  return '无可执行任务';
}

/**
 * 获取下一个任务或无法执行的原因
 */
export function getNextTaskOrReason(
  tasks: Task[]
): { next: NextTaskInfo; reason?: string } {
  const next = selectNextTask(tasks);
  if (next) {
    return { next };
  }
  return { next: null, reason: getNextTaskReason(tasks) };
}
