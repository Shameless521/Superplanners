# SuperPlanners 实施计划 - 第二批：Task Engine 核心模块

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 Task Engine 的 5 个核心子模块，这是 SuperPlanners 的"心脏"

**Architecture:** Task Engine 采用纯函数设计，所有状态变更都是 immutable 的。模块间通过类型接口解耦。

**Tech Stack:** TypeScript, Zod (验证), Vitest (测试)

**前置条件:** 第一批（基础设施 + 核心类型）已完成

---

## Task 1: 实现 Task Graph Parser - YAML 解析

**Files:**
- Create: `mcp-server/src/task-engine/parser.ts`
- Create: `mcp-server/src/task-engine/parser.test.ts`
- Create: `mcp-server/src/task-engine/index.ts`

**Step 1: 创建 task-engine 模块入口**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
```

**Step 2: 编写 Parser 测试**

```typescript
// mcp-server/src/task-engine/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseProjectData, parseTaskPlan } from './parser.js';

const validProjectYaml = `
meta:
  project: 用户登录功能
  project_id: user-login
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:30:00Z"
  version: 1

tasks:
  - id: "1"
    title: 后端API开发
    status: in_progress
    priority: high
    subtasks:
      - id: "1.1"
        title: 设计接口规范
        status: completed
      - id: "1.2"
        title: 实现验证逻辑
        status: pending
  - id: "2"
    title: 前端开发
    status: pending
    priority: medium
    dependencies:
      - "1"
`;

const validTaskPlanYaml = `
meta:
  name: SuperPlanners
  version: "1.0.0"
  updated: "2025-01-23T10:30:00Z"

projects:
  - project_id: user-login
    project: 用户登录功能
    status: active
    updated: "2025-01-23T10:30:00Z"
    path: user-login/tasks.yaml
`;

describe('Parser', () => {
  describe('parseProjectData', () => {
    it('should parse valid project YAML', () => {
      const result = parseProjectData(validProjectYaml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.project_id).toBe('user-login');
        expect(result.data.tasks).toHaveLength(2);
        expect(result.data.tasks[0].subtasks).toHaveLength(2);
      }
    });

    it('should return error for invalid YAML', () => {
      const result = parseProjectData('invalid: yaml: syntax:');
      expect(result.success).toBe(false);
    });

    it('should return error for missing required fields', () => {
      const result = parseProjectData(`
meta:
  project: test
tasks: []
`);
      expect(result.success).toBe(false);
    });
  });

  describe('parseTaskPlan', () => {
    it('should parse valid task plan YAML', () => {
      const result = parseTaskPlan(validTaskPlanYaml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projects).toHaveLength(1);
        expect(result.data.projects[0].project_id).toBe('user-login');
      }
    });
  });
});
```

**Step 3: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/parser.test.ts`

Expected: FAIL - parser.js 模块不存在

**Step 4: 实现 Parser**

```typescript
// mcp-server/src/task-engine/parser.ts
import YAML from 'yaml';
import {
  ProjectData,
  ProjectDataSchema,
  TaskPlan,
  TaskPlanSchema,
} from '../types.js';

// 解析结果类型
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 解析项目数据 YAML (tasks.yaml)
 */
export function parseProjectData(yamlContent: string): ParseResult<ProjectData> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = ProjectDataSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: `Schema 校验失败: ${result.error.message}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: `YAML 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * 解析任务计划索引 YAML (task-plan.yaml)
 */
export function parseTaskPlan(yamlContent: string): ParseResult<TaskPlan> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = TaskPlanSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: `Schema 校验失败: ${result.error.message}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: `YAML 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/parser.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现 YAML 解析器

- parseProjectData: 解析 tasks.yaml
- parseTaskPlan: 解析 task-plan.yaml
- 使用 Zod 进行 Schema 校验
- 返回类型安全的解析结果"
```

---

## Task 2: 实现 Task Graph Parser - 任务查找和遍历

**Files:**
- Modify: `mcp-server/src/task-engine/parser.ts`
- Modify: `mcp-server/src/task-engine/parser.test.ts`

**Step 1: 添加查找和遍历测试**

```typescript
// 在 parser.test.ts 中添加
import { findTaskById, traverseTasks, getAllTasks } from './parser.js';
import type { Task, SubTask } from '../types.js';

describe('Task Lookup', () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: '任务1',
      status: 'in_progress',
      priority: 'high',
      subtasks: [
        { id: '1.1', title: '子任务1.1', status: 'completed' },
        { id: '1.2', title: '子任务1.2', status: 'pending' },
      ],
    },
    {
      id: '2',
      title: '任务2',
      status: 'pending',
      priority: 'medium',
    },
  ];

  describe('findTaskById', () => {
    it('should find top-level task', () => {
      const result = findTaskById(tasks, '1');
      expect(result).not.toBeNull();
      expect(result?.task.title).toBe('任务1');
      expect(result?.isSubtask).toBe(false);
    });

    it('should find subtask', () => {
      const result = findTaskById(tasks, '1.1');
      expect(result).not.toBeNull();
      expect(result?.task.title).toBe('子任务1.1');
      expect(result?.isSubtask).toBe(true);
      expect(result?.parentId).toBe('1');
    });

    it('should return null for non-existent task', () => {
      const result = findTaskById(tasks, '999');
      expect(result).toBeNull();
    });
  });

  describe('traverseTasks', () => {
    it('should visit all tasks including subtasks', () => {
      const visited: string[] = [];
      traverseTasks(tasks, (task) => {
        visited.push(task.id);
      });
      expect(visited).toEqual(['1', '1.1', '1.2', '2']);
    });
  });

  describe('getAllTasks', () => {
    it('should return flat list of all tasks', () => {
      const all = getAllTasks(tasks);
      expect(all).toHaveLength(4);
      expect(all.map((t) => t.id)).toEqual(['1', '1.1', '1.2', '2']);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/parser.test.ts`

Expected: FAIL

**Step 3: 实现查找和遍历函数**

```typescript
// 在 parser.ts 中添加
import type { Task, SubTask } from '../types.js';

// 任务查找结果
export type TaskLookupResult = {
  task: Task | SubTask;
  isSubtask: boolean;
  parentId?: string;
};

/**
 * 根据 ID 查找任务（包括子任务）
 */
export function findTaskById(
  tasks: Task[],
  taskId: string
): TaskLookupResult | null {
  for (const task of tasks) {
    // 检查顶级任务
    if (task.id === taskId) {
      return { task, isSubtask: false };
    }

    // 检查子任务
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

/**
 * 遍历所有任务（包括子任务）
 * 按深度优先顺序遍历
 */
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

/**
 * 获取所有任务的扁平列表（包括子任务）
 */
export function getAllTasks(tasks: Task[]): (Task | SubTask)[] {
  const result: (Task | SubTask)[] = [];

  traverseTasks(tasks, (task) => {
    result.push(task);
  });

  return result;
}
```

**Step 4: 更新 index.ts 导出**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/parser.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现任务查找和遍历

- findTaskById: 支持查找 Task 和 SubTask
- traverseTasks: 深度优先遍历所有任务
- getAllTasks: 获取扁平任务列表"
```

---

## Task 3: 实现 Status Reducer - 状态变更纯函数

**Files:**
- Create: `mcp-server/src/task-engine/status-reducer.ts`
- Create: `mcp-server/src/task-engine/status-reducer.test.ts`

**Step 1: 编写状态变更测试**

```typescript
// mcp-server/src/task-engine/status-reducer.test.ts
import { describe, it, expect } from 'vitest';
import { updateTaskStatus } from './status-reducer.js';
import type { Task } from '../types.js';

describe('Status Reducer', () => {
  const createTasks = (): Task[] => [
    {
      id: '1',
      title: '任务1',
      status: 'pending',
      priority: 'high',
      subtasks: [
        { id: '1.1', title: '子任务1.1', status: 'pending' },
        { id: '1.2', title: '子任务1.2', status: 'pending' },
      ],
    },
    {
      id: '2',
      title: '任务2',
      status: 'pending',
      priority: 'medium',
    },
  ];

  describe('updateTaskStatus', () => {
    it('should update top-level task status', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '1', 'in_progress');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[0].status).toBe('in_progress');
        expect(result.tasks[0].started_at).toBeDefined();
        // 原数组不应被修改
        expect(tasks[0].status).toBe('pending');
      }
    });

    it('should update subtask status', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '1.1', 'completed');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[0].subtasks![0].status).toBe('completed');
      }
    });

    it('should set completed_at when status is completed', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '2', 'completed');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[1].completed_at).toBeDefined();
      }
    });

    it('should return error for non-existent task', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '999', 'completed');

      expect(result.success).toBe(false);
    });

    it('should be immutable - not modify original array', () => {
      const tasks = createTasks();
      const originalTask = tasks[0];

      updateTaskStatus(tasks, '1', 'in_progress');

      expect(tasks[0]).toBe(originalTask);
      expect(tasks[0].status).toBe('pending');
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/status-reducer.test.ts`

Expected: FAIL

**Step 3: 实现 Status Reducer**

```typescript
// mcp-server/src/task-engine/status-reducer.ts
import type { Task, SubTask, TaskStatus } from '../types.js';

export type UpdateResult =
  | { success: true; tasks: Task[] }
  | { success: false; error: string };

/**
 * 更新任务状态（纯函数，immutable）
 */
export function updateTaskStatus(
  tasks: Task[],
  taskId: string,
  newStatus: TaskStatus,
  notes?: string
): UpdateResult {
  const now = new Date().toISOString();
  let found = false;

  const newTasks = tasks.map((task) => {
    // 检查是否是目标顶级任务
    if (task.id === taskId) {
      found = true;
      return updateTask(task, newStatus, now, notes);
    }

    // 检查子任务
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

  // 设置开始时间
  if (newStatus === 'in_progress' && !task.started_at) {
    updated.started_at = now;
  }

  // 设置完成时间
  if (newStatus === 'completed' && !task.completed_at) {
    updated.completed_at = now;
  }

  // 更新备注
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
```

**Step 4: 更新 index.ts 导出**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
export * from './status-reducer.js';
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/status-reducer.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现状态变更纯函数

- updateTaskStatus: 更新 Task 或 SubTask 状态
- 自动设置 started_at 和 completed_at 时间戳
- 完全 immutable，不修改原数组"
```

---

## Task 4: 实现 Status Reducer - 状态转换校验

**Files:**
- Modify: `mcp-server/src/task-engine/status-reducer.ts`
- Modify: `mcp-server/src/task-engine/status-reducer.test.ts`

**Step 1: 添加状态转换校验测试**

```typescript
// 在 status-reducer.test.ts 中添加
import { validateStatusTransition, updateTaskStatusWithValidation } from './status-reducer.js';

describe('Status Transition Validation', () => {
  describe('validateStatusTransition', () => {
    it('should allow pending -> in_progress', () => {
      expect(validateStatusTransition('pending', 'in_progress').valid).toBe(true);
    });

    it('should allow pending -> completed (fast track)', () => {
      expect(validateStatusTransition('pending', 'completed').valid).toBe(true);
    });

    it('should allow in_progress -> completed', () => {
      expect(validateStatusTransition('in_progress', 'completed').valid).toBe(true);
    });

    it('should allow in_progress -> blocked', () => {
      expect(validateStatusTransition('in_progress', 'blocked').valid).toBe(true);
    });

    it('should allow blocked -> in_progress', () => {
      expect(validateStatusTransition('blocked', 'in_progress').valid).toBe(true);
    });

    it('should NOT allow completed -> pending', () => {
      const result = validateStatusTransition('completed', 'pending');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should NOT allow completed -> in_progress', () => {
      const result = validateStatusTransition('completed', 'in_progress');
      expect(result.valid).toBe(false);
    });

    it('should allow same status (no-op)', () => {
      expect(validateStatusTransition('pending', 'pending').valid).toBe(true);
    });
  });

  describe('updateTaskStatusWithValidation', () => {
    const createTasks = (): Task[] => [
      {
        id: '1',
        title: '任务1',
        status: 'completed',
        priority: 'high',
      },
    ];

    it('should reject invalid transition', () => {
      const tasks = createTasks();
      const result = updateTaskStatusWithValidation(tasks, '1', 'pending');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('不允许');
      }
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/status-reducer.test.ts`

Expected: FAIL

**Step 3: 实现状态转换校验**

```typescript
// 在 status-reducer.ts 中添加

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * 有效的状态转换规则
 * - pending -> in_progress, completed, skipped, blocked
 * - in_progress -> completed, blocked, skipped
 * - blocked -> in_progress, skipped
 * - completed -> (不可变更)
 * - skipped -> (不可变更)
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['pending', 'in_progress', 'completed', 'blocked', 'skipped'],
  in_progress: ['in_progress', 'completed', 'blocked', 'skipped'],
  blocked: ['blocked', 'in_progress', 'skipped'],
  completed: ['completed'], // 只允许保持不变
  skipped: ['skipped'], // 只允许保持不变
};

/**
 * 校验状态转换是否合法
 */
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

/**
 * 带校验的状态更新
 */
export function updateTaskStatusWithValidation(
  tasks: Task[],
  taskId: string,
  newStatus: TaskStatus,
  notes?: string
): UpdateResult {
  // 先查找任务获取当前状态
  const found = findTaskForValidation(tasks, taskId);

  if (!found) {
    return { success: false, error: `任务 ${taskId} 不存在` };
  }

  // 校验状态转换
  const validation = validateStatusTransition(found.status, newStatus);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // 执行更新
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
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/status-reducer.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现状态转换校验

- validateStatusTransition: 校验状态转换合法性
- updateTaskStatusWithValidation: 带校验的状态更新
- completed 和 skipped 状态不可回退"
```

---

## Task 5: 实现 Dependency Resolver - 依赖关系解析

**Files:**
- Create: `mcp-server/src/task-engine/dependency-resolver.ts`
- Create: `mcp-server/src/task-engine/dependency-resolver.test.ts`

**Step 1: 编写依赖解析测试**

```typescript
// mcp-server/src/task-engine/dependency-resolver.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  detectCircularDependency,
  getTaskDependencies,
} from './dependency-resolver.js';
import type { Task } from '../types.js';

describe('Dependency Resolver', () => {
  describe('buildDependencyGraph', () => {
    it('should build dependency graph from tasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
        {
          id: '3',
          title: '任务3',
          status: 'pending',
          priority: 'high',
          dependencies: ['1', '2'],
        },
      ];

      const graph = buildDependencyGraph(tasks);
      expect(graph.get('1')).toEqual([]);
      expect(graph.get('2')).toEqual(['1']);
      expect(graph.get('3')).toEqual(['1', '2']);
    });
  });

  describe('detectCircularDependency', () => {
    it('should detect circular dependency', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: '任务1',
          status: 'pending',
          priority: 'high',
          dependencies: ['3'],
        },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
        {
          id: '3',
          title: '任务3',
          status: 'pending',
          priority: 'high',
          dependencies: ['2'],
        },
      ];

      const result = detectCircularDependency(tasks);
      expect(result.hasCircle).toBe(true);
      expect(result.cycle).toBeDefined();
    });

    it('should return no circle for valid dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const result = detectCircularDependency(tasks);
      expect(result.hasCircle).toBe(false);
    });
  });

  describe('getTaskDependencies', () => {
    it('should return task dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const deps = getTaskDependencies(tasks, '2');
      expect(deps).toEqual(['1']);
    });

    it('should return empty array for task without dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
      ];

      const deps = getTaskDependencies(tasks, '1');
      expect(deps).toEqual([]);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/dependency-resolver.test.ts`

Expected: FAIL

**Step 3: 实现依赖关系解析**

```typescript
// mcp-server/src/task-engine/dependency-resolver.ts
import type { Task } from '../types.js';

export type DependencyGraph = Map<string, string[]>;

export type CircularCheckResult =
  | { hasCircle: false }
  | { hasCircle: true; cycle: string[] };

/**
 * 构建依赖图
 */
export function buildDependencyGraph(tasks: Task[]): DependencyGraph {
  const graph = new Map<string, string[]>();

  for (const task of tasks) {
    graph.set(task.id, task.dependencies ?? []);
  }

  return graph;
}

/**
 * 检测循环依赖（DFS）
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
        // 发现循环
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
 * 获取任务的依赖列表
 */
export function getTaskDependencies(tasks: Task[], taskId: string): string[] {
  const task = tasks.find((t) => t.id === taskId);
  return task?.dependencies ?? [];
}
```

**Step 4: 更新 index.ts 导出**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
export * from './status-reducer.js';
export * from './dependency-resolver.js';
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/dependency-resolver.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现依赖关系解析

- buildDependencyGraph: 构建依赖图
- detectCircularDependency: DFS 检测循环依赖
- getTaskDependencies: 获取任务依赖列表"
```

---

## Task 6: 实现 Dependency Resolver - 依赖完成状态检查

**Files:**
- Modify: `mcp-server/src/task-engine/dependency-resolver.ts`
- Modify: `mcp-server/src/task-engine/dependency-resolver.test.ts`

**Step 1: 添加依赖完成检查测试**

```typescript
// 在 dependency-resolver.test.ts 中添加
import { areDependenciesMet, getUnmetDependencies } from './dependency-resolver.js';

describe('Dependency Completion Check', () => {
  const tasks: Task[] = [
    { id: '1', title: '任务1', status: 'completed', priority: 'high' },
    { id: '2', title: '任务2', status: 'in_progress', priority: 'high' },
    {
      id: '3',
      title: '任务3',
      status: 'pending',
      priority: 'high',
      dependencies: ['1'],
    },
    {
      id: '4',
      title: '任务4',
      status: 'pending',
      priority: 'high',
      dependencies: ['1', '2'],
    },
  ];

  describe('areDependenciesMet', () => {
    it('should return true when all dependencies completed', () => {
      expect(areDependenciesMet(tasks, '3')).toBe(true);
    });

    it('should return false when some dependencies not completed', () => {
      expect(areDependenciesMet(tasks, '4')).toBe(false);
    });

    it('should return true for task without dependencies', () => {
      expect(areDependenciesMet(tasks, '1')).toBe(true);
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return empty array when all met', () => {
      expect(getUnmetDependencies(tasks, '3')).toEqual([]);
    });

    it('should return unmet dependency IDs', () => {
      const unmet = getUnmetDependencies(tasks, '4');
      expect(unmet).toEqual(['2']);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/dependency-resolver.test.ts`

Expected: FAIL

**Step 3: 实现依赖完成检查**

```typescript
// 在 dependency-resolver.ts 中添加

/**
 * 检查任务的所有依赖是否已完成
 */
export function areDependenciesMet(tasks: Task[], taskId: string): boolean {
  const dependencies = getTaskDependencies(tasks, taskId);

  if (dependencies.length === 0) {
    return true;
  }

  return dependencies.every((depId) => {
    const depTask = tasks.find((t) => t.id === depId);
    return depTask?.status === 'completed';
  });
}

/**
 * 获取未完成的依赖列表
 */
export function getUnmetDependencies(tasks: Task[], taskId: string): string[] {
  const dependencies = getTaskDependencies(tasks, taskId);

  return dependencies.filter((depId) => {
    const depTask = tasks.find((t) => t.id === depId);
    return depTask?.status !== 'completed';
  });
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/dependency-resolver.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现依赖完成状态检查

- areDependenciesMet: 检查所有依赖是否已完成
- getUnmetDependencies: 获取未完成的依赖列表"
```

---

## Task 7: 实现 Progress Calculator - 任务统计计算

**Files:**
- Create: `mcp-server/src/task-engine/progress-calculator.ts`
- Create: `mcp-server/src/task-engine/progress-calculator.test.ts`

**Step 1: 编写任务统计测试**

```typescript
// mcp-server/src/task-engine/progress-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTaskSummary, calculateProgress } from './progress-calculator.js';
import type { Task } from '../types.js';

describe('Progress Calculator', () => {
  describe('calculateTaskSummary', () => {
    it('should calculate summary for tasks with subtasks', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: '任务1',
          status: 'in_progress',
          priority: 'high',
          subtasks: [
            { id: '1.1', title: '子任务1.1', status: 'completed' },
            { id: '1.2', title: '子任务1.2', status: 'pending' },
          ],
        },
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
        { id: '3', title: '任务3', status: 'blocked', priority: 'low' },
      ];

      const summary = calculateTaskSummary(tasks);

      // 总数: 任务1(不含subtask) + 子任务1.1 + 子任务1.2 + 任务2 + 任务3 = 5
      // 或者只计算叶子节点: 子任务1.1 + 子任务1.2 + 任务2 + 任务3 = 4
      // 根据 PRD，应该递归统计所有任务
      expect(summary.total).toBe(5);
      expect(summary.completed).toBe(2); // 1.1 + 2
      expect(summary.in_progress).toBe(1); // 1
      expect(summary.blocked).toBe(1); // 3
      expect(summary.pending).toBe(1); // 1.2
      expect(summary.skipped).toBe(0);
    });

    it('should handle empty tasks', () => {
      const summary = calculateTaskSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.completed).toBe(0);
    });

    it('should handle tasks without subtasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'pending', priority: 'medium' },
      ];

      const summary = calculateTaskSummary(tasks);

      expect(summary.total).toBe(2);
      expect(summary.completed).toBe(1);
      expect(summary.pending).toBe(1);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress percentage', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
        { id: '3', title: '任务3', status: 'pending', priority: 'low' },
        { id: '4', title: '任务4', status: 'pending', priority: 'low' },
      ];

      const progress = calculateProgress(tasks);

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(50);
    });

    it('should handle zero tasks', () => {
      const progress = calculateProgress([]);

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/progress-calculator.test.ts`

Expected: FAIL

**Step 3: 实现任务统计计算**

```typescript
// mcp-server/src/task-engine/progress-calculator.ts
import type { Task, TaskSummary, ProgressInfo } from '../types.js';
import { traverseTasks } from './parser.js';

/**
 * 计算任务统计摘要（递归包含 subtasks）
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
 * 计算完成进度
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
 * 生成进度字符串（如 "3/12"）
 */
export function formatProgressString(tasks: Task[]): string {
  const summary = calculateTaskSummary(tasks);
  return `${summary.completed}/${summary.total}`;
}
```

**Step 4: 更新 index.ts 导出**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
export * from './status-reducer.js';
export * from './dependency-resolver.js';
export * from './progress-calculator.js';
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/progress-calculator.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现任务统计计算

- calculateTaskSummary: 递归统计所有任务状态
- calculateProgress: 计算完成进度和百分比
- formatProgressString: 生成进度字符串 (如 3/12)"
```

---

## Task 8: 实现 Next Task Selector - 下一任务推荐算法

**Files:**
- Create: `mcp-server/src/task-engine/next-task-selector.ts`
- Create: `mcp-server/src/task-engine/next-task-selector.test.ts`

**Step 1: 编写推荐算法测试**

```typescript
// mcp-server/src/task-engine/next-task-selector.test.ts
import { describe, it, expect } from 'vitest';
import { selectNextTask, getNextTaskReason } from './next-task-selector.js';
import type { Task } from '../types.js';

describe('Next Task Selector', () => {
  describe('selectNextTask', () => {
    it('should select pending task with met dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const next = selectNextTask(tasks);
      expect(next).not.toBeNull();
      expect(next?.id).toBe('2');
    });

    it('should NOT select task with unmet dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'in_progress', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const next = selectNextTask(tasks);
      expect(next).toBeNull();
    });

    it('should prioritize by priority: critical > high > medium > low', () => {
      const tasks: Task[] = [
        { id: '1', title: '低优先级', status: 'pending', priority: 'low' },
        { id: '2', title: '中优先级', status: 'pending', priority: 'medium' },
        { id: '3', title: '紧急', status: 'pending', priority: 'critical' },
        { id: '4', title: '高优先级', status: 'pending', priority: 'high' },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('3'); // critical
    });

    it('should prioritize by estimate when priority is same', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: '长任务',
          status: 'pending',
          priority: 'high',
          estimate: '8h',
        },
        {
          id: '2',
          title: '短任务',
          status: 'pending',
          priority: 'high',
          estimate: '1h',
        },
        {
          id: '3',
          title: '中任务',
          status: 'pending',
          priority: 'high',
          estimate: '4h',
        },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('2'); // 最短的
    });

    it('should return null when all tasks completed', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
      ];

      const next = selectNextTask(tasks);
      expect(next).toBeNull();
    });

    it('should skip blocked and in_progress tasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '进行中', status: 'in_progress', priority: 'critical' },
        { id: '2', title: '阻塞', status: 'blocked', priority: 'critical' },
        { id: '3', title: '待开始', status: 'pending', priority: 'low' },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('3');
    });
  });

  describe('getNextTaskReason', () => {
    it('should return reason when all completed', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
      ];

      const reason = getNextTaskReason(tasks);
      expect(reason).toContain('已完成');
    });

    it('should return reason when blocked by dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'in_progress', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const reason = getNextTaskReason(tasks);
      expect(reason).toContain('依赖');
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/task-engine/next-task-selector.test.ts`

Expected: FAIL

**Step 3: 实现下一任务推荐算法**

```typescript
// mcp-server/src/task-engine/next-task-selector.ts
import type { Task, TaskPriority, NextTaskInfo } from '../types.js';
import { areDependenciesMet } from './dependency-resolver.js';

// 优先级权重
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * 解析预估时间为分钟数
 */
function parseEstimate(estimate?: string): number {
  if (!estimate) return Infinity; // 无预估放到最后

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
 * 选择下一个推荐任务
 *
 * 规则：
 * 1. status == pending
 * 2. 所有 dependencies 均为 completed
 * 3. 按 priority: critical → high → medium → low
 * 4. 按 estimate: 短 → 长
 */
export function selectNextTask(tasks: Task[]): NextTaskInfo {
  // 筛选可执行任务
  const candidates = tasks.filter((task) => {
    // 只选择 pending 状态
    if (task.status !== 'pending') return false;

    // 检查依赖是否满足
    return areDependenciesMet(tasks, task.id);
  });

  if (candidates.length === 0) {
    return null;
  }

  // 排序
  candidates.sort((a, b) => {
    // 先按优先级排序（高优先级在前）
    const priorityDiff =
      PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 再按预估时间排序（短时间在前）
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

  // 检查是否有阻塞任务
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  if (blockedCount > 0) {
    return `存在 ${blockedCount} 个阻塞任务`;
  }

  // 检查是否依赖未满足
  const pendingWithUnmetDeps = tasks.filter(
    (t) => t.status === 'pending' && !areDependenciesMet(tasks, t.id)
  );
  if (pendingWithUnmetDeps.length > 0) {
    return `${pendingWithUnmetDeps.length} 个任务的依赖未完成`;
  }

  // 检查是否有进行中的任务
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  if (inProgressCount > 0) {
    return `${inProgressCount} 个任务正在进行中`;
  }

  return '无可执行任务';
}

/**
 * 获取下一任务或原因
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
```

**Step 4: 更新 index.ts 导出**

```typescript
// mcp-server/src/task-engine/index.ts
export * from './parser.js';
export * from './status-reducer.js';
export * from './dependency-resolver.js';
export * from './progress-calculator.js';
export * from './next-task-selector.js';
```

**Step 5: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/task-engine/next-task-selector.test.ts`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/task-engine/
git commit -m "feat(task-engine): 实现下一任务推荐算法

- selectNextTask: 按优先级和预估时间选择下一任务
- getNextTaskReason: 返回无可执行任务的原因
- 支持 h/m/d 预估时间格式解析"
```

---

## Task 9: 运行所有 Task Engine 测试

**Step 1: 运行所有测试**

Run: `cd mcp-server && npm run test:run`

Expected: 所有测试通过

**Step 2: 检查测试覆盖率**

Run: `cd mcp-server && npm run test:run -- --coverage`

Expected: Task Engine 模块覆盖率 > 80%

**Step 3: 验证编译**

Run: `cd mcp-server && npm run build`

Expected: 编译成功，无错误

**Step 4: Commit 最终状态**

```bash
git add .
git commit -m "test(task-engine): 完成所有单元测试

- Parser: YAML 解析、任务查找遍历
- Status Reducer: 状态变更、转换校验
- Dependency Resolver: 依赖解析、循环检测
- Progress Calculator: 任务统计、进度计算
- Next Task Selector: 推荐算法、原因说明"
```

---

## 第二批完成检查点

**完成的模块:**
1. ✅ Task Graph Parser
   - parseProjectData / parseTaskPlan
   - findTaskById / traverseTasks / getAllTasks
2. ✅ Status Reducer
   - updateTaskStatus (immutable)
   - validateStatusTransition
   - updateTaskStatusWithValidation
3. ✅ Dependency Resolver
   - buildDependencyGraph
   - detectCircularDependency
   - areDependenciesMet / getUnmetDependencies
4. ✅ Progress Calculator
   - calculateTaskSummary
   - calculateProgress
   - formatProgressString
5. ✅ Next Task Selector
   - selectNextTask
   - getNextTaskReason

**验证命令:**

```bash
cd mcp-server && npm run test:run && npm run build
```

Expected: 所有测试通过，编译成功

---

## 下一批预告

第三批将实现 **IO 层**：
- File Manager (YAML 读写、目录管理、归档)
- Markdown Renderer (生成可读视图)

文件: `docs/plans/2026-01-24-superplanners-implementation-batch3.md`
