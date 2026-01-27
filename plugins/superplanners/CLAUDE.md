# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

SuperPlanners 是一个面向 Claude Code / MCP 环境的智能任务分解与状态管理系统。核心定位是「文件驱动的任务状态机系统」。

**当前状态**：规划阶段，PRD 完成，代码实现待启动。

## 核心架构

```
Claude Code
   ↓ /superplanners:xxx
Plugin（命令入口）
   ↓
MCP Server
   ├─ Task Engine（核心领域层）
   │    ├─ Task Graph Parser
   │    ├─ Status Reducer
   │    ├─ Dependency Resolver
   │    ├─ Progress Calculator
   │    └─ Next Task Selector
   ├─ File Manager（IO 层）
   └─ Markdown Renderer（纯派生）
   ↓
File System（YAML Only）
```

## 核心设计原则

1. **单一真实数据源（SSOT）**：YAML 是唯一真实状态，Markdown 只是派生渲染视图，禁止手工编辑
2. **原子事务原则**：读取 YAML → 状态变更 → 校验 → 原子写回 → 重新渲染
3. **无状态服务原则**：MCP Server 不保存内存态业务状态，文件系统即最终事实

## 任务层级结构

Epic → Feature → Task → Subtask

**Task 状态枚举**：pending | in_progress | completed | blocked | skipped

## Next Task 推荐算法

1. `status == pending`
2. 所有 `dependencies` 均为 `completed`
3. 按 `priority`：critical → high → medium → low
4. 按 `estimate`：短 → 长

## 文件约定

- `tasks.yaml`：唯一可写的数据文件
- `tasks.md`：自动生成的只读视图
- `.archive/`：完整快照目录，不可变

## Plugin 命令（计划中）

```
/superplanners:plan              # 生成任务计划
/superplanners:status            # 显示状态和进度
/superplanners:update [意图]      # 自然语言状态更新
/superplanners:next              # 获取下一个推荐任务
```

## 任务状态更新规则（强制）

当使用 SuperPlanners 管理任务时，**必须**遵循以下规则以确保任务状态实时同步：

### 核心规则：直接调用 MCP 工具

**每当任务状态发生变化时，必须立即调用 `superplanners_update` MCP 工具**。这是唯一可靠的状态更新方式。

```
# 工具调用格式
superplanners_update(
  project_id: "项目ID",
  task_id: "任务ID",
  status: "in_progress" | "completed" | "blocked" | "skipped",
  notes: "可选备注"
)
```

### 状态变更时机

| 时机 | 状态值 | 必须动作 |
|------|--------|---------|
| 开始执行任务 | `in_progress` | 立即调用 `superplanners_update` |
| 任务完成 | `completed` | 立即调用 `superplanners_update` |
| 遇到阻塞 | `blocked` | 立即调用 `superplanners_update` |
| 跳过任务 | `skipped` | 立即调用 `superplanners_update` |

### 工作流程示例

```
1. 查看任务：调用 superplanners_status 获取当前任务
2. 开始任务：立即调用 superplanners_update(status="in_progress")
3. 执行任务：实际开发工作...
4. 完成任务：立即调用 superplanners_update(status="completed")
5. 继续下一个任务：重复步骤 2-4
```

### 重要说明

1. **必须主动调用工具**：不要依赖任何自动机制，每次状态变化都要显式调用 `superplanners_update`
2. **立即调用**：状态变化后第一时间调用，不要等到多个任务完成后批量更新
3. **文本标记（可选）**：可以在输出中添加 `[TASK_COMPLETED: project/task]` 等标记作为日志，但这**不会自动更新状态**，仅作为可读性辅助
4. **兜底机制**：Stop hook 会在对话结束时检测未处理的标记并提醒，但这是最后的兜底，不应依赖

## 参考文档

- PRD 文档：`super_planners_prd_v_1.md`
