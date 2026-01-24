# SuperPlanners - Claude Code 使用教程

SuperPlanners 由两部分组成：
- **Claude Code Plugin** - 提供 `/superplanners:xxx` 斜杠命令
- **MCP Server** - 提供后端任务管理服务

安装 Plugin 时会自动配置 MCP Server。

---

## 安装方式

### 方式一：通过 Plugin Marketplace（推荐）

```bash
# 步骤 1: 全局安装 MCP Server
npm install -g superplanners-mcp

# 步骤 2: 在 Claude Code 中添加 Marketplace
/plugin marketplace add Shameless521/Superplanners

# 步骤 3: 安装 Plugin
/plugin install superplanners
```

### 方式二：直接从 GitHub 安装

```bash
# 在 Claude Code 中运行
/plugin install Shameless521/Superplanners
```

安装后会自动配置 MCP Server，无需手动创建 `.mcp.json`。

### 方式三：手动配置（开发者）

```bash
# 克隆项目
git clone https://github.com/Shameless521/Superplanners.git

# 构建 MCP Server
cd Superplanners/mcp-server
npm install && npm run build

# 添加本地 Plugin
/plugin install /path/to/Superplanners
```

或者手动创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "superplanners": {
      "command": "npx",
      "args": ["superplanners-mcp"]
    }
  }
}
```

---

## 验证安装

重启 Claude Code 后，输入 `/superplanners:status`。

如果看到项目列表（或"暂无项目"），说明安装成功。

---

## 使用斜杠命令

### `/superplanners:plan` - 创建任务计划

```
/superplanners:plan 创建一个博客系统，支持文章发布、评论、标签管理
```

**参数：**
- `requirement` (必填): 需求描述
- `project_name` (可选): 项目名称，不填则自动生成

**示例输出：**

```
✅ 已创建项目: blog-system

📊 任务分解：
Epic 1: 博客核心功能
├─ Feature 1.1: 文章管理
│  ├─ T1.1.1 设计文章数据模型 [high, 1h]
│  ├─ T1.1.2 实现文章 CRUD API [high, 3h]
│  └─ T1.1.3 实现文章列表分页 [medium, 1.5h]
├─ Feature 1.2: 评论系统
│  ├─ T1.2.1 设计评论数据模型 [high, 1h]
│  └─ T1.2.2 实现评论功能 [high, 2h]
├─ Feature 1.3: 标签管理
│  └─ T1.3.1 实现标签 CRUD [medium, 2h]

📁 已生成文件:
- tasks/blog-system/tasks.yaml
- tasks/blog-system/tasks.md

📌 下一步建议: 开始任务 T1.1.1 设计文章数据模型
```

---

### `/superplanners:status` - 查看状态

```
/superplanners:status
```

**查看所有项目：**

```
📋 SuperPlanners 项目列表

| 项目 | 进度 | 已完成 | 总数 | 状态 |
|------|------|--------|------|------|
| blog-system | 33% | 2 | 6 | 🔄 进行中 |
| todo-app | 100% | 5 | 5 | ✅ 已完成 |
```

**查看特定项目：**

```
/superplanners:status blog-system
```

```
📊 blog-system 进度: 33% (2/6)

状态统计: ✅2 | 🔄1 | ⏸️2 | 🚫1

任务列表:
✅ T1.1.1 设计文章数据模型
✅ T1.1.2 实现文章 CRUD API
🔄 T1.1.3 实现文章列表分页 (进行中)
⏸️ T1.2.1 设计评论数据模型
⏸️ T1.2.2 实现评论功能 (依赖: T1.2.1)
🚫 T1.3.1 实现标签 CRUD (阻塞: 等待设计确认)

📌 当前任务: T1.1.3 实现文章列表分页
📌 下一个建议: T1.2.1 设计评论数据模型
```

---

### `/superplanners:reset` - 归档与恢复

#### 归档项目

```
/superplanners:reset cleanup blog-system
```

#### 查看归档列表

```
/superplanners:reset list
```

```
📦 归档列表

| 归档ID | 项目 | 归档时间 |
|--------|------|----------|
| blog-system-20240115-143022 | blog-system | 2024-01-15 14:30 |
| todo-app-20240110-091500 | todo-app | 2024-01-10 09:15 |
```

#### 恢复归档

```
/superplanners:reset restore blog-system-20240115-143022
```

---

## 自然语言更新任务

除了斜杠命令，你也可以用自然语言与 Claude 交流，Claude 会自动调用 MCP Tools：

### 更新任务状态

```
T1.1.3 完成了
```

```
任务 T1.2.1 开始做了
```

```
T1.3.1 被阻塞了，原因是等待 UI 设计稿
```

### 查询任务

```
blog-system 还有哪些任务没完成？
```

```
下一个应该做什么？
```

```
哪些任务被阻塞了？
```

### 批量操作

```
T1.2.1 和 T1.2.2 都完成了
```

---

## 命令速查表

| 命令 | 说明 | 示例 |
|------|------|------|
| `/superplanners:plan <需求>` | 创建任务计划 | `/superplanners:plan 用户登录模块` |
| `/superplanners:status` | 查看所有项目 | `/superplanners:status` |
| `/superplanners:status <项目>` | 查看项目详情 | `/superplanners:status blog-system` |
| `/superplanners:reset cleanup <项目>` | 归档项目 | `/superplanners:reset cleanup blog-system` |
| `/superplanners:reset list` | 查看归档 | `/superplanners:reset list` |
| `/superplanners:reset restore <ID>` | 恢复归档 | `/superplanners:reset restore blog-xxx` |

---

## 任务状态图标

| 图标 | 状态 | 说明 |
|------|------|------|
| ⏸️ | pending | 待开始 |
| 🔄 | in_progress | 进行中 |
| ✅ | completed | 已完成 |
| 🚫 | blocked | 被阻塞 |
| ⏭️ | skipped | 已跳过 |

---

## 文件结构

```
your-project/
├─ .mcp.json                 # MCP Server 配置
└─ tasks/                    # 任务数据目录
   ├─ task-plan.yaml         # 项目索引
   ├─ blog-system/
   │  ├─ tasks.yaml          # 任务数据 (SSOT)
   │  └─ tasks.md            # Markdown 视图 (自动生成)
   └─ .archive/              # 归档目录
```

**重要：**
- `tasks.yaml` 是唯一数据源
- `tasks.md` 是自动生成的可读视图
- 如需手动编辑，只修改 `tasks.yaml`

---

## 最佳实践

1. **需求描述清晰** - 创建计划时详细描述功能点
2. **及时更新状态** - 完成任务后立即更新
3. **善用备注** - 记录技术决策和问题
4. **合理设置依赖** - 有前置条件的任务设置 depends_on
5. **定期归档** - 完成的项目及时归档

---

## 故障排除

### Plugin 命令无效

```bash
# 检查 Plugin 是否安装
claude plugins list

# 重新安装
claude plugins remove superplanners
claude plugins add https://github.com/Shameless521/Superplanners
```

### MCP Server 未连接

```bash
# 检查 .mcp.json 配置
cat .mcp.json

# 手动测试 MCP Server
npx superplanners-mcp
```

### 任务文件找不到

确保在正确的项目目录下运行 Claude Code，`tasks/` 目录会创建在当前工作目录。

---

## 更多资源

- **GitHub**: https://github.com/Shameless521/Superplanners
- **npm**: https://www.npmjs.com/package/superplanners-mcp
- **快速入门**: [QUICKSTART.md](./QUICKSTART.md)
- **发布指南**: [PUBLISHING.md](./PUBLISHING.md)
