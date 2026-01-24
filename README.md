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
