# SuperPlanners MCP Server

SuperPlanners 的 MCP (Model Context Protocol) 服务器实现。

## 开发指南

### 项目结构

```
mcp-server/
├── src/
│   ├── index.ts              # 入口文件
│   ├── server.ts             # MCP Tool 处理器
│   ├── types.ts              # TypeScript 类型定义
│   ├── file-manager.ts       # 文件读写
│   ├── renderer.ts           # Markdown 渲染
│   └── task-engine/          # 核心业务逻辑
│       ├── parser.ts         # YAML 解析
│       ├── status-reducer.ts # 状态变更
│       ├── dependency-resolver.ts  # 依赖解析
│       ├── progress-calculator.ts  # 进度计算
│       └── next-task-selector.ts   # 任务推荐
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（监听变更）
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 运行测试（带覆盖率）
npm test -- --coverage

# 类型检查
npm run typecheck

# 代码格式化
npm run lint
```

### MCP Tools 说明

#### superplanners_plan

创建新的任务计划。

**输入:**
```typescript
{
  requirement: string;      // 需求描述
  project_name?: string;    // 项目名称（可选）
}
```

**输出:**
```typescript
{
  success: boolean;
  project_id: string;
  summary: TaskSummary;
  files: string[];
  next_task: Task | null;
}
```

#### superplanners_status

查询项目或任务状态。

**输入:**
```typescript
{
  project_id?: string;      // 项目 ID（可选，不填返回全局视图）
}
```

**输出:**
```typescript
{
  success: boolean;
  projects?: ProjectSummary[];  // 全局视图
  project_id?: string;          // 项目视图
  progress?: Progress;
  summary?: TaskSummary;
  tasks?: Task[];
  next_task?: Task | null;
}
```

#### superplanners_update

更新任务状态。

**输入:**
```typescript
{
  project_id: string;
  task_id: string;
  status: TaskStatus;
  notes?: string;
}
```

**输出:**
```typescript
{
  success: boolean;
  updated: boolean;
  summary: TaskSummary;
  progress: Progress;
  next_task: Task | null;
}
```

#### superplanners_reset

归档、列出或恢复项目。

**输入:**
```typescript
{
  action: 'cleanup' | 'list' | 'restore';
  project_id?: string;    // cleanup 时必填
  archive_id?: string;    // restore 时必填
}
```

### 添加新功能

1. 在 `types.ts` 中定义类型
2. 在对应模块中实现逻辑
3. 编写测试
4. 在 `server.ts` 中注册 Tool（如需要）

### 调试

使用 MCP Inspector：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## 发布

```bash
npm run build
npm publish
```
