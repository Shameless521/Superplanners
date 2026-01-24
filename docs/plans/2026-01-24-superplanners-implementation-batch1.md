# SuperPlanners 实施计划 - 第一批：基础设施与核心类型

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 SuperPlanners MCP Server 的项目基础设施和核心类型定义

**Architecture:** TypeScript + MCP SDK 架构，采用 TDD 开发模式。项目分为 mcp-server（核心服务）和 commands（Plugin 命令）两个主要部分。

**Tech Stack:** TypeScript 5.3+, Node.js 20+, @modelcontextprotocol/sdk, yaml, zod, vitest

---

## Task 1: 创建项目目录结构

**Files:**
- Create: `mcp-server/src/task-engine/.gitkeep`
- Create: `commands/.gitkeep`
- Create: `.claude-plugin/.gitkeep`

**Step 1: 创建 mcp-server 目录结构**

```bash
mkdir -p mcp-server/src/task-engine
```

**Step 2: 创建 commands 目录**

```bash
mkdir -p commands
```

**Step 3: 创建 .claude-plugin 目录**

```bash
mkdir -p .claude-plugin
```

**Step 4: 添加 .gitkeep 文件保持空目录**

```bash
touch mcp-server/src/task-engine/.gitkeep
touch commands/.gitkeep
touch .claude-plugin/.gitkeep
```

**Step 5: 验证目录结构**

Run: `find . -type d -name "node_modules" -prune -o -type d -print | head -20`

Expected output 包含:
```
./mcp-server
./mcp-server/src
./mcp-server/src/task-engine
./commands
./.claude-plugin
```

**Step 6: Commit**

```bash
git add .
git commit -m "chore: 初始化项目目录结构

- 创建 mcp-server/src/task-engine/ 用于 Task Engine 模块
- 创建 commands/ 用于 Plugin 命令定义
- 创建 .claude-plugin/ 用于插件配置"
```

---

## Task 2: 配置 package.json

**Files:**
- Create: `mcp-server/package.json`

**Step 1: 创建 package.json**

```json
{
  "name": "superplanners-mcp",
  "version": "0.1.0",
  "description": "智能任务分解与管理系统 - MCP Server",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "superplanners-mcp": "dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "mcp",
    "claude",
    "task-management",
    "ai"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "yaml": "^2.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "files": [
    "dist"
  ]
}
```

**Step 2: 验证 JSON 格式正确**

Run: `cd mcp-server && cat package.json | python3 -m json.tool > /dev/null && echo "JSON valid" || echo "JSON invalid"`

Expected: `JSON valid`

**Step 3: 安装依赖**

Run: `cd mcp-server && npm install`

Expected: 依赖安装成功，生成 node_modules 和 package-lock.json

**Step 4: 验证依赖安装**

Run: `cd mcp-server && npm ls --depth=0`

Expected output 包含:
```
├── @modelcontextprotocol/sdk@1.x.x
├── yaml@2.x.x
├── zod@3.x.x
```

**Step 5: Commit**

```bash
git add mcp-server/package.json mcp-server/package-lock.json
git commit -m "chore: 配置 package.json 和安装依赖

- 包名: superplanners-mcp
- 运行时依赖: @modelcontextprotocol/sdk, yaml, zod
- 开发依赖: typescript, tsx, vitest
- 配置 scripts: dev, build, test"
```

---

## Task 3: 配置 tsconfig.json

**Files:**
- Create: `mcp-server/tsconfig.json`

**Step 1: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 2: 创建一个最小的入口文件用于验证编译**

```typescript
// mcp-server/src/index.ts
console.log('SuperPlanners MCP Server');
```

**Step 3: 验证 TypeScript 编译**

Run: `cd mcp-server && npm run build`

Expected: 编译成功，生成 dist/index.js

**Step 4: 验证编译输出**

Run: `cd mcp-server && node dist/index.js`

Expected: `SuperPlanners MCP Server`

**Step 5: Commit**

```bash
git add mcp-server/tsconfig.json mcp-server/src/index.ts
git commit -m "chore: 配置 TypeScript 编译

- target: ES2022, module: NodeNext
- strict mode 启用
- 验证编译流程正常"
```

---

## Task 4: 配置 Vitest 测试框架

**Files:**
- Create: `mcp-server/vitest.config.ts`
- Create: `mcp-server/src/index.test.ts`

**Step 1: 创建 vitest.config.ts**

```typescript
// mcp-server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Step 2: 创建一个简单的测试文件验证配置**

```typescript
// mcp-server/src/index.test.ts
import { describe, it, expect } from 'vitest';

describe('SuperPlanners', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 3: 运行测试验证配置**

Run: `cd mcp-server && npm run test:run`

Expected:
```
✓ src/index.test.ts (1)
  ✓ SuperPlanners (1)
    ✓ should pass a simple test

Test Files  1 passed (1)
Tests       1 passed (1)
```

**Step 4: Commit**

```bash
git add mcp-server/vitest.config.ts mcp-server/src/index.test.ts
git commit -m "chore: 配置 Vitest 测试框架

- 配置测试文件匹配规则 src/**/*.test.ts
- 验证测试运行正常"
```

---

## Task 5: 创建 .gitignore

**Files:**
- Create: `.gitignore`

**Step 1: 创建 .gitignore**

```gitignore
# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Logs
*.log
npm-debug.log*

# Tasks data (runtime generated)
tasks/
```

**Step 2: 验证 .gitignore 生效**

Run: `git status --ignored | grep -E "(node_modules|dist)" | head -5`

Expected: 显示 node_modules 和 dist 被忽略

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: 添加 .gitignore

- 忽略 node_modules/, dist/, .env
- 忽略 IDE 配置和系统文件
- 忽略运行时生成的 tasks/ 目录"
```

---

## Task 6: 定义任务状态和优先级类型

**Files:**
- Create: `mcp-server/src/types.ts`
- Create: `mcp-server/src/types.test.ts`

**Step 1: 编写类型定义测试**

```typescript
// mcp-server/src/types.test.ts
import { describe, it, expect } from 'vitest';
import { TaskStatusSchema, TaskPrioritySchema } from './types.js';

describe('Types', () => {
  describe('TaskStatus', () => {
    it('should accept valid status values', () => {
      expect(TaskStatusSchema.parse('pending')).toBe('pending');
      expect(TaskStatusSchema.parse('in_progress')).toBe('in_progress');
      expect(TaskStatusSchema.parse('completed')).toBe('completed');
      expect(TaskStatusSchema.parse('blocked')).toBe('blocked');
      expect(TaskStatusSchema.parse('skipped')).toBe('skipped');
    });

    it('should reject invalid status values', () => {
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
      expect(() => TaskStatusSchema.parse('')).toThrow();
    });
  });

  describe('TaskPriority', () => {
    it('should accept valid priority values', () => {
      expect(TaskPrioritySchema.parse('critical')).toBe('critical');
      expect(TaskPrioritySchema.parse('high')).toBe('high');
      expect(TaskPrioritySchema.parse('medium')).toBe('medium');
      expect(TaskPrioritySchema.parse('low')).toBe('low');
    });

    it('should reject invalid priority values', () => {
      expect(() => TaskPrioritySchema.parse('urgent')).toThrow();
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL - 找不到 types.js 模块

**Step 3: 实现类型定义**

```typescript
// mcp-server/src/types.ts
import { z } from 'zod';

// ============================================
// 基础枚举类型
// ============================================

/**
 * 任务状态
 * - pending: 待开始
 * - in_progress: 进行中
 * - completed: 已完成
 * - blocked: 阻塞中
 * - skipped: 已跳过
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * 任务优先级
 * - critical: 紧急
 * - high: 高
 * - medium: 中
 * - low: 低
 */
export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 TaskStatus 和 TaskPriority 类型

- TaskStatus: pending, in_progress, completed, blocked, skipped
- TaskPriority: critical, high, medium, low
- 使用 Zod 进行运行时类型校验"
```

---

## Task 7: 定义 Task 和 SubTask 接口

**Files:**
- Modify: `mcp-server/src/types.ts`
- Modify: `mcp-server/src/types.test.ts`

**Step 1: 添加 Task 和 SubTask 测试**

```typescript
// 在 mcp-server/src/types.test.ts 中添加

import { SubTaskSchema, TaskSchema } from './types.js';

describe('SubTask', () => {
  it('should accept valid subtask', () => {
    const subtask = {
      id: '1.1',
      title: '设计接口规范',
      status: 'pending',
    };
    expect(SubTaskSchema.parse(subtask)).toEqual(subtask);
  });

  it('should accept subtask with notes', () => {
    const subtask = {
      id: '1.1',
      title: '设计接口规范',
      status: 'completed',
      notes: '已完成评审',
    };
    expect(SubTaskSchema.parse(subtask)).toEqual(subtask);
  });

  it('should reject subtask without required fields', () => {
    expect(() => SubTaskSchema.parse({ id: '1.1' })).toThrow();
    expect(() => SubTaskSchema.parse({ title: 'test' })).toThrow();
  });
});

describe('Task', () => {
  it('should accept minimal valid task', () => {
    const task = {
      id: '1',
      title: '后端 API 开发',
      status: 'pending',
      priority: 'high',
    };
    expect(TaskSchema.parse(task)).toEqual(task);
  });

  it('should accept full task with all optional fields', () => {
    const task = {
      id: '1',
      title: '后端 API 开发',
      description: '开发登录相关的后端 API',
      status: 'in_progress',
      priority: 'high',
      estimate: '8h',
      actual: '6h',
      dependencies: ['0.1', '0.2'],
      subtasks: [
        { id: '1.1', title: '设计接口', status: 'completed' },
        { id: '1.2', title: '实现逻辑', status: 'in_progress' },
      ],
      notes: '进展顺利',
      started_at: '2025-01-23T10:00:00Z',
      completed_at: undefined,
    };
    const result = TaskSchema.parse(task);
    expect(result.id).toBe('1');
    expect(result.subtasks).toHaveLength(2);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL - SubTaskSchema 和 TaskSchema 未定义

**Step 3: 实现 SubTask 和 Task Schema**

```typescript
// 在 mcp-server/src/types.ts 中添加

// ============================================
// SubTask 数据结构
// ============================================

export const SubTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema,
  notes: z.string().optional(),
});
export type SubTask = z.infer<typeof SubTaskSchema>;

// ============================================
// Task 数据结构
// ============================================

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  estimate: z.string().optional(),
  actual: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  subtasks: z.array(SubTaskSchema).optional(),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});
export type Task = z.infer<typeof TaskSchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 Task 和 SubTask 数据结构

- SubTask: id, title, status, notes?
- Task: id, title, description?, status, priority, estimate?,
  actual?, dependencies?, subtasks?, notes?, started_at?, completed_at?"
```

---

## Task 8: 定义 ProjectMeta 和 TaskSummary 接口

**Files:**
- Modify: `mcp-server/src/types.ts`
- Modify: `mcp-server/src/types.test.ts`

**Step 1: 添加 ProjectMeta 和 TaskSummary 测试**

```typescript
// 在 mcp-server/src/types.test.ts 中添加

import { ProjectMetaSchema, TaskSummarySchema } from './types.js';

describe('ProjectMeta', () => {
  it('should accept valid project meta', () => {
    const meta = {
      project: '用户登录功能',
      project_id: 'user-login',
      created: '2025-01-23T10:00:00Z',
      updated: '2025-01-23T10:30:00Z',
      version: 1,
    };
    expect(ProjectMetaSchema.parse(meta)).toEqual(meta);
  });

  it('should accept project meta with description', () => {
    const meta = {
      project: '用户登录功能',
      project_id: 'user-login',
      created: '2025-01-23T10:00:00Z',
      updated: '2025-01-23T10:30:00Z',
      version: 1,
      description: '开发完整的用户登录功能',
    };
    expect(ProjectMetaSchema.parse(meta)).toEqual(meta);
  });
});

describe('TaskSummary', () => {
  it('should accept valid task summary', () => {
    const summary = {
      total: 12,
      completed: 3,
      in_progress: 1,
      blocked: 0,
      pending: 8,
      skipped: 0,
    };
    expect(TaskSummarySchema.parse(summary)).toEqual(summary);
  });

  it('should reject negative numbers', () => {
    const summary = {
      total: -1,
      completed: 0,
      in_progress: 0,
      blocked: 0,
      pending: 0,
      skipped: 0,
    };
    expect(() => TaskSummarySchema.parse(summary)).toThrow();
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL - ProjectMetaSchema 和 TaskSummarySchema 未定义

**Step 3: 实现 ProjectMeta 和 TaskSummary Schema**

```typescript
// 在 mcp-server/src/types.ts 中添加

// ============================================
// ProjectMeta 数据结构
// ============================================

export const ProjectMetaSchema = z.object({
  project: z.string().min(1),
  project_id: z.string().min(1),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  version: z.number().int().positive(),
  description: z.string().optional(),
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

// ============================================
// TaskSummary 数据结构（实时计算，不存储）
// ============================================

export const TaskSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  in_progress: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export type TaskSummary = z.infer<typeof TaskSummarySchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 ProjectMeta 和 TaskSummary 数据结构

- ProjectMeta: project, project_id, created, updated, version, description?
- TaskSummary: total, completed, in_progress, blocked, pending, skipped
- TaskSummary 用于实时计算，不存储在 YAML 中"
```

---

## Task 9: 定义 ProjectData 和 TaskPlan 完整数据结构

**Files:**
- Modify: `mcp-server/src/types.ts`
- Modify: `mcp-server/src/types.test.ts`

**Step 1: 添加完整数据结构测试**

```typescript
// 在 mcp-server/src/types.test.ts 中添加

import { ProjectDataSchema, TaskPlanSchema } from './types.js';

describe('ProjectData', () => {
  it('should accept valid project data (tasks.yaml format)', () => {
    const data = {
      meta: {
        project: '用户登录功能',
        project_id: 'user-login',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:30:00Z',
        version: 1,
      },
      tasks: [
        {
          id: '1',
          title: '后端 API 开发',
          status: 'in_progress',
          priority: 'high',
          subtasks: [
            { id: '1.1', title: '设计接口', status: 'completed' },
          ],
        },
      ],
    };
    const result = ProjectDataSchema.parse(data);
    expect(result.meta.project_id).toBe('user-login');
    expect(result.tasks).toHaveLength(1);
  });
});

describe('TaskPlan', () => {
  it('should accept valid task plan (task-plan.yaml format)', () => {
    const plan = {
      meta: {
        name: 'SuperPlanners',
        version: '1.0.0',
        updated: '2025-01-23T10:30:00Z',
      },
      projects: [
        {
          project_id: 'user-login',
          project: '用户登录功能',
          status: 'active',
          updated: '2025-01-23T10:30:00Z',
          path: 'user-login/tasks.yaml',
        },
      ],
    };
    const result = TaskPlanSchema.parse(plan);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].status).toBe('active');
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL

**Step 3: 实现完整数据结构**

```typescript
// 在 mcp-server/src/types.ts 中添加

// ============================================
// ProjectData 完整数据结构 (tasks.yaml)
// ============================================

export const ProjectDataSchema = z.object({
  meta: ProjectMetaSchema,
  tasks: z.array(TaskSchema),
});
export type ProjectData = z.infer<typeof ProjectDataSchema>;

// ============================================
// TaskPlan 索引数据结构 (task-plan.yaml)
// ============================================

export const ProjectStatusSchema = z.enum(['active', 'completed']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectEntrySchema = z.object({
  project_id: z.string().min(1),
  project: z.string().min(1),
  status: ProjectStatusSchema,
  updated: z.string().datetime(),
  path: z.string().min(1),
});
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

export const TaskPlanMetaSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  updated: z.string().datetime(),
});
export type TaskPlanMeta = z.infer<typeof TaskPlanMetaSchema>;

export const TaskPlanSchema = z.object({
  meta: TaskPlanMetaSchema,
  projects: z.array(ProjectEntrySchema),
});
export type TaskPlan = z.infer<typeof TaskPlanSchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 ProjectData 和 TaskPlan 完整数据结构

- ProjectData: tasks.yaml 文件格式 (meta + tasks[])
- TaskPlan: task-plan.yaml 文件格式 (meta + projects[])
- ProjectEntry: 项目索引条目"
```

---

## Task 10: 定义 MCP Tool 输入/输出 Schema

**Files:**
- Modify: `mcp-server/src/types.ts`
- Modify: `mcp-server/src/types.test.ts`

**Step 1: 添加 MCP Tool Schema 测试**

```typescript
// 在 mcp-server/src/types.test.ts 中添加

import {
  PlanInputSchema,
  StatusInputSchema,
  UpdateInputSchema,
  ResetInputSchema,
} from './types.js';

describe('MCP Tool Input Schemas', () => {
  describe('PlanInput', () => {
    it('should accept requirement only', () => {
      const input = { requirement: '开发用户登录功能' };
      expect(PlanInputSchema.parse(input)).toEqual(input);
    });

    it('should accept requirement with project_name', () => {
      const input = {
        requirement: '开发用户登录功能',
        project_name: '用户登录',
      };
      expect(PlanInputSchema.parse(input)).toEqual(input);
    });
  });

  describe('StatusInput', () => {
    it('should accept empty input for global view', () => {
      expect(StatusInputSchema.parse({})).toEqual({});
    });

    it('should accept project_id for project view', () => {
      const input = { project_id: 'user-login' };
      expect(StatusInputSchema.parse(input)).toEqual(input);
    });
  });

  describe('UpdateInput', () => {
    it('should accept valid update input', () => {
      const input = {
        project_id: 'user-login',
        task_id: '1.1',
        status: 'completed',
      };
      expect(UpdateInputSchema.parse(input)).toEqual(input);
    });

    it('should accept update with notes', () => {
      const input = {
        project_id: 'user-login',
        task_id: '1.1',
        status: 'blocked',
        notes: '等待设计稿',
      };
      expect(UpdateInputSchema.parse(input)).toEqual(input);
    });
  });

  describe('ResetInput', () => {
    it('should accept cleanup action', () => {
      const input = { action: 'cleanup' };
      expect(ResetInputSchema.parse(input)).toEqual(input);
    });

    it('should accept cleanup with project_id', () => {
      const input = { action: 'cleanup', project_id: 'user-login' };
      expect(ResetInputSchema.parse(input)).toEqual(input);
    });

    it('should accept list action', () => {
      const input = { action: 'list' };
      expect(ResetInputSchema.parse(input)).toEqual(input);
    });

    it('should accept restore action with archive_id', () => {
      const input = {
        action: 'restore',
        archive_id: '2025-01-23-183500-user-login',
      };
      expect(ResetInputSchema.parse(input)).toEqual(input);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL

**Step 3: 实现 MCP Tool Input Schema**

```typescript
// 在 mcp-server/src/types.ts 中添加

// ============================================
// MCP Tool Input Schemas
// ============================================

// superplanners_plan 输入
export const PlanInputSchema = z.object({
  requirement: z.string().min(1),
  project_name: z.string().optional(),
});
export type PlanInput = z.infer<typeof PlanInputSchema>;

// superplanners_status 输入
export const StatusInputSchema = z.object({
  project_id: z.string().optional(),
});
export type StatusInput = z.infer<typeof StatusInputSchema>;

// superplanners_update 输入
export const UpdateInputSchema = z.object({
  project_id: z.string().min(1),
  task_id: z.string().min(1),
  status: TaskStatusSchema,
  notes: z.string().optional(),
});
export type UpdateInput = z.infer<typeof UpdateInputSchema>;

// superplanners_reset 输入
export const ResetActionSchema = z.enum(['cleanup', 'list', 'restore']);
export type ResetAction = z.infer<typeof ResetActionSchema>;

export const ResetInputSchema = z.object({
  action: ResetActionSchema,
  project_id: z.string().optional(),
  archive_id: z.string().optional(),
});
export type ResetInput = z.infer<typeof ResetInputSchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 MCP Tool 输入 Schema

- PlanInput: requirement, project_name?
- StatusInput: project_id?
- UpdateInput: project_id, task_id, status, notes?
- ResetInput: action (cleanup|list|restore), project_id?, archive_id?"
```

---

## Task 11: 定义 MCP Tool 输出 Schema

**Files:**
- Modify: `mcp-server/src/types.ts`
- Modify: `mcp-server/src/types.test.ts`

**Step 1: 添加 MCP Tool Output Schema 测试**

```typescript
// 在 mcp-server/src/types.test.ts 中添加

import {
  PlanOutputSchema,
  StatusGlobalOutputSchema,
  StatusProjectOutputSchema,
  UpdateOutputSchema,
} from './types.js';

describe('MCP Tool Output Schemas', () => {
  describe('PlanOutput', () => {
    it('should accept valid plan output', () => {
      const output = {
        success: true,
        project_id: 'user-login',
        project_name: '用户登录功能',
        summary: {
          total_tasks: 12,
          total_estimate: '24h',
        },
        files: {
          index_yaml: 'tasks/task-plan.yaml',
          index_md: 'tasks/task-plan.md',
          project_yaml: 'tasks/user-login/tasks.yaml',
          project_md: 'tasks/user-login/tasks.md',
        },
        next_task: {
          id: '1',
          title: '后端 API 开发',
        },
      };
      expect(PlanOutputSchema.parse(output).success).toBe(true);
    });
  });

  describe('StatusGlobalOutput', () => {
    it('should accept valid global status output', () => {
      const output = {
        success: true,
        total_projects: 2,
        projects: [
          {
            id: 'user-login',
            name: '用户登录功能',
            status: 'active',
            progress: '3/12',
            updated: '2025-01-23T10:30:00Z',
          },
        ],
      };
      expect(StatusGlobalOutputSchema.parse(output).success).toBe(true);
    });
  });

  describe('UpdateOutput', () => {
    it('should accept valid update output', () => {
      const output = {
        success: true,
        updated: {
          task_id: '1.1',
          status: 'completed',
        },
        summary: {
          total: 12,
          completed: 4,
          in_progress: 1,
          blocked: 0,
          pending: 7,
          skipped: 0,
        },
        progress: {
          completed: 4,
          total: 12,
          percentage: 33,
        },
        next_task: {
          id: '1.2',
          title: '实现验证逻辑',
        },
      };
      expect(UpdateOutputSchema.parse(output).success).toBe(true);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: FAIL

**Step 3: 实现 MCP Tool Output Schema**

```typescript
// 在 mcp-server/src/types.ts 中添加

// ============================================
// MCP Tool Output Schemas
// ============================================

// 通用进度信息
export const ProgressInfoSchema = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  percentage: z.number().nonnegative(),
});
export type ProgressInfo = z.infer<typeof ProgressInfoSchema>;

// 下一任务信息
export const NextTaskInfoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .nullable();
export type NextTaskInfo = z.infer<typeof NextTaskInfoSchema>;

// superplanners_plan 输出
export const PlanOutputSchema = z.object({
  success: z.boolean(),
  project_id: z.string(),
  project_name: z.string(),
  summary: z.object({
    total_tasks: z.number(),
    total_estimate: z.string(),
  }),
  files: z.object({
    index_yaml: z.string(),
    index_md: z.string(),
    project_yaml: z.string(),
    project_md: z.string(),
  }),
  next_task: NextTaskInfoSchema,
});
export type PlanOutput = z.infer<typeof PlanOutputSchema>;

// superplanners_status 全局视图输出
export const StatusGlobalOutputSchema = z.object({
  success: z.boolean(),
  total_projects: z.number(),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: ProjectStatusSchema,
      progress: z.string(),
      updated: z.string(),
    })
  ),
});
export type StatusGlobalOutput = z.infer<typeof StatusGlobalOutputSchema>;

// superplanners_status 项目视图输出
export const StatusProjectOutputSchema = z.object({
  success: z.boolean(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    updated: z.string(),
  }),
  summary: TaskSummarySchema,
  progress: ProgressInfoSchema,
  current_task: NextTaskInfoSchema,
  tasks: z.array(TaskSchema),
});
export type StatusProjectOutput = z.infer<typeof StatusProjectOutputSchema>;

// superplanners_update 输出
export const UpdateOutputSchema = z.object({
  success: z.boolean(),
  updated: z.object({
    task_id: z.string(),
    status: z.string(),
    notes: z.string().optional(),
  }),
  summary: TaskSummarySchema,
  progress: ProgressInfoSchema,
  next_task: NextTaskInfoSchema,
});
export type UpdateOutput = z.infer<typeof UpdateOutputSchema>;

// superplanners_reset 输出
export const ResetCleanupOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('cleanup'),
  archived_count: z.number(),
  archived: z.array(z.string()),
});

export const ResetListOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('list'),
  total: z.number(),
  archives: z.array(
    z.object({
      archive_id: z.string(),
      project_id: z.string(),
      archived_at: z.string(),
    })
  ),
});

export const ResetRestoreOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('restore'),
  restored_project_id: z.string(),
  from_archive: z.string(),
});

// 错误输出
export const ErrorOutputSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});
export type ErrorOutput = z.infer<typeof ErrorOutputSchema>;
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/types.test.ts`

Expected: 所有测试通过

**Step 5: 运行所有测试确认整体正确**

Run: `cd mcp-server && npm run test:run`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/types.ts mcp-server/src/types.test.ts
git commit -m "feat: 定义 MCP Tool 输出 Schema

- PlanOutput: success, project_id, summary, files, next_task
- StatusGlobalOutput: projects[], total_projects
- StatusProjectOutput: project, summary, progress, tasks[]
- UpdateOutput: updated, summary, progress, next_task
- ResetOutput: cleanup/list/restore 三种输出格式
- ErrorOutput: 统一错误格式"
```

---

## 第一批完成检查点

**完成的任务:**
1. ✅ 创建项目目录结构
2. ✅ 配置 package.json
3. ✅ 配置 tsconfig.json
4. ✅ 配置 Vitest 测试框架
5. ✅ 创建 .gitignore
6. ✅ 定义 TaskStatus 和 TaskPriority
7. ✅ 定义 Task 和 SubTask
8. ✅ 定义 ProjectMeta 和 TaskSummary
9. ✅ 定义 ProjectData 和 TaskPlan
10. ✅ 定义 MCP Tool 输入 Schema
11. ✅ 定义 MCP Tool 输出 Schema

**验证命令:**

```bash
cd mcp-server && npm run test:run && npm run build
```

Expected: 所有测试通过，编译成功

---

## 下一批预告

第二批将实现 **Task Engine 核心模块**：
- Task Graph Parser
- Status Reducer
- Dependency Resolver
- Progress Calculator
- Next Task Selector

文件: `docs/plans/2026-01-24-superplanners-implementation-batch2.md`
