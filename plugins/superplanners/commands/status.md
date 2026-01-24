---
description: 查看任务状态和进度
argument-hint: "[project_id]"
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

## 继续执行任务

查看状态后，如需继续执行任务，请记住使用状态标记：

- 开始任务：`[TASK_STARTED: {project_id}/{task_id}]`
- 完成任务：`[TASK_COMPLETED: {project_id}/{task_id}]`

系统会自动更新任务状态。
