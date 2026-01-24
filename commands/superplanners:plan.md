---
name: superplanners:plan
description: 根据需求创建结构化任务计划
arguments:
  - name: requirement
    description: 需求描述
    required: true
  - name: project_name
    description: 项目名称（可选）
    required: false
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
