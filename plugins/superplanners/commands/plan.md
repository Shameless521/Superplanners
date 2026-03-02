---
description: 根据需求创建结构化任务计划
argument-hint: "<requirement> [project_name]"
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

## 任务执行工作流（全自动状态更新）

创建计划后，按以下工作流执行任务，状态会**全自动**更新（无需调用任何 MCP 工具）：

### 开始任务时
在输出中包含：`[TASK_STARTED: {project_id}/{task_id}]`

### 完成任务时
在输出中包含：`[TASK_COMPLETED: {project_id}/{task_id}]`

### 示例
```
现在开始实现第一个任务 [TASK_STARTED: my-project/1]

... 执行任务 ...

任务完成，代码已通过测试 [TASK_COMPLETED: my-project/1]
```

Stop Hook 会在每轮回复结束时自动检测标记并通过 CLI 更新 tasks.yaml 和 tasks.md 文件。
