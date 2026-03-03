# SuperPlanners

> Intelligent task decomposition and management system for Claude Code / MCP environments.
>
> 智能任务分解与管理系统，为 Claude Code / MCP 环境设计。

[![npm version](https://badge.fury.io/js/superplanners-mcp.svg)](https://www.npmjs.com/package/superplanners-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](#features) | [中文](#特性)

---

## Features

- **Smart Task Decomposition**: Automatically break down complex requirements into atomic tasks with priorities and dependencies
- **Custom Task Input** (v0.7.0): Pass your own task breakdown via `tasks` parameter in `superplanners_plan`
- **Auto Status Update** (v0.6.0): Fully automatic task status tracking via Stop Hook — just include markers like `[TASK_COMPLETED: project/1]` in output
- **Skill Assistant** (v0.9.0): One-stop Skill management — diagnose, generate, and optimize Claude Code Skills for your project
- **Status Tracking**: Support for pending / in_progress / completed / blocked / skipped states
- **Dependency Management**: Automatic cycle detection and intelligent next-task recommendations
- **Progress Visualization**: Real-time progress calculation with Markdown reports
- **MCP Integration**: Seamless Claude Code integration via MCP Tools

## Prerequisites

- Node.js >= 18
- Python 3 (required for auto status update hook)

## Installation

### Option 1: Via Plugin Marketplace (Recommended)

```bash
# Step 1: Install MCP Server globally
npm install -g superplanners-mcp

# Step 2: Add Marketplace in Claude Code
/plugin marketplace add Shameless521/Superplanners

# Step 3: Install Plugin
/plugin install superplanners
```

### Option 2: Direct Plugin Install

```bash
/plugin install Shameless521/Superplanners
```

### Option 3: Manual MCP Configuration

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

## Usage

### 1. Create Task Plan

```
/superplanners:plan Create a TODO app with CRUD operations
```

Claude will automatically:
1. Analyze requirements
2. Generate task breakdown (Epic/Feature/Task)
3. Create `tasks/<project>/tasks.yaml`
4. Render `tasks/<project>/tasks.md`

### 2. View Status

```
/superplanners:status
```

View all projects:
```
📋 SuperPlanners Project List
| Project | Progress | Status |
|---------|----------|--------|
| todo-app | 30% | In Progress |
```

View specific project:
```
/superplanners:status todo-app
```

### 3. Update Tasks

**Direct MCP Tool Call (v0.5.0)**

Claude will automatically call `superplanners_update` MCP tool when task status changes:

```
1. Start task: Call superplanners_update(status="in_progress")
2. Execute task: Do the actual work...
3. Complete task: Call superplanners_update(status="completed")
```

| Status | Description |
|--------|-------------|
| `in_progress` | Task started |
| `completed` | Task completed |
| `blocked` | Task blocked |
| `skipped` | Task skipped |

**Manual Update Command**

```
/superplanners:update todo-app T1.1.1 completed
```

### 4. Skill Assistant (v0.9.0)

```
/superplanners:skill-helper
```

One command to:
1. Scan project structure, tech stack, and existing Skills
2. Run full diagnosis (quality audit + coverage analysis + freshness check)
3. Generate action plan (optimize existing + create missing Skills)
4. Execute after user confirmation
5. Post-execution review

```
/superplanners:skill-helper my-skill    # Focus on a specific Skill only
```

### 5. Archive & Restore

```
/superplanners:reset cleanup todo-app  # Archive project
/superplanners:reset list              # List archives
/superplanners:reset restore <id>      # Restore archive
```

## Task Status

| Status | Icon | Description |
|--------|------|-------------|
| pending | ⏸️ | Not started |
| in_progress | 🔄 | In progress |
| completed | ✅ | Completed |
| blocked | 🚫 | Blocked |
| skipped | ⏭️ | Skipped |

## Priority Levels

| Priority | Weight | Description |
|----------|--------|-------------|
| critical | 4 | Critical |
| high | 3 | High |
| medium | 2 | Medium |
| low | 1 | Low |

## MCP Tools

| Tool | Description |
|------|-------------|
| `superplanners_plan` | Create task plan |
| `superplanners_status` | Query project/task status |
| `superplanners_update` | Update task status |
| `superplanners_reset` | Archive/restore/cleanup |

## Development

```bash
# Install dependencies
cd mcp-server && npm install

# Run tests
npm test

# Build
npm run build

# Run locally
npm start
```

## Design Principles

- **SSOT**: YAML is the single source of truth, Markdown is derived view
- **Atomic Transactions**: Read → Modify → Validate → Write → Render, rollback on any failure
- **Stateless Service**: MCP Server holds no business state, all state stored in filesystem

---

# 中文文档

## 特性

- **智能任务分解**: 将复杂需求自动拆解为原子任务，支持优先级和依赖关系
- **自定义任务输入** (v0.7.0): 通过 `superplanners_plan` 的 `tasks` 参数传入自定义任务分解
- **全自动状态更新** (v0.6.0): 通过 Stop Hook 全自动追踪任务状态，只需在输出中包含 `[TASK_COMPLETED: project/1]` 等标记
- **Skill 助手** (v0.9.0): 一站式 Skill 管理——为项目诊断、生成和优化符合官方规范的 Claude Code Skills
- **状态追踪**: 支持 pending / in_progress / completed / blocked / skipped 五种状态
- **依赖管理**: 自动检测循环依赖，智能推荐下一个可执行任务
- **进度可视化**: 实时计算进度百分比，生成 Markdown 格式的进度报告
- **MCP 集成**: 无缝集成 Claude Code，通过 MCP Tools 进行交互

## 系统要求

- Node.js >= 18
- Python 3（全自动状态更新 Hook 需要）

## 安装

### 方式一：通过 Plugin Marketplace（推荐）

```bash
# 步骤 1: 全局安装 MCP Server
npm install -g superplanners-mcp

# 步骤 2: 在 Claude Code 中添加 Marketplace
/plugin marketplace add Shameless521/Superplanners

# 步骤 3: 安装 Plugin
/plugin install superplanners
```

### 方式二：直接安装 Plugin

```bash
/plugin install Shameless521/Superplanners
```

### 方式三：手动配置 MCP

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

## 使用指南

### 1. 创建任务计划

```
/superplanners:plan 创建一个 TODO 应用，支持增删改查
```

Claude 会自动：
1. 分析需求
2. 生成任务分解（Epic/Feature/Task）
3. 创建 `tasks/<项目名>/tasks.yaml`
4. 渲染 `tasks/<项目名>/tasks.md`

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

**直接调用 MCP 工具 (v0.5.0)**

Claude 会在任务状态变化时自动调用 `superplanners_update` MCP 工具：

```
1. 开始任务: 调用 superplanners_update(status="in_progress")
2. 执行任务: 实际开发工作...
3. 完成任务: 调用 superplanners_update(status="completed")
```

| 状态 | 说明 |
|------|------|
| `in_progress` | 任务开始 |
| `completed` | 任务完成 |
| `blocked` | 任务阻塞 |
| `skipped` | 任务跳过 |

**手动更新命令**

```
/superplanners:update todo-app T1.1.1 completed
```

### 4. Skill 助手 (v0.9.0)

```
/superplanners:skill-helper
```

一条命令完成：
1. 扫描项目结构、技术栈和已有 Skill
2. 全面诊断（质量审计 + 覆盖率分析 + 时效性检查）
3. 生成行动计划（优化已有 + 补充缺失的 Skill）
4. 用户确认后执行
5. 执行后复审验证

```
/superplanners:skill-helper my-skill    # 只针对指定 Skill
```

### 5. 归档与恢复

```
/superplanners:reset cleanup todo-app  # 归档项目
/superplanners:reset list              # 查看归档列表
/superplanners:reset restore <id>      # 恢复归档
```

## 数据结构示例

```yaml
meta:
  id: todo-app
  name: TODO App
  created: "2024-01-01T00:00:00Z"
  updated: "2024-01-01T12:00:00Z"

epics:
  - id: E1
    title: Core Features
    features:
      - id: F1.1
        title: Task CRUD
        tasks:
          - id: T1.1.1
            title: Implement add task
            status: completed
            priority: high
            estimate: 2h
          - id: T1.1.2
            title: Implement delete task
            status: pending
            priority: high
            estimate: 1h
            depends_on: [T1.1.1]
```

## License

MIT
