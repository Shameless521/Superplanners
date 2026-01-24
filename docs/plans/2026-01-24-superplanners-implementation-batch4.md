# SuperPlanners 实施计划 - 第四批：MCP Server + Plugin

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 MCP Server 核心和 4 个 MCP Tools，以及 Claude Code Plugin 命令

**Architecture:** MCP Server 使用 @modelcontextprotocol/sdk，通过 stdio 传输与 Claude 通信。Plugin 通过 Markdown 命令定义调用 MCP Tools。

**Tech Stack:** @modelcontextprotocol/sdk, TypeScript

**前置条件:** 第一批、第二批、第三批已完成

---

## Task 1: 创建 MCP Server 入口

**Files:**
- Modify: `mcp-server/src/index.ts`

**Step 1: 实现 MCP Server 入口**

```typescript
// mcp-server/src/index.ts
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createToolHandlers, TOOLS } from './server.js';

async function main() {
  const server = new Server(
    {
      name: 'superplanners-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 注册工具列表
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // 注册工具调用处理
  const handlers = createToolHandlers(process.cwd());

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = handlers[name];

    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `未知工具: ${name}` }),
          },
        ],
      };
    }

    try {
      const result = await handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            }),
          },
        ],
      };
    }
  });

  // 启动服务
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('SuperPlanners MCP Server started');
}

main().catch(console.error);
```

**Step 2: 验证语法正确**

Run: `cd mcp-server && npx tsc --noEmit src/index.ts`

Expected: 编译错误（server.js 不存在），这是预期的

**Step 3: Commit**

```bash
git add mcp-server/src/index.ts
git commit -m "feat(mcp): 创建 MCP Server 入口

- 使用 @modelcontextprotocol/sdk
- 配置 stdio 传输
- 注册 ListTools 和 CallTool 处理器"
```

---

## Task 2: 实现 Tool 注册框架

**Files:**
- Create: `mcp-server/src/server.ts`

**Step 1: 创建 Server 模块**

```typescript
// mcp-server/src/server.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileManager } from './file-manager.js';
import {
  PlanInputSchema,
  StatusInputSchema,
  UpdateInputSchema,
  ResetInputSchema,
} from './types.js';

// 工具定义
export const TOOLS: Tool[] = [
  {
    name: 'superplanners_plan',
    description: '根据需求创建结构化任务计划',
    inputSchema: {
      type: 'object',
      properties: {
        requirement: {
          type: 'string',
          description: '需求描述，用于分解成任务',
        },
        project_name: {
          type: 'string',
          description: '项目名称，默认从需求推断',
        },
      },
      required: ['requirement'],
    },
  },
  {
    name: 'superplanners_status',
    description: '查看任务状态和整体进度',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID，不填则显示全部项目',
        },
      },
    },
  },
  {
    name: 'superplanners_update',
    description: '更新任务状态',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID',
        },
        task_id: {
          type: 'string',
          description: '任务ID',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'blocked', 'skipped'],
          description: '新状态',
        },
        notes: {
          type: 'string',
          description: '备注',
        },
      },
      required: ['project_id', 'task_id', 'status'],
    },
  },
  {
    name: 'superplanners_reset',
    description: '归档清理或恢复历史任务',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['cleanup', 'list', 'restore'],
          description: '操作类型',
        },
        project_id: {
          type: 'string',
          description: 'cleanup 时可选的项目ID',
        },
        archive_id: {
          type: 'string',
          description: 'restore 时必填的归档ID',
        },
      },
      required: ['action'],
    },
  },
];

// 工具处理器类型
export type ToolHandler = (args: unknown) => Promise<unknown>;
export type ToolHandlers = Record<string, ToolHandler>;

// 创建工具处理器
export function createToolHandlers(baseDir: string): ToolHandlers {
  const fm = new FileManager(baseDir);

  return {
    superplanners_plan: async (args) => handlePlan(fm, args),
    superplanners_status: async (args) => handleStatus(fm, args),
    superplanners_update: async (args) => handleUpdate(fm, args),
    superplanners_reset: async (args) => handleReset(fm, args),
  };
}

// 占位处理器（将在后续任务中实现）
async function handlePlan(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}

async function handleStatus(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}

async function handleUpdate(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}

async function handleReset(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}
```

**Step 2: 验证编译**

Run: `cd mcp-server && npm run build`

Expected: 编译成功

**Step 3: Commit**

```bash
git add mcp-server/src/server.ts
git commit -m "feat(mcp): 实现 Tool 注册框架

- 定义 4 个 MCP Tools 的 Schema
- 创建 createToolHandlers 工厂函数
- 添加占位处理器"
```

---

## Task 3: 实现 superplanners_status Tool

**Files:**
- Modify: `mcp-server/src/server.ts`
- Create: `mcp-server/src/server.test.ts`

**Step 1: 编写 Status Tool 测试**

```typescript
// mcp-server/src/server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createToolHandlers } from './server.js';

describe('MCP Tools', () => {
  let testDir: string;
  let handlers: ReturnType<typeof createToolHandlers>;

  beforeEach(async () => {
    testDir = join(tmpdir(), `superplanners-mcp-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    handlers = createToolHandlers(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('superplanners_status', () => {
    it('should return empty project list when no projects', async () => {
      const result = await handlers.superplanners_status({});

      expect(result).toMatchObject({
        success: true,
        total_projects: 0,
        projects: [],
      });
    });

    it('should return project list with progress', async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
        `
meta:
  project: 测试项目
  project_id: test-project
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:00:00Z"
  version: 1

tasks:
  - id: "1"
    title: 任务1
    status: completed
    priority: high
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
      );

      // 创建 task-plan.yaml
      await writeFile(
        join(testDir, 'tasks', 'task-plan.yaml'),
        `
meta:
  name: SuperPlanners
  version: "1.0.0"
  updated: "2025-01-23T10:00:00Z"

projects:
  - project_id: test-project
    project: 测试项目
    status: active
    updated: "2025-01-23T10:00:00Z"
    path: test-project/tasks.yaml
`
      );

      const result = await handlers.superplanners_status({});

      expect(result).toMatchObject({
        success: true,
        total_projects: 1,
      });
    });

    it('should return project detail when project_id provided', async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
        `
meta:
  project: 测试项目
  project_id: test-project
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:00:00Z"
  version: 1

tasks:
  - id: "1"
    title: 任务1
    status: completed
    priority: high
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
      );

      const result = (await handlers.superplanners_status({
        project_id: 'test-project',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.project.id).toBe('test-project');
      expect(result.summary.total).toBe(2);
      expect(result.summary.completed).toBe(1);
      expect(result.tasks).toHaveLength(2);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: FAIL

**Step 3: 实现 handleStatus**

```typescript
// 在 server.ts 中替换 handleStatus 函数

import {
  calculateTaskSummary,
  calculateProgress,
  formatProgressString,
} from './task-engine/progress-calculator.js';
import { selectNextTask } from './task-engine/next-task-selector.js';

async function handleStatus(fm: FileManager, args: unknown): Promise<unknown> {
  const input = StatusInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { project_id } = input.data;

  // 项目视图
  if (project_id) {
    const result = await fm.readProjectData(project_id);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const { meta, tasks } = result.data;
    const summary = calculateTaskSummary(tasks);
    const progress = calculateProgress(tasks);
    const nextTask = selectNextTask(tasks);

    // 找到当前进行中的任务
    const currentTask = tasks.find((t) => t.status === 'in_progress');

    return {
      success: true,
      project: {
        id: meta.project_id,
        name: meta.project,
        description: meta.description,
        updated: meta.updated,
      },
      summary,
      progress,
      current_task: currentTask
        ? { id: currentTask.id, title: currentTask.title }
        : null,
      tasks,
    };
  }

  // 全局视图
  const taskPlanResult = await fm.readTaskPlan();

  if (!taskPlanResult.success) {
    return { success: false, error: taskPlanResult.error };
  }

  // 如果没有 task-plan.yaml，返回空列表
  if (!taskPlanResult.data) {
    return {
      success: true,
      total_projects: 0,
      projects: [],
    };
  }

  const projects = [];
  for (const entry of taskPlanResult.data.projects) {
    const projectResult = await fm.readProjectData(entry.project_id);
    let progress = '?/?';

    if (projectResult.success) {
      progress = formatProgressString(projectResult.data.tasks);
    }

    projects.push({
      id: entry.project_id,
      name: entry.project,
      status: entry.status,
      progress,
      updated: entry.updated,
    });
  }

  return {
    success: true,
    total_projects: projects.length,
    projects,
  };
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/server.ts mcp-server/src/server.test.ts
git commit -m "feat(mcp): 实现 superplanners_status Tool

- 全局视图: 返回所有项目列表和进度
- 项目视图: 返回项目详情、任务列表、统计
- 实时计算 summary 和 progress"
```

---

## Task 4: 实现 superplanners_update Tool

**Files:**
- Modify: `mcp-server/src/server.ts`
- Modify: `mcp-server/src/server.test.ts`

**Step 1: 添加 Update Tool 测试**

```typescript
// 在 server.test.ts 中添加

describe('superplanners_update', () => {
  beforeEach(async () => {
    // 创建测试项目
    const tasksDir = join(testDir, 'tasks', 'test-project');
    await mkdir(tasksDir, { recursive: true });
    await writeFile(
      join(tasksDir, 'tasks.yaml'),
      `
meta:
  project: 测试项目
  project_id: test-project
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:00:00Z"
  version: 1

tasks:
  - id: "1"
    title: 任务1
    status: pending
    priority: high
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
    );
  });

  it('should update task status', async () => {
    const result = (await handlers.superplanners_update({
      project_id: 'test-project',
      task_id: '1',
      status: 'in_progress',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.updated.task_id).toBe('1');
    expect(result.updated.status).toBe('in_progress');
    expect(result.summary.in_progress).toBe(1);
  });

  it('should update task with notes', async () => {
    const result = (await handlers.superplanners_update({
      project_id: 'test-project',
      task_id: '1',
      status: 'blocked',
      notes: '等待设计稿',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.updated.notes).toBe('等待设计稿');
  });

  it('should reject invalid status transition', async () => {
    // 先完成任务
    await handlers.superplanners_update({
      project_id: 'test-project',
      task_id: '1',
      status: 'completed',
    });

    // 尝试将 completed 改回 pending
    const result = (await handlers.superplanners_update({
      project_id: 'test-project',
      task_id: '1',
      status: 'pending',
    })) as any;

    expect(result.success).toBe(false);
    expect(result.error).toContain('不允许');
  });

  it('should return error for non-existent project', async () => {
    const result = (await handlers.superplanners_update({
      project_id: 'non-existent',
      task_id: '1',
      status: 'completed',
    })) as any;

    expect(result.success).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: FAIL

**Step 3: 实现 handleUpdate**

```typescript
// 在 server.ts 中替换 handleUpdate 函数

import { updateTaskStatusWithValidation } from './task-engine/status-reducer.js';

async function handleUpdate(fm: FileManager, args: unknown): Promise<unknown> {
  const input = UpdateInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { project_id, task_id, status, notes } = input.data;

  // 读取项目数据
  const readResult = await fm.readProjectData(project_id);
  if (!readResult.success) {
    return { success: false, error: readResult.error };
  }

  const projectData = readResult.data;

  // 执行状态更新（带校验）
  const updateResult = updateTaskStatusWithValidation(
    projectData.tasks,
    task_id,
    status,
    notes
  );

  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  // 更新数据
  const updatedData = {
    ...projectData,
    tasks: updateResult.tasks,
  };

  // 写回文件
  const writeResult = await fm.writeProjectData(project_id, updatedData);
  if (!writeResult.success) {
    return { success: false, error: writeResult.error };
  }

  // 计算返回值
  const summary = calculateTaskSummary(updateResult.tasks);
  const progress = calculateProgress(updateResult.tasks);
  const nextTask = selectNextTask(updateResult.tasks);

  return {
    success: true,
    updated: {
      task_id,
      status,
      notes,
    },
    summary,
    progress,
    next_task: nextTask,
  };
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/server.ts mcp-server/src/server.test.ts
git commit -m "feat(mcp): 实现 superplanners_update Tool

- 更新任务状态（带合法性校验）
- 支持添加备注
- 自动重新渲染 Markdown
- 返回更新后的 summary、progress、next_task"
```

---

## Task 5: 实现 superplanners_reset Tool

**Files:**
- Modify: `mcp-server/src/server.ts`
- Modify: `mcp-server/src/server.test.ts`

**Step 1: 添加 Reset Tool 测试**

```typescript
// 在 server.test.ts 中添加

describe('superplanners_reset', () => {
  beforeEach(async () => {
    // 创建测试项目
    const tasksDir = join(testDir, 'tasks', 'test-project');
    await mkdir(tasksDir, { recursive: true });
    await writeFile(
      join(tasksDir, 'tasks.yaml'),
      `
meta:
  project: 测试项目
  project_id: test-project
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:00:00Z"
  version: 1

tasks:
  - id: "1"
    title: 任务1
    status: completed
    priority: high
`
    );
  });

  describe('cleanup action', () => {
    it('should archive specified project', async () => {
      const result = (await handlers.superplanners_reset({
        action: 'cleanup',
        project_id: 'test-project',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.action).toBe('cleanup');
      expect(result.archived_count).toBe(1);
      expect(result.archived).toHaveLength(1);
    });
  });

  describe('list action', () => {
    it('should list archives', async () => {
      // 先归档
      await handlers.superplanners_reset({
        action: 'cleanup',
        project_id: 'test-project',
      });

      const result = (await handlers.superplanners_reset({
        action: 'list',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.action).toBe('list');
      expect(result.archives.length).toBeGreaterThan(0);
    });
  });

  describe('restore action', () => {
    it('should restore archived project', async () => {
      // 先归档
      const archiveResult = (await handlers.superplanners_reset({
        action: 'cleanup',
        project_id: 'test-project',
      })) as any;

      const archiveId = archiveResult.archived[0];

      // 恢复
      const result = (await handlers.superplanners_reset({
        action: 'restore',
        archive_id: archiveId,
      })) as any;

      expect(result.success).toBe(true);
      expect(result.action).toBe('restore');
      expect(result.restored_project_id).toBe('test-project');
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: FAIL

**Step 3: 实现 handleReset**

```typescript
// 在 server.ts 中替换 handleReset 函数

async function handleReset(fm: FileManager, args: unknown): Promise<unknown> {
  const input = ResetInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { action, project_id, archive_id } = input.data;

  switch (action) {
    case 'cleanup': {
      if (project_id) {
        // 归档指定项目
        const result = await fm.archiveProject(project_id);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return {
          success: true,
          action: 'cleanup',
          archived_count: 1,
          archived: [result.data.archiveId],
        };
      } else {
        // 归档所有已完成项目
        const projects = await fm.listProjects();
        const archived: string[] = [];

        for (const pid of projects) {
          const readResult = await fm.readProjectData(pid);
          if (!readResult.success) continue;

          // 检查是否所有任务都完成
          const allCompleted = readResult.data.tasks.every(
            (t) => t.status === 'completed' || t.status === 'skipped'
          );

          if (allCompleted) {
            const archiveResult = await fm.archiveProject(pid);
            if (archiveResult.success) {
              archived.push(archiveResult.data.archiveId);
            }
          }
        }

        return {
          success: true,
          action: 'cleanup',
          archived_count: archived.length,
          archived,
        };
      }
    }

    case 'list': {
      const archives = await fm.listArchives();
      return {
        success: true,
        action: 'list',
        total: archives.length,
        archives: archives.map((a) => ({
          archive_id: a.archiveId,
          project_id: a.projectId,
          archived_at: a.archivedAt,
        })),
      };
    }

    case 'restore': {
      if (!archive_id) {
        return { success: false, error: 'restore 操作需要提供 archive_id' };
      }

      const result = await fm.restoreArchive(archive_id);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        action: 'restore',
        restored_project_id: result.data.projectId,
        from_archive: archive_id,
      };
    }

    default:
      return { success: false, error: `未知操作: ${action}` };
  }
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/server.ts mcp-server/src/server.test.ts
git commit -m "feat(mcp): 实现 superplanners_reset Tool

- cleanup: 归档已完成项目或指定项目
- list: 列出所有归档
- restore: 恢复指定归档"
```

---

## Task 6: 实现 superplanners_plan Tool

**Files:**
- Modify: `mcp-server/src/server.ts`
- Modify: `mcp-server/src/server.test.ts`

**Step 1: 添加 Plan Tool 测试**

```typescript
// 在 server.test.ts 中添加

describe('superplanners_plan', () => {
  it('should create project with tasks', async () => {
    const result = (await handlers.superplanners_plan({
      requirement: '开发用户登录功能，包括前后端',
      project_name: '用户登录功能',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.project_id).toBeDefined();
    expect(result.project_name).toBe('用户登录功能');
    expect(result.files.project_yaml).toContain('tasks.yaml');
  });

  it('should generate project_id from project_name', async () => {
    const result = (await handlers.superplanners_plan({
      requirement: '测试需求',
      project_name: '中文项目名称',
    })) as any;

    expect(result.success).toBe(true);
    // project_id 应该是 slug 格式
    expect(result.project_id).toMatch(/^[a-z0-9-]+$/);
  });

  it('should create task-plan.yaml if not exists', async () => {
    await handlers.superplanners_plan({
      requirement: '测试需求',
      project_name: '测试项目',
    });

    const taskPlan = await handlers.superplanners_status({});
    expect((taskPlan as any).total_projects).toBeGreaterThan(0);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: FAIL

**Step 3: 实现 handlePlan**

```typescript
// 在 server.ts 中替换 handlePlan 函数

/**
 * 生成 project_id (slug 格式)
 */
function generateProjectId(name: string): string {
  // 简单的中文转拼音首字母 + 去除特殊字符
  const slug = name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/^-+|-+$/g, '');

  // 如果是纯中文，生成随机 ID
  if (/^[\u4e00-\u9fa5-]+$/.test(slug)) {
    const timestamp = Date.now().toString(36);
    return `project-${timestamp}`;
  }

  return slug || `project-${Date.now().toString(36)}`;
}

/**
 * 根据需求生成默认任务（简化版本）
 * 在实际应用中，这里应该调用 AI 进行任务分解
 */
function generateDefaultTasks(requirement: string): import('./types.js').Task[] {
  // 这是一个简化的实现，实际应该由 Claude 分解
  return [
    {
      id: '1',
      title: '需求分析',
      description: `分析需求: ${requirement}`,
      status: 'pending',
      priority: 'high',
      estimate: '2h',
    },
    {
      id: '2',
      title: '技术设计',
      status: 'pending',
      priority: 'high',
      estimate: '4h',
      dependencies: ['1'],
    },
    {
      id: '3',
      title: '开发实现',
      status: 'pending',
      priority: 'high',
      estimate: '8h',
      dependencies: ['2'],
    },
    {
      id: '4',
      title: '测试验证',
      status: 'pending',
      priority: 'medium',
      estimate: '4h',
      dependencies: ['3'],
    },
  ];
}

async function handlePlan(fm: FileManager, args: unknown): Promise<unknown> {
  const input = PlanInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { requirement, project_name } = input.data;
  const name = project_name || '新项目';
  const projectId = generateProjectId(name);

  // 检查项目是否已存在
  if (await fm.projectExists(projectId)) {
    return { success: false, error: `项目 ${projectId} 已存在` };
  }

  const now = new Date().toISOString();
  const tasks = generateDefaultTasks(requirement);

  // 创建项目数据
  const projectData: import('./types.js').ProjectData = {
    meta: {
      project: name,
      project_id: projectId,
      created: now,
      updated: now,
      version: 1,
      description: requirement,
    },
    tasks,
  };

  // 写入项目
  const writeResult = await fm.writeProjectData(projectId, projectData);
  if (!writeResult.success) {
    return { success: false, error: writeResult.error };
  }

  // 更新或创建 task-plan.yaml
  let taskPlan: import('./types.js').TaskPlan;
  const taskPlanResult = await fm.readTaskPlan();

  if (taskPlanResult.success && taskPlanResult.data) {
    taskPlan = {
      ...taskPlanResult.data,
      projects: [
        ...taskPlanResult.data.projects,
        {
          project_id: projectId,
          project: name,
          status: 'active',
          updated: now,
          path: `${projectId}/tasks.yaml`,
        },
      ],
    };
  } else {
    taskPlan = {
      meta: {
        name: 'SuperPlanners',
        version: '1.0.0',
        updated: now,
      },
      projects: [
        {
          project_id: projectId,
          project: name,
          status: 'active',
          updated: now,
          path: `${projectId}/tasks.yaml`,
        },
      ],
    };
  }

  await fm.writeTaskPlan(taskPlan);

  // 计算摘要
  const summary = calculateTaskSummary(tasks);
  const totalEstimate = tasks
    .map((t) => t.estimate || '0h')
    .join(' + ');
  const nextTask = selectNextTask(tasks);

  return {
    success: true,
    project_id: projectId,
    project_name: name,
    summary: {
      total_tasks: summary.total,
      total_estimate: totalEstimate,
    },
    files: {
      index_yaml: 'tasks/task-plan.yaml',
      index_md: 'tasks/task-plan.md',
      project_yaml: `tasks/${projectId}/tasks.yaml`,
      project_md: `tasks/${projectId}/tasks.md`,
    },
    next_task: nextTask,
  };
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/server.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/server.ts mcp-server/src/server.test.ts
git commit -m "feat(mcp): 实现 superplanners_plan Tool

- 创建项目和任务结构
- 自动生成 project_id
- 更新 task-plan.yaml 索引
- 返回文件路径和下一任务推荐"
```

---

## Task 7: 创建 Plugin 配置

**Files:**
- Create: `.claude-plugin/plugin.json`

**Step 1: 创建 plugin.json**

```json
{
  "name": "superplanners",
  "displayName": "SuperPlanners",
  "description": "智能任务分解与管理系统",
  "version": "0.1.0",
  "commands": "commands"
}
```

**Step 2: 验证 JSON 格式**

Run: `cat .claude-plugin/plugin.json | python3 -m json.tool > /dev/null && echo "Valid" || echo "Invalid"`

Expected: `Valid`

**Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat(plugin): 创建 plugin.json 配置

- 配置插件名称和描述
- 指定 commands 目录"
```

---

## Task 8: 创建 plan.md 命令

**Files:**
- Create: `commands/plan.md`

**Step 1: 创建 plan.md**

```markdown
---
name: plan
description: 根据需求创建结构化任务计划
arguments:
  - name: requirement
    description: 需求描述
    required: true
  - name: project_name
    description: 项目名称（可选）
    required: false
---

# SuperPlanners - 创建任务计划

根据用户的需求描述，创建结构化的任务计划。

## 使用方法

调用 `superplanners_plan` MCP Tool：

```
参数:
- requirement: {{{requirement}}}
- project_name: {{{project_name}}}
```

## 执行流程

1. 分析需求描述
2. 拆解为可执行的原子任务（Epic → Feature → Task → Subtask）
3. 生成 tasks.yaml 和 tasks.md 文件
4. 更新 task-plan.yaml 索引

## 注意事项

- 每个任务应该是单一职责、0.5-4 小时可完成
- 任务之间需要明确依赖关系
- 每个任务需要有可验证的完成标准
```

**Step 2: Commit**

```bash
git add commands/plan.md
git commit -m "feat(plugin): 创建 /superplanners:plan 命令

- 定义 requirement 和 project_name 参数
- 说明使用方法和执行流程"
```

---

## Task 9: 创建 status.md 命令

**Files:**
- Create: `commands/status.md`

**Step 1: 创建 status.md**

```markdown
---
name: status
description: 查看任务状态和进度
arguments:
  - name: project_id
    description: 项目ID（可选，不填显示全部项目）
    required: false
---

# SuperPlanners - 查看状态

查看任务状态和整体进度。

## 使用方法

调用 `superplanners_status` MCP Tool：

```
参数:
- project_id: {{{project_id}}}
```

## 输出内容

### 全局视图（不指定 project_id）

- 所有项目列表
- 每个项目的进度
- 项目状态（active/completed）
- 更新时间

### 项目视图（指定 project_id）

- 项目基本信息
- 进度条和百分比
- 任务统计（已完成/进行中/待开始/阻塞/跳过）
- 当前任务
- 完整任务列表

## 注意事项

- summary、progress 等数据是实时计算的，不存储在 YAML 中
```

**Step 2: Commit**

```bash
git add commands/status.md
git commit -m "feat(plugin): 创建 /superplanners:status 命令

- 支持全局视图和项目视图
- 说明输出内容格式"
```

---

## Task 10: 创建 reset.md 命令

**Files:**
- Create: `commands/reset.md`

**Step 1: 创建 reset.md**

```markdown
---
name: reset
description: 归档清理或恢复历史任务
arguments:
  - name: action
    description: 操作类型 (cleanup/list/restore)
    required: true
  - name: target
    description: 目标ID (project_id 或 archive_id)
    required: false
---

# SuperPlanners - 归档与恢复

归档清理或恢复历史任务。

## 使用方法

调用 `superplanners_reset` MCP Tool。

### 子命令

#### cleanup - 归档项目

```
/superplanners:reset cleanup [project_id]
```

- 不指定 project_id：归档所有已完成的项目
- 指定 project_id：归档指定项目

#### list - 列出归档

```
/superplanners:reset list
```

列出所有归档历史。

#### restore - 恢复归档

```
/superplanners:reset restore <archive_id>
```

从归档恢复指定项目。

## 参数映射

根据 action 类型：
- cleanup: target → project_id
- restore: target → archive_id

## 注意事项

- 归档后的项目存放在 `tasks/.archive/` 目录
- 恢复时如果项目已存在会失败
- 归档文件不可变，保持完整快照
```

**Step 2: Commit**

```bash
git add commands/reset.md
git commit -m "feat(plugin): 创建 /superplanners:reset 命令

- 支持 cleanup/list/restore 三种操作
- 说明子命令用法和参数映射"
```

---

## Task 11: 验证完整构建

**Step 1: 运行所有测试**

Run: `cd mcp-server && npm run test:run`

Expected: 所有测试通过

**Step 2: 构建项目**

Run: `cd mcp-server && npm run build`

Expected: 编译成功

**Step 3: 验证 MCP Server 可启动**

Run: `cd mcp-server && echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | timeout 2 node dist/index.js 2>/dev/null || true`

Expected: 返回 JSON 响应（或超时，说明服务正常等待）

**Step 4: Commit 最终状态**

```bash
git add .
git commit -m "feat: 完成 MCP Server 和 Plugin 实现

- 4 个 MCP Tools 全部实现
- 3 个 Plugin Commands 创建完成
- 所有测试通过，构建成功"
```

---

## 第四批完成检查点

**完成的模块:**
1. ✅ MCP Server 入口 (index.ts)
2. ✅ Tool 注册框架 (server.ts)
3. ✅ superplanners_status Tool
4. ✅ superplanners_update Tool
5. ✅ superplanners_reset Tool
6. ✅ superplanners_plan Tool
7. ✅ Plugin 配置 (plugin.json)
8. ✅ /superplanners:plan 命令
9. ✅ /superplanners:status 命令
10. ✅ /superplanners:reset 命令

**验证命令:**

```bash
cd mcp-server && npm run test:run && npm run build
```

Expected: 所有测试通过，编译成功

---

## 下一批预告

第五批将完成 **测试 + 文档 + 发布**：
- 补充集成测试
- 编写 README.md
- 配置 npm 发布

文件: `docs/plans/2026-01-24-superplanners-implementation-batch5.md`
