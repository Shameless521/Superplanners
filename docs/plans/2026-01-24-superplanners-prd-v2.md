# SuperPlanners

智能任务分解与管理系统

**产品需求文档（PRD）**

- 版本：**2.0.0**
- 日期：**2026-01-24**
- 作者：Claude（基于 v1.0.0 和 v1.1.0 合并整理）

---

## 目录

1. [项目概述](#1-项目概述)
2. [核心设计原则](#2-核心设计原则)
3. [系统架构](#3-系统架构)
4. [Task Engine](#4-task-engine)
5. [功能需求](#5-功能需求)
6. [数据模型](#6-数据模型)
7. [接口定义](#7-接口定义-mcp-tools)
8. [文件结构](#8-文件结构)
9. [安装部署](#9-安装部署)
10. [使用指南](#10-使用指南)
11. [技术选型](#11-技术选型)
12. [版本演进策略](#12-版本演进策略)
13. [项目交付物](#13-项目交付物)

---

## 1. 项目概述

### 1.1 背景与目标

SuperPlanners 是一个**面向 Claude Code / MCP 环境的智能任务分解与状态管理系统**。它能够将复杂的需求或方案自动拆解为可执行的原子任务，并提供持久化的状态追踪能力。

它的核心使命是：

> **让一次性 AI 对话，升级为可中断、可恢复、可持续推进的工程协作流程。**

### 1.2 核心价值

- **结构化任务分解**：
  将模糊需求转化为具有层级、依赖和验收标准的任务图（Task Graph）

- **文件驱动的长期记忆**：
  使用本地文件系统作为持久化状态载体，不依赖 Claude 会话

- **人机双友好输出**：
  - YAML：唯一真实数据源（机器友好）
  - Markdown：只读渲染视图（人类友好）

- **自然语言即指令**：
  用户无需学习系统命令，系统通过 NLP 自动识别并执行状态变更

### 1.3 目标用户

- 使用 Claude Code 进行真实工程开发的工程师
- 需要管理复杂需求 / 重构 / 长周期项目的技术负责人
- 希望让 AI 真正"跟着做项目"的个人或团队

### 1.4 术语定义

| 术语 | 定义 |
|------|------|
| MCP | Model Context Protocol，模型上下文协议，允许 LLM 与外部服务交互 |
| Plugin | Claude Code 插件，提供 /command 形式的快捷命令 |
| 原子任务 | 单一职责、0.5-4 小时可完成、可验证的最小任务单元 |
| Epic | 史诗，最高层级的需求或项目 |
| Feature | 功能，Epic 下的主要交付物 |
| Task | 任务，可实现的工作单元 |
| Subtask | 子任务，Task 下的原子操作 |
| SSOT | Single Source of Truth，单一真实数据源 |
| Task Engine | 任务引擎，SuperPlanners 的核心领域模块 |

---

## 2. 核心设计原则

### 2.1 单一真实数据源原则（SSOT）

- **YAML 文件是唯一真实状态**
- 所有状态更新、计算、恢复均基于 YAML
- Markdown 文件**禁止作为输入源或编辑对象**

> Markdown = Rendered View，而不是 Storage

---

### 2.2 原子事务原则

每一次 MCP Tool 调用必须满足：

1. 读取 YAML
2. 执行状态变更（纯函数）
3. 完整校验（schema + 逻辑）
4. 原子写回 YAML
5. 基于 YAML 重新渲染 Markdown

任何一步失败，整体回滚。

---

### 2.3 无状态服务原则

- MCP Server **不保存任何内存态业务状态**
- 任意时刻可重启，不影响项目数据
- 文件系统即最终事实

---

### 2.4 向后兼容原则

- 文件格式变更需保持读取兼容性
- 新版本应能读取旧版本生成的数据文件

---

## 3. 系统架构

### 3.1 总体架构

系统采用 Plugin + MCP Server 的双层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                       用户使用层                             │
│    /superplanners:plan     创建任务计划                      │
│    /superplanners:status   查看状态                          │
│    /superplanners:reset    归档清理                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Claude Code Plugin: superplanners               │
│  commands/plan.md | commands/status.md | commands/reset.md  │
└─────────────────────────────┬───────────────────────────────┘
                              │ 调用 MCP Tools
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server (TypeScript)                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Task Engine（核心领域层）                │    │
│  │   ├─ Task Graph Parser                              │    │
│  │   ├─ Status Reducer                                 │    │
│  │   ├─ Dependency Resolver                            │    │
│  │   ├─ Progress Calculator                            │    │
│  │   └─ Next Task Selector                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ├─ File Manager（IO 层）                                    │
│  └─ Markdown Renderer（纯派生）                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   File System（YAML Only）                   │
│         tasks/task-plan.yaml | {project-id}/tasks.yaml      │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 组件职责划分

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| Plugin | 命令入口、参数收集、用户体验 | Markdown 命令定义 |
| MCP Server | 业务编排、Tool 实现 | TypeScript + MCP SDK |
| Task Engine | 所有任务状态与规则的唯一实现 | TypeScript |
| File Manager | 原子读写 YAML | TypeScript |
| Renderer | 从 YAML 生成 Markdown | TypeScript |
| Storage | 任务数据持久化 | YAML + Markdown 文件 |

---

## 4. Task Engine

> Task Engine 是 SuperPlanners 的"心脏"，所有状态变化都必须经过它。

### 4.1 组件构成

| 组件 | 职责 |
|------|------|
| Task Graph Parser | 解析任务层级结构（Epic → Feature → Task → Subtask） |
| Status Reducer | 执行状态变更（纯函数，合法性校验） |
| Dependency Resolver | 自动处理依赖关系 |
| Progress Calculator | 计算任务摘要与进度（实时计算，不存储） |
| Next Task Selector | 选择下一个推荐任务 |

---

### 4.2 Task Engine 职责

- 解析任务层级结构（Epic → Feature → Task → Subtask）
- 执行状态变更（合法性校验）
- 自动处理依赖关系
- 计算任务摘要与进度
- 选择下一个推荐任务

---

### 4.3 Next Task 推荐规则（确定性算法）

当需要推荐下一个任务时，按以下顺序筛选：

1. `status == pending`
2. 所有 `dependencies` 均为 `completed`
3. 按 `priority`：critical → high → medium → low
4. 按 `estimate`：短 → 长

若无可执行任务，返回 `null` 并给出原因说明（如：所有任务已完成、存在阻塞任务等）。

---

## 5. 功能需求

### 5.1 命令概览

| 命令 | 功能 | 对应 MCP Tool |
|------|------|---------------|
| /superplanners:plan | 根据需求创建任务计划 | superplanners_plan |
| /superplanners:status | 查看任务状态和进度 | superplanners_status |
| /superplanners:reset | 归档清理或恢复历史 | superplanners_reset |
| 自然语言更新 | 通过对话更新任务状态 | superplanners_update |

---

### 5.2 /superplanners:plan 详细需求

#### 功能描述

根据用户提供的需求描述，智能分解为结构化的任务列表。支持引用上文内容。

#### 输入参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| requirement | string | 是 | 需求描述，用于分解成任务 |
| project_name | string | 否 | 项目名称，默认从需求推断 |

#### 任务分解规则

- **原子性**：每个任务单一职责，0.5-4 小时可完成
- **层级结构**：Epic → Feature → Task → Subtask
- **可验证性**：每个任务有明确的完成标准
- **依赖明确**：显式声明任务间的依赖关系

#### 行为约束

- 只生成 YAML 数据
- 所有 Markdown 文件必须由 Renderer 自动生成
- 禁止生成不可验证的任务描述

#### 输出结果

- 创建 `tasks/` 目录结构
- 生成 `task-plan.yaml` 主索引
- 生成 `task-plan.md` 可读版主索引（自动渲染）
- 生成 `{project-id}/tasks.yaml` 项目任务
- 生成 `{project-id}/tasks.md` 可读版项目任务（自动渲染）

---

### 5.3 /superplanners:status 详细需求

#### 功能描述

查看任务状态和整体进度。可以查看所有项目的概览，或指定项目的详细任务列表。

#### 输入参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | string | 否 | 项目ID，不填则显示全部项目 |

#### 输出内容

- **全局视图**：所有项目列表、进度、状态、更新时间
- **项目视图**：任务列表、进度条、当前任务、统计摘要

#### 输出原则

- `progress`、`summary`、`current_task` **不得存储在 YAML**
- 全部为 Task Engine 的实时计算结果

---

### 5.4 /superplanners:reset 详细需求

#### 功能描述

归档清理或恢复历史任务。支持三种操作模式。

#### 操作模式

| 模式 | 命令 | 说明 |
|------|------|------|
| cleanup | /superplanners:reset cleanup [project-id] | 归档已完成项目或指定项目 |
| list | /superplanners:reset list | 列出所有归档历史 |
| restore | /superplanners:reset restore \<archive-id\> | 恢复指定归档 |

---

### 5.5 自然语言更新（安全增强）

用户可以通过自然语言对话更新任务状态，Claude 会自动识别并调用 `superplanners_update` Tool。

#### 示例

| 用户输入 | 识别动作 |
|----------|----------|
| 任务 2.3 完成了 | 更新 2.3 状态为 completed |
| 2.4 阻塞了，等设计稿 | 更新 2.4 状态为 blocked，添加备注 |
| 项目完成了 | 更新所有剩余任务为 completed |
| 开始做 1.2 | 更新 1.2 状态为 in_progress |

#### 两阶段更新机制（推荐）

当用户输入存在歧义时：

1. MCP Server 返回 **更新意图解析结果**
2. Claude 向用户请求确认
3. 确认后才执行 `superplanners_update`

示例：

> 用户："项目完成了"
>
> Claude：
> "你是想：
> 1️⃣ 将所有未完成任务标记为 completed？
> 2️⃣ 只完成当前 Feature？"

---

## 6. 数据模型

### 6.1 任务状态

| 状态值 | 图标 | 说明 |
|--------|------|------|
| pending | ⏸️ | 任务尚未开始 |
| in_progress | 🔄 | 任务正在执行 |
| completed | ✅ | 任务已完成 |
| blocked | 🚫 | 任务被阻塞，需要等待 |
| skipped | ⏭️ | 任务被跳过，不再执行 |

---

### 6.2 任务优先级

| 优先级值 | 说明 |
|----------|------|
| critical | 必须立即处理 |
| high | 重要且紧迫 |
| medium | 正常优先级 |
| low | 可以延后处理 |

---

### 6.3 Task 数据结构

**原则：只存储不可推导信息**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 任务ID，如 '1', '2.1' |
| title | string | 是 | 任务标题 |
| description | string | 否 | 详细描述 |
| status | TaskStatus | 是 | 任务状态 |
| priority | TaskPriority | 是 | 优先级 |
| estimate | string | 否 | 预估时间，如 '2h' |
| actual | string | 否 | 实际时间 |
| dependencies | string[] | 否 | 依赖任务ID列表 |
| subtasks | SubTask[] | 否 | 子任务列表 |
| notes | string | 否 | 备注 |
| started_at | datetime | 否 | 开始时间 |
| completed_at | datetime | 否 | 完成时间 |

---

### 6.4 SubTask 数据结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 子任务ID，如 '1.1', '2.3' |
| title | string | 是 | 子任务标题 |
| status | TaskStatus | 是 | 任务状态 |
| notes | string | 否 | 备注 |

---

### 6.5 ProjectMeta 数据结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | string | 是 | 项目名称 |
| project_id | string | 是 | 项目ID（用于目录名） |
| created | datetime | 是 | 创建时间 |
| updated | datetime | 是 | 更新时间 |
| version | number | 是 | 版本号 |
| description | string | 否 | 项目描述 |

---

### 6.6 TaskSummary 数据结构（实时计算，不存储）

| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总任务数 |
| completed | number | 已完成数 |
| in_progress | number | 进行中数 |
| blocked | number | 阻塞中数 |
| pending | number | 待开始数 |
| skipped | number | 已跳过数 |

> 注意：TaskSummary 由 Task Engine 的 Progress Calculator 实时计算，不存储在 YAML 文件中。

---

### 6.7 YAML 文件格式示例

#### 项目 tasks.yaml

```yaml
meta:
  project: 用户登录功能
  project_id: user-login
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:30:00Z"
  version: 1
  description: 开发完整的用户登录功能

tasks:
  - id: "1"
    title: 后端API开发
    description: 开发登录相关的后端API
    status: in_progress
    priority: high
    estimate: "8h"
    dependencies: []
    subtasks:
      - id: "1.1"
        title: 设计登录接口规范
        status: completed
      - id: "1.2"
        title: 实现用户验证逻辑
        status: in_progress
      - id: "1.3"
        title: 实现JWT生成
        status: pending
```

---

## 7. 接口定义 (MCP Tools)

### 7.1 superplanners_plan

**功能**：根据需求创建结构化任务计划

#### 输入 Schema

```typescript
{
  requirement: string,    // 必填，需求描述
  project_name?: string   // 可选，项目名称
}
```

#### 输出 Schema

```typescript
{
  success: boolean,
  project_id: string,
  project_name: string,
  summary: {
    total_tasks: number,
    total_estimate: string
  },
  files: {
    index_yaml: string,
    index_md: string,
    project_yaml: string,
    project_md: string
  },
  next_task: {
    id: string,
    title: string
  } | null
}
```

---

### 7.2 superplanners_status

**功能**：查看任务状态和整体进度

#### 输入 Schema

```typescript
{
  project_id?: string   // 可选，项目ID
}
```

#### 输出 Schema（全局视图）

```typescript
{
  success: boolean,
  total_projects: number,
  projects: Array<{
    id: string,
    name: string,
    status: "active" | "completed",
    progress: string,     // 如 "3/12"，实时计算
    updated: string       // ISO datetime
  }>
}
```

#### 输出 Schema（项目视图）

```typescript
{
  success: boolean,
  project: {
    id: string,
    name: string,
    description: string,
    updated: string
  },
  summary: TaskSummary,           // 实时计算
  progress: {
    completed: number,
    total: number,
    percentage: number
  },
  current_task: {
    id: string,
    title: string
  } | null,
  tasks: Task[]
}
```

---

### 7.3 superplanners_update

**功能**：更新任务状态

#### 输入 Schema

```typescript
{
  project_id: string,     // 必填，项目ID
  task_id: string,        // 必填，任务ID
  status: TaskStatus,     // 必填，新状态
  notes?: string          // 可选，备注
}
```

#### 输出 Schema

```typescript
{
  success: boolean,
  updated: {
    task_id: string,
    status: string,
    notes?: string
  },
  summary: TaskSummary,           // 实时计算
  progress: {
    completed: number,
    total: number,
    percentage: number
  },
  next_task: {
    id: string,
    title: string
  } | null
}
```

---

### 7.4 superplanners_reset

**功能**：归档与恢复

#### 输入 Schema

```typescript
{
  action: "cleanup" | "list" | "restore",   // 必填
  project_id?: string,                       // cleanup 时可选
  archive_id?: string                        // restore 时必填
}
```

#### 输出 Schema（cleanup）

```typescript
{
  success: boolean,
  action: "cleanup",
  archived_count: number,
  archived: string[]      // archive_id 列表
}
```

#### 输出 Schema（list）

```typescript
{
  success: boolean,
  action: "list",
  total: number,
  archives: Array<{
    archive_id: string,
    project_id: string,
    archived_at: string
  }>
}
```

#### 输出 Schema（restore）

```typescript
{
  success: boolean,
  action: "restore",
  restored_project_id: string,
  from_archive: string
}
```

---

## 8. 文件结构

### 8.1 项目目录结构

```
superplanners/
├── .claude-plugin/
│   └── plugin.json           # 插件配置
├── commands/
│   ├── plan.md               # /superplanners:plan 命令
│   ├── status.md             # /superplanners:status 命令
│   └── reset.md              # /superplanners:reset 命令
├── mcp-server/
│   ├── package.json          # NPM 包配置
│   ├── tsconfig.json         # TypeScript 配置
│   ├── README.md             # MCP Server 说明
│   └── src/
│       ├── index.ts          # 入口文件
│       ├── server.ts         # MCP Server 实现
│       ├── types.ts          # 类型定义
│       ├── task-engine/      # Task Engine 模块
│       │   ├── parser.ts
│       │   ├── status-reducer.ts
│       │   ├── dependency-resolver.ts
│       │   ├── progress-calculator.ts
│       │   └── next-task-selector.ts
│       ├── file-manager.ts   # 文件管理
│       └── renderer.ts       # Markdown 渲染
├── README.md                 # 总说明文档
└── LICENSE                   # 许可证
```

---

### 8.2 任务数据目录结构

```
tasks/
├── task-plan.yaml            # 主索引（机器可读）
├── task-plan.md              # 主索引（人类可读，自动生成）
├── user-login/
│   ├── tasks.yaml            # 项目任务（机器可读）
│   └── tasks.md              # 项目任务（人类可读，自动生成）
├── api-design/
│   ├── tasks.yaml
│   └── tasks.md
└── .archive/                 # 归档目录（不可变）
    ├── 2025-01-23-183500-old-project/
    │   ├── tasks.yaml
    │   └── tasks.md
    └── ...
```

---

### 8.3 关键文件规则

| 文件 | 读写权限 | 说明 |
|------|----------|------|
| `tasks.yaml` | 可读可写 | 唯一可写的数据文件 |
| `tasks.md` | 只读 | 自动生成，禁止手工编辑 |
| `.archive/` | 只读 | 完整快照，不可变 |

---

### 8.4 task-plan.yaml 格式

```yaml
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

  - project_id: api-design
    project: API设计
    status: completed
    updated: "2025-01-22T15:00:00Z"
    path: api-design/tasks.yaml
```

> 注意：`progress` 字段不再存储，由 Task Engine 实时计算。

---

## 9. 安装部署

### 9.1 用户安装流程

#### 方式一：从 npm 安装（推荐）

```bash
# 步骤 1：安装 Plugin（在 Claude Code 中执行）
/plugin install github:Shameless521/Superplanners

# 步骤 2：配置 MCP（编辑 ~/.claude/settings.json）
{
  "mcpServers": {
    "superplanners": {
      "command": "npx",
      "args": ["superplanners-mcp"]
    }
  }
}

# 步骤 3：重启 Claude Code
```

#### 方式二：本地安装

```bash
# 步骤 1：克隆仓库
git clone https://github.com/Shameless521/Superplanners.git

# 步骤 2：安装 MCP Server
cd superplanners/mcp-server
npm install
npm run build

# 步骤 3：复制 Plugin 到 Claude Code 目录
cp -r ../superplanners ~/.claude/plugins/

# 步骤 4：配置 MCP（编辑 ~/.claude/settings.json）
{
  "mcpServers": {
    "superplanners": {
      "command": "node",
      "args": ["/path/to/superplanners/mcp-server/dist/index.js"]
    }
  }
}

# 步骤 5：重启 Claude Code
```

---

### 9.2 验证安装

```bash
# 检查 Plugin 是否加载
/help
# 应该看到 /superplanners:plan, /superplanners:status, /superplanners:reset

# 测试创建任务
/superplanners:plan 测试项目

# 检查文件生成
ls tasks/
```

---

## 10. 使用指南

### 10.1 典型工作流

#### 创建任务计划

```
/superplanners:plan 开发用户登录功能，包括前后端
```

#### 查看任务状态

```
/superplanners:status user-login
```

#### 执行任务并更新状态

```
任务 1.1 完成了
开始做 1.2
1.2 也完成了
```

#### 项目完成后归档

```
/superplanners:reset cleanup user-login
```

---

### 10.2 引用上文创建任务

当对话中已有需求描述或方案时，可以直接引用：

```
用户：我想做一个博客系统，需要有文章管理、评论功能、用户系统...
（详细的需求讨论）

用户：/superplanners:plan 根据上述需求分解任务
```

---

### 10.3 处理阻塞任务

```
用户：2.4 阻塞了，等待设计稿

Claude：已将任务 2.4 标记为阻塞，备注"等待设计稿"。
当前进度：5/12 (41%)
建议先处理其他无依赖的任务，如 3.1。
```

---

### 10.4 恢复归档项目

```bash
# 查看归档列表
/superplanners:reset list

# 恢复指定项目
/superplanners:reset restore 2025-01-23-183500-user-login
```

---

## 11. 技术选型

### 11.1 MCP Server 技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript | MCP 生态主流，类型安全，SDK 支持好 |
| 运行时 | Node.js | npx 一键运行，无需用户安装依赖 |
| MCP SDK | @modelcontextprotocol/sdk | 官方 SDK，功能完整 |
| 数据格式 | YAML + Markdown | YAML 机器友好，MD 人类可读 |
| 包管理 | npm | 生态成熟，发布便捷 |

---

### 11.2 为什么选择 TypeScript 而非 Python

- **安装便捷**：用户只需 `npx superplanners-mcp`，无需手动创建虚拟环境
- **生态主流**：官方 MCP 服务大多是 TypeScript 实现
- **类型安全**：静态类型检查减少运行时错误
- **跨平台**：Node.js 在 Windows/macOS/Linux 行为一致

---

### 11.3 依赖清单

#### 运行时依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| @modelcontextprotocol/sdk | ^1.0.0 | MCP 协议实现 |
| yaml | ^2.3.0 | YAML 解析和生成 |
| zod | ^3.22.0 | 输入验证 |

#### 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.3.0 | TypeScript 编译 |
| @types/node | ^20.0.0 | Node.js 类型定义 |
| tsx | ^4.0.0 | 开发时直接运行 TS |

---

## 12. 版本演进策略

### v1.x（当前规划）

- 单用户
- 本地文件系统
- 串行任务执行

### v2.x（展望）

- 任务模板（常用项目类型的预设任务结构）
- Mermaid 可视化（任务依赖图表）
- 多人协作（任务分配 assign、评论 comment）
- 外部系统同步（Jira、Notion 等）

---

## 13. 项目交付物

### 13.1 交付物清单

| 交付物 | 格式 | 说明 |
|--------|------|------|
| 源代码仓库 | GitHub | 完整的项目源码 |
| npm 包 | superplanners-mcp | 发布到 npm registry |
| Plugin 包 | superplanners/ | Claude Code 插件目录 |
| 需求文档 | PRD.md | 本文档 |
| 使用文档 | README.md | 安装和使用说明 |

---

### 13.2 发布计划

| 阶段 | 内容 |
|------|------|
| 阶段 1 | 完成 TypeScript MCP Server 开发 |
| 阶段 2 | 完成 Plugin 命令定义 |
| 阶段 3 | 集成测试和文档完善 |
| 阶段 4 | 发布到 npm 和 GitHub |

---

## 附录

### A. 修订历史

| 版本 | 日期 | 作者 | 修改内容 |
|------|------|------|----------|
| 1.0.0 | 2025-01-23 | Claude | 初始版本 |
| 1.1.0 | 2026-01-24 | Shameless | 工程化修订：SSOT、Task Engine、原子事务 |
| 2.0.0 | 2026-01-24 | Claude | 合并 v1.0 和 v1.1，形成完整版 |

---

### B. 参考资料

- MCP 官方文档: https://modelcontextprotocol.io
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Claude Code 文档: https://docs.anthropic.com

---

## 总结

SuperPlanners 不是一个简单的任务列表工具，而是：

> **一个为 AI 工程协作而生的「任务状态机与执行引擎」。**

它的长期价值在于：
- **可推演**：任务状态可预测、可追溯
- **可恢复**：中断后可从文件系统完整恢复
- **可扩展**：模块化设计支持功能扩展
- **可被 AI 严格执行**：确定性算法保证一致性
