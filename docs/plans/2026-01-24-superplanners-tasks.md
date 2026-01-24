# SuperPlanners 任务分解

基于 PRD v2.0.0 的原子任务拆分

---

## 任务概览

| Epic | Feature 数 | Task 数 | 预估总时长 |
|------|-----------|---------|-----------|
| E1: 基础设施 | 2 | 6 | 4h |
| E2: 核心类型 | 1 | 4 | 3h |
| E3: Task Engine | 5 | 12 | 16h |
| E4: IO 层 | 2 | 6 | 6h |
| E5: MCP Server | 2 | 8 | 10h |
| E6: Plugin | 2 | 5 | 4h |
| E7: 测试 | 3 | 9 | 8h |
| E8: 文档与发布 | 2 | 5 | 4h |
| **总计** | **19** | **55** | **55h** |

---

## E1: 基础设施搭建

### F1.1: 项目结构初始化

#### T1.1.1: 创建项目目录结构
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: 无
- **验收标准**:
  - 创建 `mcp-server/src/` 目录
  - 创建 `mcp-server/src/task-engine/` 目录
  - 创建 `commands/` 目录
  - 创建 `.claude-plugin/` 目录

#### T1.1.2: 配置 package.json
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: T1.1.1
- **验收标准**:
  - 包名: `superplanners-mcp`
  - 配置 scripts: `dev`, `build`, `test`
  - 添加运行时依赖: `@modelcontextprotocol/sdk`, `yaml`, `zod`
  - 添加开发依赖: `typescript`, `@types/node`, `tsx`, `vitest`

#### T1.1.3: 配置 tsconfig.json
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: T1.1.2
- **验收标准**:
  - target: ES2022
  - module: NodeNext
  - strict: true
  - outDir: ./dist

### F1.2: 开发环境配置

#### T1.2.1: 配置 ESLint
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T1.1.3
- **验收标准**:
  - 安装 `@typescript-eslint/parser`
  - 配置 TypeScript 规则

#### T1.2.2: 配置 Vitest 测试框架
- **预估**: 0.5h
- **优先级**: high
- **依赖**: T1.1.3
- **验收标准**:
  - 创建 `vitest.config.ts`
  - 配置测试文件匹配规则 `**/*.test.ts`

#### T1.2.3: 创建 .gitignore
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T1.1.1
- **验收标准**:
  - 忽略 `node_modules/`, `dist/`, `.env`

---

## E2: 核心类型定义

### F2.1: TypeScript 类型定义

#### T2.1.1: 定义任务状态和优先级枚举
- **文件**: `mcp-server/src/types.ts`
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: T1.1.3
- **验收标准**:
  ```typescript
  type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped'
  type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
  ```

#### T2.1.2: 定义 Task 和 SubTask 接口
- **文件**: `mcp-server/src/types.ts`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T2.1.1
- **验收标准**:
  - Task 接口包含: id, title, description?, status, priority, estimate?, actual?, dependencies?, subtasks?, notes?, started_at?, completed_at?
  - SubTask 接口包含: id, title, status, notes?

#### T2.1.3: 定义 ProjectMeta 和 TaskSummary 接口
- **文件**: `mcp-server/src/types.ts`
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: T2.1.1
- **验收标准**:
  - ProjectMeta: project, project_id, created, updated, version, description?
  - TaskSummary: total, completed, in_progress, blocked, pending, skipped

#### T2.1.4: 定义 MCP Tool 输入/输出 Schema（Zod）
- **文件**: `mcp-server/src/types.ts`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T2.1.2, T2.1.3
- **验收标准**:
  - 使用 Zod 定义 4 个 Tool 的输入 Schema
  - 使用 Zod 定义 4 个 Tool 的输出 Schema
  - 导出类型推断 `z.infer<>`

---

## E3: Task Engine 核心模块

### F3.1: Task Graph Parser

#### T3.1.1: 实现 YAML 解析为 Task Graph
- **文件**: `mcp-server/src/task-engine/parser.ts`
- **预估**: 2h
- **优先级**: critical
- **依赖**: T2.1.4
- **验收标准**:
  - 解析 tasks.yaml 为内存数据结构
  - 构建 Task 层级树（支持 subtasks）
  - 验证 YAML Schema 合法性

#### T3.1.2: 实现 Task ID 查找和遍历
- **文件**: `mcp-server/src/task-engine/parser.ts`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T3.1.1
- **验收标准**:
  - `findTaskById(id: string)` 支持查找 Task 和 SubTask
  - `traverseTasks(callback)` 深度遍历所有任务

### F3.2: Status Reducer

#### T3.2.1: 实现状态变更纯函数
- **文件**: `mcp-server/src/task-engine/status-reducer.ts`
- **预估**: 2h
- **优先级**: critical
- **依赖**: T3.1.2
- **验收标准**:
  - `updateTaskStatus(tasks, taskId, newStatus)` 返回新的 tasks 数组
  - 不修改原数组（immutable）
  - 自动更新 `started_at` 和 `completed_at` 时间戳

#### T3.2.2: 实现状态变更合法性校验
- **文件**: `mcp-server/src/task-engine/status-reducer.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.2.1
- **验收标准**:
  - 校验状态转换合法性（如 completed 不能变回 pending）
  - 返回校验错误信息

### F3.3: Dependency Resolver

#### T3.3.1: 实现依赖关系解析
- **文件**: `mcp-server/src/task-engine/dependency-resolver.ts`
- **预估**: 1.5h
- **优先级**: high
- **依赖**: T3.1.2
- **验收标准**:
  - 解析 `dependencies` 字段
  - 检测循环依赖并报错

#### T3.3.2: 实现依赖完成状态检查
- **文件**: `mcp-server/src/task-engine/dependency-resolver.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.3.1
- **验收标准**:
  - `areDependenciesMet(taskId)` 检查所有依赖是否 completed
  - 返回未完成的依赖列表

### F3.4: Progress Calculator

#### T3.4.1: 实现任务统计计算
- **文件**: `mcp-server/src/task-engine/progress-calculator.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.1.2
- **验收标准**:
  - 计算 TaskSummary（total, completed, in_progress 等）
  - 递归统计 subtasks

#### T3.4.2: 实现进度百分比计算
- **文件**: `mcp-server/src/task-engine/progress-calculator.ts`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T3.4.1
- **验收标准**:
  - 计算完成百分比
  - 返回 `{ completed, total, percentage }`

### F3.5: Next Task Selector

#### T3.5.1: 实现下一任务推荐算法
- **文件**: `mcp-server/src/task-engine/next-task-selector.ts`
- **预估**: 2h
- **优先级**: high
- **依赖**: T3.3.2, T3.4.1
- **验收标准**:
  - 筛选 `status == pending` 的任务
  - 筛选依赖已完成的任务
  - 按 priority 排序：critical → high → medium → low
  - 按 estimate 排序：短 → 长

#### T3.5.2: 实现无可执行任务的原因说明
- **文件**: `mcp-server/src/task-engine/next-task-selector.ts`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T3.5.1
- **验收标准**:
  - 当无可执行任务时返回 `null`
  - 附带原因说明（所有完成 / 存在阻塞 / 依赖未满足）

---

## E4: IO 层

### F4.1: File Manager

#### T4.1.1: 实现 YAML 文件读取
- **文件**: `mcp-server/src/file-manager.ts`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T2.1.4
- **验收标准**:
  - 读取 `task-plan.yaml` 和 `{project-id}/tasks.yaml`
  - 文件不存在时返回 null 或抛出明确错误

#### T4.1.2: 实现 YAML 原子写入
- **文件**: `mcp-server/src/file-manager.ts`
- **预估**: 1.5h
- **优先级**: critical
- **依赖**: T4.1.1
- **验收标准**:
  - 先写入临时文件，再原子 rename
  - 自动更新 `meta.updated` 时间戳
  - 失败时不破坏原文件

#### T4.1.3: 实现目录和项目管理
- **文件**: `mcp-server/src/file-manager.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T4.1.2
- **验收标准**:
  - 创建 `tasks/` 目录
  - 创建 `tasks/{project-id}/` 目录
  - 列出所有项目

#### T4.1.4: 实现归档功能
- **文件**: `mcp-server/src/file-manager.ts`
- **预估**: 1h
- **优先级**: medium
- **依赖**: T4.1.3
- **验收标准**:
  - 移动项目到 `.archive/{timestamp}-{project-id}/`
  - 列出归档列表
  - 从归档恢复项目

### F4.2: Markdown Renderer

#### T4.2.1: 实现 task-plan.md 渲染
- **文件**: `mcp-server/src/renderer.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T4.1.1
- **验收标准**:
  - 从 task-plan.yaml 生成项目列表 Markdown
  - 显示每个项目的进度（实时计算）

#### T4.2.2: 实现 tasks.md 渲染
- **文件**: `mcp-server/src/renderer.ts`
- **预估**: 1.5h
- **优先级**: high
- **依赖**: T4.2.1
- **验收标准**:
  - 从 tasks.yaml 生成任务列表 Markdown
  - 使用状态图标（⏸️🔄✅🚫⏭️）
  - 显示进度条和统计摘要

---

## E5: MCP Server

### F5.1: Server 基础架构

#### T5.1.1: 创建 MCP Server 入口
- **文件**: `mcp-server/src/index.ts`
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: T2.1.4
- **验收标准**:
  - 使用 `@modelcontextprotocol/sdk` 创建 Server
  - 配置 stdio 传输

#### T5.1.2: 实现 Tool 注册框架
- **文件**: `mcp-server/src/server.ts`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T5.1.1
- **验收标准**:
  - 注册 4 个 MCP Tools
  - 配置 Tool 的 name, description, inputSchema

### F5.2: MCP Tools 实现

#### T5.2.1: 实现 superplanners_plan Tool
- **文件**: `mcp-server/src/server.ts`
- **预估**: 2h
- **优先级**: critical
- **依赖**: T5.1.2, T4.1.2, T4.2.2
- **验收标准**:
  - 接收 requirement 和 project_name
  - 调用 Claude 进行任务分解（或使用模板）
  - 创建 YAML 文件
  - 自动渲染 Markdown
  - 返回 success, project_id, summary, files, next_task

#### T5.2.2: 实现 superplanners_status Tool
- **文件**: `mcp-server/src/server.ts`
- **预估**: 1.5h
- **优先级**: critical
- **依赖**: T5.1.2, T3.4.2, T3.5.1
- **验收标准**:
  - 无参数时返回全局视图（所有项目列表）
  - 有 project_id 时返回项目视图
  - summary 和 progress 实时计算

#### T5.2.3: 实现 superplanners_update Tool
- **文件**: `mcp-server/src/server.ts`
- **预估**: 2h
- **优先级**: critical
- **依赖**: T5.1.2, T3.2.2, T4.1.2
- **验收标准**:
  - 接收 project_id, task_id, status, notes
  - 校验状态变更合法性
  - 原子更新 YAML
  - 重新渲染 Markdown
  - 返回 updated, summary, progress, next_task

#### T5.2.4: 实现 superplanners_reset Tool
- **文件**: `mcp-server/src/server.ts`
- **预估**: 1.5h
- **优先级**: high
- **依赖**: T5.1.2, T4.1.4
- **验收标准**:
  - cleanup: 归档项目
  - list: 列出归档
  - restore: 恢复归档

#### T5.2.5: 实现错误处理和回滚
- **文件**: `mcp-server/src/server.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T5.2.1, T5.2.2, T5.2.3, T5.2.4
- **验收标准**:
  - 统一错误格式 `{ success: false, error: string }`
  - 写入失败时回滚
  - 记录错误日志

#### T5.2.6: 实现两阶段更新（意图解析）
- **文件**: `mcp-server/src/server.ts`
- **预估**: 1.5h
- **优先级**: medium
- **依赖**: T5.2.3
- **验收标准**:
  - 当输入存在歧义时返回意图解析结果
  - 提供 `confirm` 参数用于确认执行

---

## E6: Plugin

### F6.1: Plugin 配置

#### T6.1.1: 创建 plugin.json
- **文件**: `.claude-plugin/plugin.json`
- **预估**: 0.5h
- **优先级**: critical
- **依赖**: 无
- **验收标准**:
  - 配置 plugin name, description
  - 声明 commands 目录

### F6.2: Plugin Commands

#### T6.2.1: 创建 plan.md 命令
- **文件**: `commands/plan.md`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T6.1.1
- **验收标准**:
  - 定义 `/superplanners:plan` 命令
  - 参数: requirement (必填), project_name (可选)
  - 调用 `superplanners_plan` MCP Tool

#### T6.2.2: 创建 status.md 命令
- **文件**: `commands/status.md`
- **预估**: 1h
- **优先级**: critical
- **依赖**: T6.1.1
- **验收标准**:
  - 定义 `/superplanners:status` 命令
  - 参数: project_id (可选)
  - 调用 `superplanners_status` MCP Tool

#### T6.2.3: 创建 reset.md 命令
- **文件**: `commands/reset.md`
- **预估**: 1h
- **优先级**: high
- **依赖**: T6.1.1
- **验收标准**:
  - 定义 `/superplanners:reset` 命令
  - 子命令: cleanup, list, restore
  - 调用 `superplanners_reset` MCP Tool

#### T6.2.4: 配置自然语言更新识别
- **文件**: `commands/update.md` 或 hooks
- **预估**: 1h
- **优先级**: medium
- **依赖**: T6.2.1
- **验收标准**:
  - 识别 "任务 X 完成了" 等自然语言
  - 自动调用 `superplanners_update` Tool

---

## E7: 测试

### F7.1: Task Engine 单元测试

#### T7.1.1: Parser 单元测试
- **文件**: `mcp-server/src/task-engine/parser.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.1.2
- **验收标准**:
  - 测试 YAML 解析
  - 测试 Task ID 查找
  - 测试 Schema 校验失败场景

#### T7.1.2: Status Reducer 单元测试
- **文件**: `mcp-server/src/task-engine/status-reducer.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.2.2
- **验收标准**:
  - 测试状态变更
  - 测试 immutable 特性
  - 测试非法状态转换

#### T7.1.3: Dependency Resolver 单元测试
- **文件**: `mcp-server/src/task-engine/dependency-resolver.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.3.2
- **验收标准**:
  - 测试依赖解析
  - 测试循环依赖检测
  - 测试依赖完成检查

#### T7.1.4: Next Task Selector 单元测试
- **文件**: `mcp-server/src/task-engine/next-task-selector.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T3.5.2
- **验收标准**:
  - 测试推荐算法排序
  - 测试无可执行任务场景

### F7.2: File Manager 单元测试

#### T7.2.1: YAML 读写测试
- **文件**: `mcp-server/src/file-manager.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T4.1.2
- **验收标准**:
  - 测试文件读取
  - 测试原子写入
  - 测试文件不存在场景

#### T7.2.2: 归档功能测试
- **文件**: `mcp-server/src/file-manager.test.ts`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T4.1.4
- **验收标准**:
  - 测试归档
  - 测试恢复

### F7.3: MCP Tools 集成测试

#### T7.3.1: Plan Tool 集成测试
- **文件**: `mcp-server/src/server.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T5.2.1
- **验收标准**:
  - 测试完整的 plan 流程
  - 验证文件生成

#### T7.3.2: Status/Update/Reset 集成测试
- **文件**: `mcp-server/src/server.test.ts`
- **预估**: 1h
- **优先级**: high
- **依赖**: T5.2.5
- **验收标准**:
  - 测试状态查询
  - 测试状态更新
  - 测试归档恢复

#### T7.3.3: 错误处理测试
- **文件**: `mcp-server/src/server.test.ts`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T7.3.2
- **验收标准**:
  - 测试各种错误场景
  - 验证回滚机制

---

## E8: 文档与发布

### F8.1: 文档

#### T8.1.1: 编写 README.md
- **文件**: `README.md`
- **预估**: 1h
- **优先级**: high
- **依赖**: T6.2.3
- **验收标准**:
  - 项目介绍
  - 安装说明
  - 使用示例
  - API 文档链接

#### T8.1.2: 编写 MCP Server README
- **文件**: `mcp-server/README.md`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: T8.1.1
- **验收标准**:
  - MCP Tools 说明
  - 开发指南

#### T8.1.3: 创建 LICENSE
- **文件**: `LICENSE`
- **预估**: 0.5h
- **优先级**: medium
- **依赖**: 无
- **验收标准**:
  - 选择 MIT 或 Apache 2.0

### F8.2: 发布

#### T8.2.1: 配置 npm 发布
- **文件**: `mcp-server/package.json`
- **预估**: 0.5h
- **优先级**: high
- **依赖**: T7.3.3
- **验收标准**:
  - 配置 `files` 字段
  - 配置 `bin` 入口
  - 配置 `prepublishOnly` 脚本

#### T8.2.2: 发布到 npm 和 GitHub
- **预估**: 1h
- **优先级**: high
- **依赖**: T8.2.1, T8.1.1
- **验收标准**:
  - `npm publish` 成功
  - GitHub Release 创建
  - 验证 `npx superplanners-mcp` 可运行

---

## 任务依赖图（简化版）

```
E1: 基础设施
    └── E2: 核心类型
            └── E3: Task Engine
                    ├── E4: IO 层
                    │       └── E5: MCP Server
                    │               └── E6: Plugin
                    │                       └── E7: 测试
                    │                               └── E8: 文档与发布
                    └───────────────────────────────────┘
```

---

## 推荐执行顺序

### 第一批（基础）
1. T1.1.1 → T1.1.2 → T1.1.3
2. T2.1.1 → T2.1.2 → T2.1.3 → T2.1.4

### 第二批（Task Engine）
3. T3.1.1 → T3.1.2
4. T3.2.1 → T3.2.2
5. T3.3.1 → T3.3.2
6. T3.4.1 → T3.4.2
7. T3.5.1 → T3.5.2

### 第三批（IO）
8. T4.1.1 → T4.1.2 → T4.1.3 → T4.1.4
9. T4.2.1 → T4.2.2

### 第四批（Server + Plugin）
10. T5.1.1 → T5.1.2
11. T5.2.1 → T5.2.2 → T5.2.3 → T5.2.4 → T5.2.5 → T5.2.6
12. T6.1.1 → T6.2.1 → T6.2.2 → T6.2.3 → T6.2.4

### 第五批（测试 + 文档）
13. T7.1.1 → T7.1.2 → T7.1.3 → T7.1.4
14. T7.2.1 → T7.2.2
15. T7.3.1 → T7.3.2 → T7.3.3
16. T8.1.1 → T8.1.2 → T8.1.3
17. T8.2.1 → T8.2.2
