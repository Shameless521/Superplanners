# SuperPlanners 实施计划 - 第五批：测试 + 文档 + 发布

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成所有单元测试、集成测试、项目文档和 npm 发布配置

**Architecture:** 使用 Vitest 进行测试，遵循 TDD 原则。测试分为单元测试（Task Engine）和集成测试（MCP Server）。

**Tech Stack:** Vitest, TypeScript

**前置条件:** 第一批到第四批已全部完成

---

## Task 1: Parser 单元测试

**Files:**
- Create: `mcp-server/src/task-engine/parser.test.ts`

**Step 1: 编写测试文件**

```typescript
// mcp-server/src/task-engine/parser.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTaskPlan,
  findTaskById,
  flattenTasks,
  validateTaskPlan
} from './parser.js';
import type { TaskPlan, Task } from '../types.js';

describe('Parser', () => {
  const validTaskPlan: TaskPlan = {
    meta: {
      id: 'test-project',
      name: '测试项目',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
    },
    epics: [
      {
        id: 'E1',
        title: 'Epic 1',
        features: [
          {
            id: 'F1.1',
            title: 'Feature 1.1',
            tasks: [
              {
                id: 'T1.1.1',
                title: 'Task 1.1.1',
                status: 'pending',
                priority: 'high',
                estimate: '1h',
              },
              {
                id: 'T1.1.2',
                title: 'Task 1.1.2',
                status: 'completed',
                priority: 'medium',
                estimate: '2h',
                depends_on: ['T1.1.1'],
              },
            ],
          },
        ],
      },
    ],
  };

  describe('parseTaskPlan', () => {
    it('应该解析有效的 YAML 字符串', () => {
      const yaml = `
meta:
  id: test-project
  name: 测试项目
  created: "2024-01-01T00:00:00Z"
  updated: "2024-01-01T00:00:00Z"
epics:
  - id: E1
    title: Epic 1
    features:
      - id: F1.1
        title: Feature 1.1
        tasks:
          - id: T1.1.1
            title: Task 1.1.1
            status: pending
            priority: high
            estimate: 1h
`;
      const result = parseTaskPlan(yaml);
      expect(result.meta.id).toBe('test-project');
      expect(result.epics).toHaveLength(1);
      expect(result.epics[0].features[0].tasks[0].status).toBe('pending');
    });

    it('应该拒绝无效的 YAML 结构', () => {
      const invalidYaml = `
meta:
  id: test
`;
      expect(() => parseTaskPlan(invalidYaml)).toThrow();
    });

    it('应该拒绝无效的状态值', () => {
      const invalidYaml = `
meta:
  id: test-project
  name: 测试项目
  created: "2024-01-01T00:00:00Z"
  updated: "2024-01-01T00:00:00Z"
epics:
  - id: E1
    title: Epic 1
    features:
      - id: F1.1
        title: Feature 1.1
        tasks:
          - id: T1.1.1
            title: Task 1.1.1
            status: invalid_status
            priority: high
            estimate: 1h
`;
      expect(() => parseTaskPlan(invalidYaml)).toThrow();
    });
  });

  describe('findTaskById', () => {
    it('应该找到存在的任务', () => {
      const task = findTaskById(validTaskPlan, 'T1.1.1');
      expect(task).not.toBeNull();
      expect(task?.id).toBe('T1.1.1');
      expect(task?.title).toBe('Task 1.1.1');
    });

    it('应该找到嵌套的子任务', () => {
      const planWithSubtasks: TaskPlan = {
        ...validTaskPlan,
        epics: [
          {
            ...validTaskPlan.epics[0],
            features: [
              {
                ...validTaskPlan.epics[0].features[0],
                tasks: [
                  {
                    id: 'T1.1.1',
                    title: 'Task 1.1.1',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    subtasks: [
                      {
                        id: 'T1.1.1.1',
                        title: 'Subtask',
                        status: 'pending',
                        priority: 'high',
                        estimate: '30m',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const subtask = findTaskById(planWithSubtasks, 'T1.1.1.1');
      expect(subtask).not.toBeNull();
      expect(subtask?.title).toBe('Subtask');
    });

    it('应该返回 null 当任务不存在', () => {
      const task = findTaskById(validTaskPlan, 'T999');
      expect(task).toBeNull();
    });
  });

  describe('flattenTasks', () => {
    it('应该扁平化所有任务', () => {
      const tasks = flattenTasks(validTaskPlan);
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.id)).toEqual(['T1.1.1', 'T1.1.2']);
    });

    it('应该包含子任务', () => {
      const planWithSubtasks: TaskPlan = {
        ...validTaskPlan,
        epics: [
          {
            ...validTaskPlan.epics[0],
            features: [
              {
                ...validTaskPlan.epics[0].features[0],
                tasks: [
                  {
                    id: 'T1.1.1',
                    title: 'Task',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    subtasks: [
                      {
                        id: 'T1.1.1.1',
                        title: 'Subtask',
                        status: 'pending',
                        priority: 'high',
                        estimate: '30m',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const tasks = flattenTasks(planWithSubtasks);
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.id)).toContain('T1.1.1.1');
    });
  });

  describe('validateTaskPlan', () => {
    it('应该验证有效的任务计划', () => {
      const result = validateTaskPlan(validTaskPlan);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测重复的任务 ID', () => {
      const duplicatePlan: TaskPlan = {
        ...validTaskPlan,
        epics: [
          {
            ...validTaskPlan.epics[0],
            features: [
              {
                ...validTaskPlan.epics[0].features[0],
                tasks: [
                  {
                    id: 'T1.1.1',
                    title: 'Task 1',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                  },
                  {
                    id: 'T1.1.1', // 重复 ID
                    title: 'Task 2',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = validateTaskPlan(duplicatePlan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('重复的任务 ID: T1.1.1');
    });

    it('应该检测无效的依赖引用', () => {
      const invalidDepPlan: TaskPlan = {
        ...validTaskPlan,
        epics: [
          {
            ...validTaskPlan.epics[0],
            features: [
              {
                ...validTaskPlan.epics[0].features[0],
                tasks: [
                  {
                    id: 'T1.1.1',
                    title: 'Task',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['T999'], // 不存在的依赖
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = validateTaskPlan(invalidDepPlan);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('T999'))).toBe(true);
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- parser.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/task-engine/parser.test.ts
git commit -m "test: 添加 Parser 单元测试"
```

---

## Task 2: Status Reducer 单元测试

**Files:**
- Create: `mcp-server/src/task-engine/status-reducer.test.ts`

**Step 1: 编写测试文件**

```typescript
// mcp-server/src/task-engine/status-reducer.test.ts
import { describe, it, expect } from 'vitest';
import {
  updateTaskStatus,
  isValidTransition,
  getValidTransitions,
  type StatusUpdateOptions
} from './status-reducer.js';
import type { TaskPlan, TaskStatus } from '../types.js';

describe('StatusReducer', () => {
  const createTestPlan = (): TaskPlan => ({
    meta: {
      id: 'test-project',
      name: '测试项目',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
    },
    epics: [
      {
        id: 'E1',
        title: 'Epic 1',
        features: [
          {
            id: 'F1.1',
            title: 'Feature 1.1',
            tasks: [
              {
                id: 'T1.1.1',
                title: 'Task 1',
                status: 'pending',
                priority: 'high',
                estimate: '1h',
              },
              {
                id: 'T1.1.2',
                title: 'Task 2',
                status: 'in_progress',
                priority: 'medium',
                estimate: '2h',
              },
              {
                id: 'T1.1.3',
                title: 'Task 3',
                status: 'blocked',
                priority: 'low',
                estimate: '1h',
              },
            ],
          },
        ],
      },
    ],
  });

  describe('isValidTransition', () => {
    it('pending -> in_progress 是有效的', () => {
      expect(isValidTransition('pending', 'in_progress')).toBe(true);
    });

    it('pending -> completed 是有效的', () => {
      expect(isValidTransition('pending', 'completed')).toBe(true);
    });

    it('pending -> blocked 是有效的', () => {
      expect(isValidTransition('pending', 'blocked')).toBe(true);
    });

    it('pending -> skipped 是有效的', () => {
      expect(isValidTransition('pending', 'skipped')).toBe(true);
    });

    it('in_progress -> completed 是有效的', () => {
      expect(isValidTransition('in_progress', 'completed')).toBe(true);
    });

    it('in_progress -> blocked 是有效的', () => {
      expect(isValidTransition('in_progress', 'blocked')).toBe(true);
    });

    it('in_progress -> pending 是有效的 (回退)', () => {
      expect(isValidTransition('in_progress', 'pending')).toBe(true);
    });

    it('blocked -> pending 是有效的 (解除阻塞)', () => {
      expect(isValidTransition('blocked', 'pending')).toBe(true);
    });

    it('blocked -> in_progress 是有效的', () => {
      expect(isValidTransition('blocked', 'in_progress')).toBe(true);
    });

    it('completed -> pending 是有效的 (重做)', () => {
      expect(isValidTransition('completed', 'pending')).toBe(true);
    });

    it('completed -> in_progress 是无效的', () => {
      expect(isValidTransition('completed', 'in_progress')).toBe(false);
    });

    it('skipped -> pending 是有效的 (恢复)', () => {
      expect(isValidTransition('skipped', 'pending')).toBe(true);
    });

    it('skipped -> completed 是无效的', () => {
      expect(isValidTransition('skipped', 'completed')).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('应该返回 pending 的有效转换', () => {
      const transitions = getValidTransitions('pending');
      expect(transitions).toContain('in_progress');
      expect(transitions).toContain('completed');
      expect(transitions).toContain('blocked');
      expect(transitions).toContain('skipped');
    });

    it('应该返回 completed 的有效转换', () => {
      const transitions = getValidTransitions('completed');
      expect(transitions).toContain('pending');
      expect(transitions).not.toContain('in_progress');
    });
  });

  describe('updateTaskStatus', () => {
    it('应该成功更新任务状态', () => {
      const plan = createTestPlan();
      const result = updateTaskStatus(plan, 'T1.1.1', 'in_progress');

      expect(result.success).toBe(true);
      expect(result.plan).not.toBe(plan); // immutable
      expect(result.plan!.epics[0].features[0].tasks[0].status).toBe('in_progress');
    });

    it('应该保持原始对象不变 (immutable)', () => {
      const plan = createTestPlan();
      const originalStatus = plan.epics[0].features[0].tasks[0].status;

      updateTaskStatus(plan, 'T1.1.1', 'in_progress');

      expect(plan.epics[0].features[0].tasks[0].status).toBe(originalStatus);
    });

    it('应该更新 meta.updated 时间戳', () => {
      const plan = createTestPlan();
      const originalUpdated = plan.meta.updated;

      const result = updateTaskStatus(plan, 'T1.1.1', 'in_progress');

      expect(result.plan!.meta.updated).not.toBe(originalUpdated);
    });

    it('应该添加 notes 当提供时', () => {
      const plan = createTestPlan();
      const result = updateTaskStatus(plan, 'T1.1.1', 'in_progress', {
        notes: '开始处理',
      });

      expect(result.plan!.epics[0].features[0].tasks[0].notes).toBe('开始处理');
    });

    it('应该拒绝无效的状态转换', () => {
      const plan = createTestPlan();
      // T1.1.2 是 in_progress，不能直接跳过
      const result = updateTaskStatus(plan, 'T1.1.2', 'skipped');

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效');
    });

    it('应该返回错误当任务不存在', () => {
      const plan = createTestPlan();
      const result = updateTaskStatus(plan, 'T999', 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('T999');
    });

    it('应该允许强制更新 (force: true)', () => {
      const plan = createTestPlan();
      const result = updateTaskStatus(plan, 'T1.1.2', 'skipped', { force: true });

      expect(result.success).toBe(true);
      expect(result.plan!.epics[0].features[0].tasks[1].status).toBe('skipped');
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- status-reducer.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/task-engine/status-reducer.test.ts
git commit -m "test: 添加 StatusReducer 单元测试"
```

---

## Task 3: Dependency Resolver 单元测试

**Files:**
- Create: `mcp-server/src/task-engine/dependency-resolver.test.ts`

**Step 1: 编写测试文件**

```typescript
// mcp-server/src/task-engine/dependency-resolver.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  detectCycles,
  areDependenciesMet,
  getBlockedReason,
  topologicalSort
} from './dependency-resolver.js';
import type { TaskPlan } from '../types.js';

describe('DependencyResolver', () => {
  const createPlanWithDeps = (): TaskPlan => ({
    meta: {
      id: 'test-project',
      name: '测试项目',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
    },
    epics: [
      {
        id: 'E1',
        title: 'Epic 1',
        features: [
          {
            id: 'F1.1',
            title: 'Feature 1.1',
            tasks: [
              {
                id: 'T1',
                title: 'Task 1',
                status: 'completed',
                priority: 'high',
                estimate: '1h',
              },
              {
                id: 'T2',
                title: 'Task 2',
                status: 'completed',
                priority: 'high',
                estimate: '1h',
              },
              {
                id: 'T3',
                title: 'Task 3',
                status: 'pending',
                priority: 'high',
                estimate: '1h',
                depends_on: ['T1', 'T2'],
              },
              {
                id: 'T4',
                title: 'Task 4',
                status: 'pending',
                priority: 'high',
                estimate: '1h',
                depends_on: ['T3'],
              },
              {
                id: 'T5',
                title: 'Task 5',
                status: 'pending',
                priority: 'high',
                estimate: '1h',
                depends_on: ['T1'],
              },
            ],
          },
        ],
      },
    ],
  });

  describe('buildDependencyGraph', () => {
    it('应该构建正确的依赖图', () => {
      const plan = createPlanWithDeps();
      const graph = buildDependencyGraph(plan);

      expect(graph.get('T3')).toEqual(['T1', 'T2']);
      expect(graph.get('T4')).toEqual(['T3']);
      expect(graph.get('T5')).toEqual(['T1']);
      expect(graph.get('T1')).toEqual([]);
      expect(graph.get('T2')).toEqual([]);
    });
  });

  describe('detectCycles', () => {
    it('应该返回 null 当没有循环依赖', () => {
      const plan = createPlanWithDeps();
      const cycle = detectCycles(plan);

      expect(cycle).toBeNull();
    });

    it('应该检测简单的循环依赖', () => {
      const cyclicPlan: TaskPlan = {
        meta: {
          id: 'cyclic',
          name: '循环依赖',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [
          {
            id: 'E1',
            title: 'Epic 1',
            features: [
              {
                id: 'F1.1',
                title: 'Feature 1.1',
                tasks: [
                  {
                    id: 'A',
                    title: 'Task A',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['B'],
                  },
                  {
                    id: 'B',
                    title: 'Task B',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['A'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const cycle = detectCycles(cyclicPlan);

      expect(cycle).not.toBeNull();
      expect(cycle).toContain('A');
      expect(cycle).toContain('B');
    });

    it('应该检测复杂的循环依赖', () => {
      const cyclicPlan: TaskPlan = {
        meta: {
          id: 'cyclic',
          name: '循环依赖',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [
          {
            id: 'E1',
            title: 'Epic 1',
            features: [
              {
                id: 'F1.1',
                title: 'Feature 1.1',
                tasks: [
                  {
                    id: 'A',
                    title: 'Task A',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['C'],
                  },
                  {
                    id: 'B',
                    title: 'Task B',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['A'],
                  },
                  {
                    id: 'C',
                    title: 'Task C',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['B'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const cycle = detectCycles(cyclicPlan);

      expect(cycle).not.toBeNull();
      expect(cycle!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('areDependenciesMet', () => {
    it('应该返回 true 当所有依赖都完成', () => {
      const plan = createPlanWithDeps();
      // T3 依赖 T1 和 T2，都是 completed
      const met = areDependenciesMet(plan, 'T3');

      expect(met).toBe(true);
    });

    it('应该返回 false 当有依赖未完成', () => {
      const plan = createPlanWithDeps();
      // T4 依赖 T3，T3 是 pending
      const met = areDependenciesMet(plan, 'T4');

      expect(met).toBe(false);
    });

    it('应该返回 true 当没有依赖', () => {
      const plan = createPlanWithDeps();
      // T1 没有依赖
      const met = areDependenciesMet(plan, 'T1');

      expect(met).toBe(true);
    });

    it('应该考虑 skipped 作为满足条件', () => {
      const planWithSkipped: TaskPlan = {
        ...createPlanWithDeps(),
      };
      planWithSkipped.epics[0].features[0].tasks[0].status = 'skipped';

      // T5 依赖 T1 (skipped)
      const met = areDependenciesMet(planWithSkipped, 'T5');

      expect(met).toBe(true);
    });
  });

  describe('getBlockedReason', () => {
    it('应该返回未完成的依赖列表', () => {
      const plan = createPlanWithDeps();
      // T4 依赖 T3 (pending)
      const reason = getBlockedReason(plan, 'T4');

      expect(reason).toContain('T3');
    });

    it('应该返回 null 当依赖都满足', () => {
      const plan = createPlanWithDeps();
      // T3 的依赖都完成了
      const reason = getBlockedReason(plan, 'T3');

      expect(reason).toBeNull();
    });
  });

  describe('topologicalSort', () => {
    it('应该返回正确的执行顺序', () => {
      const plan = createPlanWithDeps();
      const sorted = topologicalSort(plan);

      // T1, T2 应该在 T3 之前
      const t1Index = sorted.indexOf('T1');
      const t2Index = sorted.indexOf('T2');
      const t3Index = sorted.indexOf('T3');
      const t4Index = sorted.indexOf('T4');

      expect(t1Index).toBeLessThan(t3Index);
      expect(t2Index).toBeLessThan(t3Index);
      expect(t3Index).toBeLessThan(t4Index);
    });

    it('应该抛出异常当存在循环依赖', () => {
      const cyclicPlan: TaskPlan = {
        meta: {
          id: 'cyclic',
          name: '循环依赖',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [
          {
            id: 'E1',
            title: 'Epic 1',
            features: [
              {
                id: 'F1.1',
                title: 'Feature 1.1',
                tasks: [
                  {
                    id: 'A',
                    title: 'Task A',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['B'],
                  },
                  {
                    id: 'B',
                    title: 'Task B',
                    status: 'pending',
                    priority: 'high',
                    estimate: '1h',
                    depends_on: ['A'],
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(() => topologicalSort(cyclicPlan)).toThrow('循环依赖');
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- dependency-resolver.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/task-engine/dependency-resolver.test.ts
git commit -m "test: 添加 DependencyResolver 单元测试"
```

---

## Task 4: Next Task Selector 单元测试

**Files:**
- Create: `mcp-server/src/task-engine/next-task-selector.test.ts`

**Step 1: 编写测试文件**

```typescript
// mcp-server/src/task-engine/next-task-selector.test.ts
import { describe, it, expect } from 'vitest';
import { selectNextTask, type NextTaskResult } from './next-task-selector.js';
import type { TaskPlan, TaskPriority } from '../types.js';

describe('NextTaskSelector', () => {
  const createTestPlan = (
    tasks: Array<{
      id: string;
      status: string;
      priority: TaskPriority;
      estimate: string;
      depends_on?: string[];
    }>
  ): TaskPlan => ({
    meta: {
      id: 'test-project',
      name: '测试项目',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
    },
    epics: [
      {
        id: 'E1',
        title: 'Epic 1',
        features: [
          {
            id: 'F1.1',
            title: 'Feature 1.1',
            tasks: tasks.map(t => ({
              id: t.id,
              title: `Task ${t.id}`,
              status: t.status as any,
              priority: t.priority,
              estimate: t.estimate,
              depends_on: t.depends_on,
            })),
          },
        ],
      },
    ],
  });

  describe('selectNextTask', () => {
    it('应该返回 pending 且依赖满足的任务', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'completed', priority: 'high', estimate: '1h' },
        { id: 'T2', status: 'pending', priority: 'high', estimate: '1h', depends_on: ['T1'] },
      ]);

      const result = selectNextTask(plan);

      expect(result.task).not.toBeNull();
      expect(result.task?.id).toBe('T2');
    });

    it('应该按优先级排序: critical > high > medium > low', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'pending', priority: 'low', estimate: '1h' },
        { id: 'T2', status: 'pending', priority: 'high', estimate: '1h' },
        { id: 'T3', status: 'pending', priority: 'critical', estimate: '1h' },
        { id: 'T4', status: 'pending', priority: 'medium', estimate: '1h' },
      ]);

      const result = selectNextTask(plan);

      expect(result.task?.id).toBe('T3'); // critical 优先
    });

    it('应该在同优先级时按预估时间排序: 短 > 长', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'pending', priority: 'high', estimate: '4h' },
        { id: 'T2', status: 'pending', priority: 'high', estimate: '1h' },
        { id: 'T3', status: 'pending', priority: 'high', estimate: '2h' },
      ]);

      const result = selectNextTask(plan);

      expect(result.task?.id).toBe('T2'); // 1h 最短
    });

    it('应该跳过依赖未满足的任务', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'pending', priority: 'critical', estimate: '1h', depends_on: ['T2'] },
        { id: 'T2', status: 'pending', priority: 'low', estimate: '4h' },
      ]);

      const result = selectNextTask(plan);

      // T1 优先级高但依赖未满足，所以选 T2
      expect(result.task?.id).toBe('T2');
    });

    it('应该返回 null 当所有任务都完成', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'completed', priority: 'high', estimate: '1h' },
        { id: 'T2', status: 'completed', priority: 'high', estimate: '1h' },
      ]);

      const result = selectNextTask(plan);

      expect(result.task).toBeNull();
      expect(result.reason).toBe('all_completed');
    });

    it('应该返回 null 当存在循环阻塞', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'blocked', priority: 'high', estimate: '1h' },
        { id: 'T2', status: 'pending', priority: 'high', estimate: '1h', depends_on: ['T1'] },
      ]);

      const result = selectNextTask(plan);

      expect(result.task).toBeNull();
      expect(result.reason).toBe('blocked');
      expect(result.blockedBy).toContain('T1');
    });

    it('应该返回 null 当有任务 in_progress', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'in_progress', priority: 'high', estimate: '1h' },
        { id: 'T2', status: 'pending', priority: 'critical', estimate: '1h' },
      ]);

      const result = selectNextTask(plan);

      expect(result.task).toBeNull();
      expect(result.reason).toBe('in_progress');
      expect(result.currentTask?.id).toBe('T1');
    });

    it('应该处理解析预估时间', () => {
      const plan = createTestPlan([
        { id: 'T1', status: 'pending', priority: 'high', estimate: '30m' },
        { id: 'T2', status: 'pending', priority: 'high', estimate: '1.5h' },
        { id: 'T3', status: 'pending', priority: 'high', estimate: '2h' },
      ]);

      const result = selectNextTask(plan);

      expect(result.task?.id).toBe('T1'); // 30m 最短
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- next-task-selector.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/task-engine/next-task-selector.test.ts
git commit -m "test: 添加 NextTaskSelector 单元测试"
```

---

## Task 5: File Manager 单元测试

**Files:**
- Create: `mcp-server/src/file-manager.test.ts`

**Step 1: 编写测试文件**

```typescript
// mcp-server/src/file-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileManager } from './file-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileManager', () => {
  let tempDir: string;
  let fileManager: FileManager;

  beforeEach(async () => {
    // 创建临时目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplanners-test-'));
    fileManager = new FileManager(tempDir);
  });

  afterEach(async () => {
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readTaskPlan', () => {
    it('应该读取存在的文件', async () => {
      const yamlContent = `
meta:
  id: test-project
  name: 测试项目
  created: "2024-01-01T00:00:00Z"
  updated: "2024-01-01T00:00:00Z"
epics:
  - id: E1
    title: Epic 1
    features:
      - id: F1.1
        title: Feature 1
        tasks:
          - id: T1
            title: Task 1
            status: pending
            priority: high
            estimate: 1h
`;
      const projectDir = path.join(tempDir, 'tasks', 'test-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(path.join(projectDir, 'tasks.yaml'), yamlContent);

      const plan = await fileManager.readTaskPlan('test-project');

      expect(plan).not.toBeNull();
      expect(plan!.meta.id).toBe('test-project');
    });

    it('应该返回 null 当文件不存在', async () => {
      const plan = await fileManager.readTaskPlan('non-existent');

      expect(plan).toBeNull();
    });
  });

  describe('writeTaskPlan', () => {
    it('应该原子写入文件', async () => {
      const plan = {
        meta: {
          id: 'new-project',
          name: '新项目',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [
          {
            id: 'E1',
            title: 'Epic 1',
            features: [
              {
                id: 'F1.1',
                title: 'Feature 1',
                tasks: [
                  {
                    id: 'T1',
                    title: 'Task 1',
                    status: 'pending' as const,
                    priority: 'high' as const,
                    estimate: '1h',
                  },
                ],
              },
            ],
          },
        ],
      };

      await fileManager.writeTaskPlan('new-project', plan);

      // 验证文件存在
      const filePath = path.join(tempDir, 'tasks', 'new-project', 'tasks.yaml');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // 验证内容
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('new-project');
      expect(content).toContain('Task 1');
    });

    it('应该自动更新 updated 时间戳', async () => {
      const plan = {
        meta: {
          id: 'test-project',
          name: '测试项目',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [],
      };

      await fileManager.writeTaskPlan('test-project', plan);

      const saved = await fileManager.readTaskPlan('test-project');
      expect(saved!.meta.updated).not.toBe('2024-01-01T00:00:00Z');
    });

    it('应该创建目录如果不存在', async () => {
      const plan = {
        meta: {
          id: 'deep-project',
          name: '深层项目',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
        },
        epics: [],
      };

      await fileManager.writeTaskPlan('deep-project', plan);

      const dirPath = path.join(tempDir, 'tasks', 'deep-project');
      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('listProjects', () => {
    it('应该列出所有项目', async () => {
      // 创建两个项目
      await fileManager.writeTaskPlan('project-1', {
        meta: { id: 'project-1', name: 'Project 1', created: '', updated: '' },
        epics: [],
      });
      await fileManager.writeTaskPlan('project-2', {
        meta: { id: 'project-2', name: 'Project 2', created: '', updated: '' },
        epics: [],
      });

      const projects = await fileManager.listProjects();

      expect(projects).toHaveLength(2);
      expect(projects).toContain('project-1');
      expect(projects).toContain('project-2');
    });

    it('应该返回空数组当没有项目', async () => {
      const projects = await fileManager.listProjects();

      expect(projects).toEqual([]);
    });
  });

  describe('archiveProject', () => {
    it('应该归档项目', async () => {
      // 创建项目
      await fileManager.writeTaskPlan('to-archive', {
        meta: { id: 'to-archive', name: 'To Archive', created: '', updated: '' },
        epics: [],
      });

      await fileManager.archiveProject('to-archive');

      // 原目录不存在
      const originalPath = path.join(tempDir, 'tasks', 'to-archive');
      const originalExists = await fs.access(originalPath).then(() => true).catch(() => false);
      expect(originalExists).toBe(false);

      // 归档目录存在
      const archiveList = await fileManager.listArchives();
      expect(archiveList.some(a => a.projectId === 'to-archive')).toBe(true);
    });
  });

  describe('restoreArchive', () => {
    it('应该恢复归档的项目', async () => {
      // 创建并归档项目
      await fileManager.writeTaskPlan('to-restore', {
        meta: { id: 'to-restore', name: 'To Restore', created: '', updated: '' },
        epics: [],
      });
      await fileManager.archiveProject('to-restore');

      // 获取归档 ID
      const archives = await fileManager.listArchives();
      const archiveId = archives.find(a => a.projectId === 'to-restore')?.archiveId;

      await fileManager.restoreArchive(archiveId!);

      // 项目恢复
      const projects = await fileManager.listProjects();
      expect(projects).toContain('to-restore');
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- file-manager.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/file-manager.test.ts
git commit -m "test: 添加 FileManager 单元测试"
```

---

## Task 6: MCP Server 集成测试

**Files:**
- Create: `mcp-server/src/server.test.ts`

**Step 1: 编写集成测试文件**

```typescript
// mcp-server/src/server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createToolHandlers, TOOLS } from './server.js';
import { FileManager } from './file-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('MCP Server Integration', () => {
  let tempDir: string;
  let handlers: ReturnType<typeof createToolHandlers>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'superplanners-server-test-'));
    const fileManager = new FileManager(tempDir);
    handlers = createToolHandlers(fileManager);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('TOOLS 定义', () => {
    it('应该定义 4 个工具', () => {
      expect(TOOLS).toHaveLength(4);
      expect(TOOLS.map(t => t.name)).toEqual([
        'superplanners_plan',
        'superplanners_status',
        'superplanners_update',
        'superplanners_reset',
      ]);
    });

    it('每个工具应该有完整的 schema', () => {
      for (const tool of TOOLS) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      }
    });
  });

  describe('superplanners_plan', () => {
    it('应该创建新项目', async () => {
      const result = await handlers.plan({
        requirement: '创建一个简单的 TODO 应用',
        project_name: 'todo-app',
      });

      expect(result.success).toBe(true);
      expect(result.project_id).toBe('todo-app');
      expect(result.files).toContain('tasks/todo-app/tasks.yaml');
    });

    it('应该使用自动生成的项目 ID 当未提供 project_name', async () => {
      const result = await handlers.plan({
        requirement: '创建一个博客系统',
      });

      expect(result.success).toBe(true);
      expect(result.project_id).toBeDefined();
    });

    it('应该返回下一个任务', async () => {
      const result = await handlers.plan({
        requirement: '实现用户登录功能',
        project_name: 'auth-system',
      });

      expect(result.next_task).toBeDefined();
    });
  });

  describe('superplanners_status', () => {
    it('应该返回全局视图当无参数', async () => {
      // 创建两个项目
      await handlers.plan({ requirement: 'Project 1', project_name: 'p1' });
      await handlers.plan({ requirement: 'Project 2', project_name: 'p2' });

      const result = await handlers.status({});

      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(2);
    });

    it('应该返回项目详情当指定 project_id', async () => {
      await handlers.plan({ requirement: 'Test Project', project_name: 'test' });

      const result = await handlers.status({ project_id: 'test' });

      expect(result.success).toBe(true);
      expect(result.project_id).toBe('test');
      expect(result.progress).toBeDefined();
    });

    it('应该返回错误当项目不存在', async () => {
      const result = await handlers.status({ project_id: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-existent');
    });
  });

  describe('superplanners_update', () => {
    it('应该更新任务状态', async () => {
      await handlers.plan({ requirement: 'Test', project_name: 'update-test' });
      const status = await handlers.status({ project_id: 'update-test' });
      const firstTaskId = status.tasks?.[0]?.id;

      const result = await handlers.update({
        project_id: 'update-test',
        task_id: firstTaskId,
        status: 'in_progress',
      });

      expect(result.success).toBe(true);
      expect(result.updated).toBe(true);
    });

    it('应该添加备注', async () => {
      await handlers.plan({ requirement: 'Test', project_name: 'notes-test' });
      const status = await handlers.status({ project_id: 'notes-test' });
      const firstTaskId = status.tasks?.[0]?.id;

      const result = await handlers.update({
        project_id: 'notes-test',
        task_id: firstTaskId,
        status: 'completed',
        notes: '已完成，耗时 30 分钟',
      });

      expect(result.success).toBe(true);
    });

    it('应该拒绝无效的状态转换', async () => {
      await handlers.plan({ requirement: 'Test', project_name: 'invalid-test' });
      const status = await handlers.status({ project_id: 'invalid-test' });
      const firstTaskId = status.tasks?.[0]?.id;

      // pending -> skipped，然后 skipped -> completed 应该失败
      await handlers.update({
        project_id: 'invalid-test',
        task_id: firstTaskId,
        status: 'skipped',
      });

      const result = await handlers.update({
        project_id: 'invalid-test',
        task_id: firstTaskId,
        status: 'completed',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效');
    });

    it('应该返回下一个任务', async () => {
      await handlers.plan({ requirement: 'Multi-task', project_name: 'next-test' });
      const status = await handlers.status({ project_id: 'next-test' });
      const firstTaskId = status.tasks?.[0]?.id;

      const result = await handlers.update({
        project_id: 'next-test',
        task_id: firstTaskId,
        status: 'completed',
      });

      if (status.tasks && status.tasks.length > 1) {
        expect(result.next_task).toBeDefined();
      }
    });
  });

  describe('superplanners_reset', () => {
    it('应该归档项目 (cleanup)', async () => {
      await handlers.plan({ requirement: 'To Archive', project_name: 'archive-test' });

      const result = await handlers.reset({
        action: 'cleanup',
        project_id: 'archive-test',
      });

      expect(result.success).toBe(true);

      // 验证项目不再存在
      const status = await handlers.status({ project_id: 'archive-test' });
      expect(status.success).toBe(false);
    });

    it('应该列出归档 (list)', async () => {
      await handlers.plan({ requirement: 'Project 1', project_name: 'list-test-1' });
      await handlers.reset({ action: 'cleanup', project_id: 'list-test-1' });

      const result = await handlers.reset({ action: 'list' });

      expect(result.success).toBe(true);
      expect(result.archives).toBeDefined();
      expect(result.archives!.some((a: any) => a.projectId === 'list-test-1')).toBe(true);
    });

    it('应该恢复归档 (restore)', async () => {
      await handlers.plan({ requirement: 'To Restore', project_name: 'restore-test' });
      await handlers.reset({ action: 'cleanup', project_id: 'restore-test' });

      const listResult = await handlers.reset({ action: 'list' });
      const archiveId = listResult.archives?.find((a: any) => a.projectId === 'restore-test')?.archiveId;

      const result = await handlers.reset({
        action: 'restore',
        archive_id: archiveId,
      });

      expect(result.success).toBe(true);

      // 验证项目恢复
      const status = await handlers.status({ project_id: 'restore-test' });
      expect(status.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该返回统一的错误格式', async () => {
      const result = await handlers.update({
        project_id: 'non-existent',
        task_id: 'T1',
        status: 'completed',
      });

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });
});
```

**Step 2: 运行测试验证通过**

Run: `cd mcp-server && npm test -- server.test.ts`
Expected: PASS

**Step 3: 提交**

```bash
git add mcp-server/src/server.test.ts
git commit -m "test: 添加 MCP Server 集成测试"
```

---

## Task 7: 运行全部测试并确保覆盖率

**Step 1: 运行全部测试**

Run: `cd mcp-server && npm test`
Expected: ALL PASS

**Step 2: 检查测试覆盖率**

Run: `cd mcp-server && npm test -- --coverage`
Expected: 覆盖率 > 80%

**Step 3: 提交覆盖率报告配置（如需）**

```bash
git add -A
git commit -m "test: 完成所有测试，覆盖率达标"
```

---

## Task 8: 编写 README.md

**Files:**
- Create: `README.md`

**Step 1: 编写项目 README**

```markdown
# SuperPlanners

> 智能任务分解与管理系统，为 Claude Code / MCP 环境设计

[![npm version](https://badge.fury.io/js/superplanners-mcp.svg)](https://www.npmjs.com/package/superplanners-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特性

- **智能任务分解**: 将复杂需求自动拆解为 Epic → Feature → Task → Subtask 层级结构
- **状态追踪**: 支持 pending / in_progress / completed / blocked / skipped 五种状态
- **依赖管理**: 自动检测循环依赖，智能推荐下一个可执行任务
- **进度可视化**: 实时计算进度百分比，生成 Markdown 格式的进度报告
- **MCP 集成**: 无缝集成 Claude Code，通过 MCP Tools 进行交互

## 安装

### 作为 MCP Server

```bash
npx superplanners-mcp
```

### 在 Claude Code 中配置

```json
// .mcp.json
{
  "mcpServers": {
    "superplanners": {
      "command": "npx",
      "args": ["superplanners-mcp"]
    }
  }
}
```

### 使用 Claude Code Plugin

```bash
claude plugins add https://github.com/Shameless521/Superplanners
```

## 使用指南

### 1. 创建任务计划

```
/superplanners:plan 创建一个 TODO 应用，支持增删改查
```

Claude 会自动：
1. 分析需求
2. 生成任务分解（Epic/Feature/Task）
3. 创建 `tasks/todo-app/tasks.yaml`
4. 渲染 `tasks/todo-app/tasks.md`

### 2. 查看状态

```
/superplanners:status
```

查看所有项目：
```
📋 SuperPlanners 项目列表
| 项目 | 进度 | 状态 |
|------|------|------|
| todo-app | 30% | 进行中 |
```

查看特定项目：
```
/superplanners:status todo-app
```

### 3. 更新任务

自然语言更新：
```
任务 T1.1.1 完成了
```

或使用命令：
```
/superplanners:update todo-app T1.1.1 completed
```

### 4. 归档与恢复

```
/superplanners:reset cleanup todo-app  # 归档项目
/superplanners:reset list              # 查看归档列表
/superplanners:reset restore <id>      # 恢复归档
```

## 数据结构

### YAML 格式

```yaml
meta:
  id: todo-app
  name: TODO 应用
  created: "2024-01-01T00:00:00Z"
  updated: "2024-01-01T12:00:00Z"

epics:
  - id: E1
    title: 核心功能
    features:
      - id: F1.1
        title: 任务 CRUD
        tasks:
          - id: T1.1.1
            title: 实现添加任务
            status: completed
            priority: high
            estimate: 2h
            notes: "已完成，使用了 React Hook Form"
          - id: T1.1.2
            title: 实现删除任务
            status: pending
            priority: high
            estimate: 1h
            depends_on: [T1.1.1]
```

### 状态说明

| 状态 | 图标 | 说明 |
|------|------|------|
| pending | ⏸️ | 待处理 |
| in_progress | 🔄 | 进行中 |
| completed | ✅ | 已完成 |
| blocked | 🚫 | 被阻塞 |
| skipped | ⏭️ | 已跳过 |

### 优先级

| 优先级 | 权重 | 说明 |
|--------|------|------|
| critical | 4 | 紧急关键 |
| high | 3 | 高优先级 |
| medium | 2 | 中优先级 |
| low | 1 | 低优先级 |

## MCP Tools

| Tool | 说明 |
|------|------|
| `superplanners_plan` | 创建任务计划 |
| `superplanners_status` | 查询项目/任务状态 |
| `superplanners_update` | 更新任务状态 |
| `superplanners_reset` | 归档/恢复/清理 |

## 开发

```bash
# 安装依赖
cd mcp-server && npm install

# 运行测试
npm test

# 构建
npm run build

# 本地运行
npm start
```

## 设计原则

- **SSOT**: YAML 是唯一数据源，Markdown 是派生视图
- **原子事务**: 读取 → 变更 → 校验 → 写入 → 渲染，任何步骤失败都回滚
- **无状态服务**: MCP Server 不持有业务状态，所有状态存储在文件系统

## License

MIT
```

**Step 2: 保存并提交**

```bash
git add README.md
git commit -m "docs: 添加项目 README.md"
```

---

## Task 9: 编写 MCP Server README

**Files:**
- Create: `mcp-server/README.md`

**Step 1: 编写 MCP Server README**

```markdown
# SuperPlanners MCP Server

SuperPlanners 的 MCP (Model Context Protocol) 服务器实现。

## 开发指南

### 项目结构

```
mcp-server/
├── src/
│   ├── index.ts              # 入口文件
│   ├── server.ts             # MCP Tool 处理器
│   ├── types.ts              # TypeScript 类型定义
│   ├── file-manager.ts       # 文件读写
│   ├── renderer.ts           # Markdown 渲染
│   └── task-engine/          # 核心业务逻辑
│       ├── parser.ts         # YAML 解析
│       ├── status-reducer.ts # 状态变更
│       ├── dependency-resolver.ts  # 依赖解析
│       ├── progress-calculator.ts  # 进度计算
│       └── next-task-selector.ts   # 任务推荐
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（监听变更）
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 运行测试（带覆盖率）
npm test -- --coverage

# 类型检查
npm run typecheck

# 代码格式化
npm run lint
```

### MCP Tools 说明

#### superplanners_plan

创建新的任务计划。

**输入:**
```typescript
{
  requirement: string;      // 需求描述
  project_name?: string;    // 项目名称（可选）
}
```

**输出:**
```typescript
{
  success: boolean;
  project_id: string;
  summary: TaskSummary;
  files: string[];
  next_task: Task | null;
}
```

#### superplanners_status

查询项目或任务状态。

**输入:**
```typescript
{
  project_id?: string;      // 项目 ID（可选，不填返回全局视图）
}
```

**输出:**
```typescript
{
  success: boolean;
  projects?: ProjectSummary[];  // 全局视图
  project_id?: string;          // 项目视图
  progress?: Progress;
  summary?: TaskSummary;
  tasks?: Task[];
  next_task?: Task | null;
}
```

#### superplanners_update

更新任务状态。

**输入:**
```typescript
{
  project_id: string;
  task_id: string;
  status: TaskStatus;
  notes?: string;
}
```

**输出:**
```typescript
{
  success: boolean;
  updated: boolean;
  summary: TaskSummary;
  progress: Progress;
  next_task: Task | null;
}
```

#### superplanners_reset

归档、列出或恢复项目。

**输入:**
```typescript
{
  action: 'cleanup' | 'list' | 'restore';
  project_id?: string;    // cleanup 时必填
  archive_id?: string;    // restore 时必填
}
```

### 添加新功能

1. 在 `types.ts` 中定义类型
2. 在对应模块中实现逻辑
3. 编写测试
4. 在 `server.ts` 中注册 Tool（如需要）

### 调试

使用 MCP Inspector：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## 发布

```bash
npm run build
npm publish
```
```

**Step 2: 保存并提交**

```bash
git add mcp-server/README.md
git commit -m "docs: 添加 MCP Server README"
```

---

## Task 10: 创建 LICENSE

**Files:**
- Create: `LICENSE`

**Step 1: 创建 MIT License**

```text
MIT License

Copyright (c) 2024 SuperPlanners

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 2: 保存并提交**

```bash
git add LICENSE
git commit -m "chore: 添加 MIT License"
```

---

## Task 11: 配置 npm 发布

**Files:**
- Modify: `mcp-server/package.json`

**Step 1: 更新 package.json 发布配置**

确保 `mcp-server/package.json` 包含以下字段：

```json
{
  "name": "superplanners-mcp",
  "version": "0.1.0",
  "description": "智能任务分解与管理系统 MCP Server",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "superplanners-mcp": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": [
    "mcp",
    "claude",
    "task-management",
    "planning",
    "ai"
  ],
  "author": "",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/Shameless521/Superplanners.git"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 2: 验证配置**

Run: `cd mcp-server && npm pack --dry-run`
Expected: 显示将要打包的文件列表

**Step 3: 提交**

```bash
git add mcp-server/package.json
git commit -m "chore: 配置 npm 发布"
```

---

## Task 12: 创建 .npmignore

**Files:**
- Create: `mcp-server/.npmignore`

**Step 1: 创建 .npmignore**

```text
# 源代码（发布 dist）
src/

# 测试
*.test.ts
vitest.config.ts
coverage/

# 开发配置
tsconfig.json
.eslintrc*
.prettierrc*

# 杂项
.DS_Store
*.log
```

**Step 2: 提交**

```bash
git add mcp-server/.npmignore
git commit -m "chore: 添加 .npmignore"
```

---

## Task 13: 最终验证

**Step 1: 构建项目**

Run: `cd mcp-server && npm run build`
Expected: 无错误

**Step 2: 运行所有测试**

Run: `cd mcp-server && npm test`
Expected: ALL PASS

**Step 3: 验证 MCP Server 可启动**

Run: `cd mcp-server && node dist/index.js`
Expected: Server 启动，等待 stdio 输入

**Step 4: 验证 npm 包**

Run: `cd mcp-server && npm pack --dry-run`
Expected: 包大小合理，包含必要文件

**Step 5: 最终提交**

```bash
git add -A
git commit -m "chore: 完成 SuperPlanners v0.1.0 开发"
git tag v0.1.0
```

---

## Task 14: 发布（可选）

**Step 1: 登录 npm**

Run: `npm login`

**Step 2: 发布到 npm**

Run: `cd mcp-server && npm publish`

**Step 3: 验证发布**

Run: `npx superplanners-mcp --version`
Expected: 0.1.0

---

## 完成检查清单

- [ ] Task 1: Parser 单元测试
- [ ] Task 2: Status Reducer 单元测试
- [ ] Task 3: Dependency Resolver 单元测试
- [ ] Task 4: Next Task Selector 单元测试
- [ ] Task 5: File Manager 单元测试
- [ ] Task 6: MCP Server 集成测试
- [ ] Task 7: 全部测试通过，覆盖率达标
- [ ] Task 8: README.md
- [ ] Task 9: mcp-server/README.md
- [ ] Task 10: LICENSE
- [ ] Task 11: npm 发布配置
- [ ] Task 12: .npmignore
- [ ] Task 13: 最终验证
- [ ] Task 14: 发布（可选）
