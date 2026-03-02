---
description: 根据需求创建结构化任务计划
argument-hint: "<requirement> [project_name]"
---

# SuperPlanners - 智能任务分解

根据用户需求，智能分解为细颗粒度的原子任务，并创建结构化任务计划。

## 第一步：需求分析

深入理解需求 `{{{requirement}}}`：

1. **明确目标**：这个需求要解决什么问题？最终交付物是什么？
2. **确定范围**：包含哪些功能点？有哪些边界和约束？
3. **识别风险**：有哪些技术难点或不确定性？

## 第二步：代码扫描（如在项目中）

如果当前在一个代码项目中，快速扫描相关代码结构：

- 现有哪些模块/文件与需求相关？
- 需要新增还是修改已有代码？
- 有哪些可复用的工具/函数？

## 第三步：原子任务分解

将需求分解为**原子任务**，遵循以下标准：

### 原子化标准

| 维度 | 要求 |
|------|------|
| **工时** | 每个任务 0.5-4 小时可完成 |
| **职责** | 单一职责，一个任务只做一件事 |
| **验收** | 有明确的验收标准（写在 description 中） |
| **依赖** | 依赖关系清晰，无循环依赖 |
| **可测** | 任务完成后可独立验证 |

### 任务字段说明

每个任务必须包含：

- `id`：层级编号（如 `"1"`, `"1.1"`, `"2"`）
- `title`：简洁的任务标题（动词开头）
- `description`：详细描述 + 验收标准
- `priority`：`critical` / `high` / `medium` / `low`
- `estimate`：预估工时（如 `"1h"`, `"2h"`, `"0.5h"`）
- `dependencies`：依赖的任务 ID 列表

### 分解示例

```
需求：「给用户列表页添加搜索功能」

任务分解：
1. id:"1", title:"添加搜索输入框组件", estimate:"1h", dependencies:[]
2. id:"2", title:"实现搜索 API 接口", estimate:"2h", dependencies:[]
3. id:"3", title:"连接搜索框与 API", estimate:"1h", dependencies:["1","2"]
4. id:"4", title:"添加搜索结果空状态提示", estimate:"0.5h", dependencies:["3"]
5. id:"5", title:"编写搜索功能测试", estimate:"1.5h", dependencies:["3"]
```

## 第四步：调用 MCP 工具创建计划

分析完成后，将分解结果传入 `superplanners_plan` MCP Tool：

```
参数:
- requirement: {{{requirement}}}
- project_name: {{{project_name}}}（可选）
- tasks: [分解后的任务数组]
```

**重要**：`tasks` 参数必须包含完整的任务列表，每个任务的 `status` 由系统自动设为 `pending`，无需手动指定。

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

Stop Hook 会在每轮回复结束时自动检测标记并更新任务状态。
