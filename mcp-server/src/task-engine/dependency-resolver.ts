import type { Task } from '../types.js';

// 依赖图类型：任务ID -> 依赖的任务ID列表
export type DependencyGraph = Map<string, string[]>;

// 循环依赖检测结果类型
export type CircularCheckResult =
  | { hasCircle: false }
  | { hasCircle: true; cycle: string[] };

/**
 * 构建依赖图
 * @param tasks 任务列表
 * @returns 依赖图（Map）
 */
export function buildDependencyGraph(tasks: Task[]): DependencyGraph {
  const graph = new Map<string, string[]>();

  for (const task of tasks) {
    graph.set(task.id, task.dependencies ?? []);
  }

  return graph;
}

/**
 * 检测循环依赖
 * 使用 DFS 算法检测有向图中的环
 * @param tasks 任务列表
 * @returns 检测结果，包含是否有环及环的路径
 */
export function detectCircularDependency(tasks: Task[]): CircularCheckResult {
  const graph = buildDependencyGraph(tasks);
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const dependencies = graph.get(nodeId) ?? [];
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      } else if (recStack.has(dep)) {
        // 发现环：从环的起点到当前节点，再加上起点形成闭环
        const cycleStart = path.indexOf(dep);
        return path.slice(cycleStart).concat(dep);
      }
    }

    path.pop();
    recStack.delete(nodeId);
    return null;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      const cycle = dfs(task.id);
      if (cycle) {
        return { hasCircle: true, cycle };
      }
    }
  }

  return { hasCircle: false };
}

/**
 * 获取任务的直接依赖列表
 * @param tasks 任务列表
 * @param taskId 任务ID
 * @returns 依赖的任务ID列表
 */
export function getTaskDependencies(tasks: Task[], taskId: string): string[] {
  const task = tasks.find((t) => t.id === taskId);
  return task?.dependencies ?? [];
}
