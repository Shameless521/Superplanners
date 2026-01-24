# SuperPlanners

智能任务分解与管理系统

**产品需求文档（PRD）**

- 版本：**1.1.0**  
- 日期：**2026-01-24**  
- 作者：Shameless（在原 v1.0.0 基础上的工程化修订）

---

## 修订说明（v1.1 的设计目标）

本次修订并非功能扩展，而是**工程与系统设计层面的“最佳实践强化”**，核心目标是：

> **将 SuperPlanners 明确定义为一个「文件驱动的任务状态机系统」**，
> 而不是一个普通的 Todo / Task 工具。

### 本次修订重点

1. 明确 **YAML 是唯一真实数据源（Single Source of Truth）**
2. Markdown 统一定义为 **派生渲染产物，不可手工编辑**
3. 引入 **Task Engine（任务引擎）** 作为 MCP Server 的核心领域模块
4. 强化「自然语言更新」的 **安全性与可确认性**
5. 去除或弱化所有可计算、易产生不一致的冗余字段

---

## 1. 项目概述

### 1.1 背景与目标

SuperPlanners 是一个**面向 Claude Code / MCP 环境的智能任务分解与状态管理系统**。

它的核心使命是：

> **让一次性 AI 对话，升级为可中断、可恢复、可持续推进的工程协作流程。**

### 1.2 核心价值（修订后）

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
- 希望让 AI 真正“跟着做项目”的个人或团队

---

## 2. 核心设计原则（v1.1 强化）

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

## 3. 系统架构（升级版）

### 3.1 总体架构

```
Claude Code
   │
   │ /superplanners:xxx
   ▼
Plugin（命令入口 / UX）
   │
   ▼
MCP Server
   │
   ├─ Task Engine（核心领域层）
   │    ├─ Task Graph Parser
   │    ├─ Status Reducer
   │    ├─ Dependency Resolver
   │    ├─ Progress Calculator
   │    └─ Next Task Selector
   │
   ├─ File Manager（IO 层）
   └─ Markdown Renderer（纯派生）
   │
   ▼
File System（YAML Only）
```

---

### 3.2 组件职责划分（明确边界）

| 组件 | 职责 |
|----|----|
| Plugin | 命令入口、参数收集、用户体验 |
| MCP Server | 业务编排、Tool 实现 |
| Task Engine | 所有任务状态与规则的唯一实现 |
| File Manager | 原子读写 YAML |
| Renderer | 从 YAML 生成 Markdown |

---

## 4. Task Engine（新增核心章节）

> Task Engine 是 SuperPlanners 的“心脏”，所有状态变化都必须经过它。

### 4.1 Task Engine 职责

- 解析任务层级结构（Epic → Feature → Task → Subtask）
- 执行状态变更（合法性校验）
- 自动处理依赖关系
- 计算任务摘要与进度
- 选择下一个推荐任务

---

### 4.2 推荐 Next Task 规则（确定性算法）

当需要推荐下一个任务时，按以下顺序筛选：

1. `status == pending`
2. 所有 `dependencies` 均为 `completed`
3. 按 `priority`：critical → high → medium → low
4. 按 `estimate`：短 → 长

若无可执行任务，返回 `null` 并给出原因说明。

---

## 5. 功能需求（修订要点）

### 5.1 /superplanners:plan

#### 行为约束（新增）

- 只生成 YAML 数据
- 所有 Markdown 文件必须由 Renderer 自动生成
- 禁止生成不可验证的任务描述

---

### 5.2 /superplanners:status

#### 输出原则（修订）

- `progress`、`summary`、`current_task` **不得存储在 YAML**
- 全部为 Task Engine 的实时计算结果

---

### 5.3 自然语言更新（安全增强）

#### 两阶段更新机制（推荐）

当用户输入存在歧义时：

1. MCP Server 返回 **更新意图解析结果**
2. Claude 向用户请求确认
3. 确认后才执行 `superplanners_update`

示例：

> “项目完成了”

Claude：
> 你是想：
> 1️⃣ 将所有未完成任务标记为 completed？
> 2️⃣ 只完成当前 Feature？

---

## 6. 数据模型（精简版）

### 6.1 Task 状态（不变）

- pending
- in_progress
- completed
- blocked
- skipped

---

### 6.2 Task YAML 结构（修订）

**原则：只存储不可推导信息**

```yaml
meta:
  project: 用户登录功能
  project_id: user-login
  created: 2025-01-23T10:00:00Z
  updated: 2025-01-23T10:30:00Z
  version: 1

tasks:
  - id: "1"
    title: 后端 API 开发
    status: in_progress
    priority: high
    estimate: "8h"
    dependencies: []
    subtasks:
      - id: "1.1"
        title: 设计接口规范
        status: completed
```

---

## 7. 文件结构（约束强化）

### 7.1 关键规则（新增）

- `tasks.yaml`：唯一可写文件
- `tasks.md`：自动生成，只读
- `.archive/`：完整快照，不可变

---

## 8. 版本演进策略

### v1.x
- 单用户
- 本地文件系统
- 串行任务执行

### v2.x（展望）
- 任务模板
- Mermaid 可视化
- 多人协作（assign / comment）
- 外部系统同步（Jira / Notion）

---

## 9. 总结（设计定位）

SuperPlanners 不是一个简单的任务列表工具，而是：

> **一个为 AI 工程协作而生的「任务状态机与执行引擎」。**

它的长期价值在于：
- 可推演
- 可恢复
- 可扩展
- 可被 AI 严格执行

---

（基于 v1.0.0 PRD 的工程化修订完成）

