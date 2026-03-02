# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

SuperPlanners 是一个面向 Claude Code / MCP 环境的智能任务分解与状态管理系统。核心定位是「文件驱动的任务状态机系统」。

**当前状态**：v0.6.0 已发布，支持全自动任务状态更新。

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

## Plugin 命令

```
/superplanners:plan              # 生成任务计划
/superplanners:status            # 显示状态和进度
/superplanners:reset             # 归档清理或恢复历史任务
```

## 任务状态更新规则（全自动）

当使用 SuperPlanners 管理任务时，**只需在输出中包含状态标记**，Stop Hook 会全自动完成状态更新。

### 标记格式

| 时机 | 标记 | 自动转换为 |
|------|------|-----------|
| 开始执行任务 | `[TASK_STARTED: {project_id}/{task_id}]` | `in_progress` |
| 任务完成 | `[TASK_COMPLETED: {project_id}/{task_id}]` | `completed` |
| 遇到阻塞 | `[TASK_BLOCKED: {project_id}/{task_id}]` | `blocked` |
| 跳过任务 | `[TASK_SKIPPED: {project_id}/{task_id}]` | `skipped` |

### 工作流程示例

```
1. 查看任务：调用 superplanners_status 获取当前任务
2. 开始任务：在输出中包含 [TASK_STARTED: project-id/1]
3. 执行任务：实际开发工作...
4. 完成任务：在输出中包含 [TASK_COMPLETED: project-id/1]
5. 继续下一个任务：重复步骤 2-4
```

### 重要说明

1. **完全自动化**：只需在输出中包含标记，状态更新会在每轮回复结束时由 Stop Hook 自动完成
2. **立即标记**：状态变化后第一时间输出标记
3. **去重处理**：同一任务的多个标记（如 STARTED 后跟 COMPLETED），系统会自动保留最终状态
4. **降级机制**：如果自动更新失败，系统会提示手动调用 `superplanners_update` MCP 工具
5. **手动仍可用**：`superplanners_update` MCP 工具仍然保留，但通常不需要手动调用

## 参考文档

- PRD 文档：`super_planners_prd_v_1.md`
