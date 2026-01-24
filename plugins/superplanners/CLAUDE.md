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

## 任务状态自动更新规则（强制）

当使用 SuperPlanners 管理任务时，**必须**遵循以下规则以确保任务状态自动同步：

### 标记格式

| 场景 | 标记格式 | 触发状态 |
|------|---------|---------|
| 开始任务 | `[TASK_STARTED: {project_id}/{task_id}]` | in_progress |
| 完成任务 | `[TASK_COMPLETED: {project_id}/{task_id}]` | completed |
| 任务阻塞 | `[TASK_BLOCKED: {project_id}/{task_id}]` | blocked |
| 跳过任务 | `[TASK_SKIPPED: {project_id}/{task_id}]` | skipped |

### 使用示例

```
开始实现登录功能 [TASK_STARTED: todo-app/T1.1.1]

... 执行任务中 ...

登录功能已完成，测试通过 [TASK_COMPLETED: todo-app/T1.1.1]
```

### 重要说明

1. **标记必须完整**：包含 project_id 和 task_id，用 `/` 分隔
2. **每个任务都要标记**：开始时标记 STARTED，结束时标记 COMPLETED/BLOCKED/SKIPPED
3. **Hook 自动处理**：输出标记后，系统会自动调用 `superplanners_update` 更新状态
4. **兜底机制**：如果标记未生效，也可以直接调用 `superplanners_update` MCP 工具

## 参考文档

- PRD 文档：`super_planners_prd_v_1.md`
