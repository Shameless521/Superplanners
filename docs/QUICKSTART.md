# SuperPlanners 快速入门指南

> 将复杂需求自动拆解为可执行的任务计划，让 Claude 帮你追踪进度。

---

## 本地运行

### 方式一：从源码运行

```bash
# 克隆项目
git clone https://github.com/Shameless521/Superplanners.git
cd superplanners/mcp-server

# 安装依赖
npm install

# 构建
npm run build

# 运行
npm start
```

### 方式二：npx 直接运行（发布后）

```bash
npx superplanners-mcp
```

### 方式三：全局安装

```bash
npm install -g superplanners-mcp
superplanners-mcp
```

---

## 配置 Claude Code

### 本地开发配置

在项目根目录创建 `.mcp.json`，指向本地构建：

```json
{
  "mcpServers": {
    "superplanners": {
      "command": "node",
      "args": ["/path/to/superplanners/mcp-server/dist/index.js"]
    }
  }
}
```

### 使用 npx 配置（推荐）

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

### Claude Code Plugin 方式

```bash
claude plugins add https://github.com/Shameless521/Superplanners
```

---

## 服务端部署

### Docker 部署

**Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY mcp-server/package*.json ./
RUN npm ci --production
COPY mcp-server/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**构建和运行:**
```bash
docker build -t superplanners-mcp .
docker run -d -p 3000:3000 -v /data/tasks:/app/tasks superplanners-mcp
```

### PM2 部署（Linux 服务器）

```bash
# 安装 PM2
npm install -g pm2

# 克隆并构建
git clone https://github.com/Shameless521/Superplanners.git
cd superplanners/mcp-server
npm install && npm run build

# 启动服务
pm2 start dist/index.js --name superplanners

# 设置开机自启
pm2 startup
pm2 save
```

### 远程 MCP Server 配置

如果 MCP Server 部署在远程服务器，可以通过 SSH 隧道或直接配置：

```json
{
  "mcpServers": {
    "superplanners": {
      "command": "ssh",
      "args": ["user@server", "node", "/opt/superplanners/dist/index.js"]
    }
  }
}
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SUPERPLANNERS_DATA_DIR` | 任务数据存储目录 | `./tasks` |
| `SUPERPLANNERS_LOG_LEVEL` | 日志级别 (debug/info/warn/error) | `info` |

---

## 核心使用流程

### 1. 创建任务计划

```
/superplanners:plan 创建一个博客系统，支持文章发布、评论、标签管理
```

Claude 会自动：
- 分析需求，拆解为 Epic → Feature → Task 层级
- 生成 `tasks/<项目名>/tasks.yaml` (数据源)
- 生成 `tasks/<项目名>/tasks.md` (可读视图)

### 2. 查看进度

查看所有项目：
```
/superplanners:status
```

查看特定项目详情：
```
/superplanners:status blog-system
```

输出示例：
```
📊 blog-system 进度: 30% (3/10)

✅ T1.1.1 初始化项目结构
✅ T1.1.2 配置数据库连接
🔄 T1.1.3 实现文章 CRUD (进行中)
⏸️ T1.2.1 实现评论功能 (待开始)
```

### 3. 更新任务状态

**自然语言更新：**
```
任务 T1.1.3 完成了，花了 2 小时
```

**命令更新：**
```
/superplanners:update blog-system T1.1.3 completed
```

Claude 会自动推荐下一个可执行的任务。

### 4. 归档清理

项目完成后归档：
```
/superplanners:reset cleanup blog-system
```

查看归档列表：
```
/superplanners:reset list
```

恢复归档项目：
```
/superplanners:reset restore <archive_id>
```

---

## 常见场景示例

### 场景一：从需求到任务拆解

```
你: /superplanners:plan 开发一个用户认证模块，支持注册、登录、密码重置

Claude: 已创建项目 auth-module，共拆解为 12 个任务：

Epic 1: 用户认证核心
├─ Feature 1.1: 用户注册
│  ├─ T1.1.1 设计用户数据模型 (1h)
│  ├─ T1.1.2 实现注册 API (2h)
│  └─ T1.1.3 添加邮箱验证 (1.5h)
├─ Feature 1.2: 用户登录
│  └─ ...

下一步建议：开始任务 T1.1.1 设计用户数据模型
```

### 场景二：追踪任务进度

```
你: /superplanners:status auth-module

Claude:
📊 auth-module 进度: 42% (5/12)

已完成: 5 | 进行中: 1 | 待开始: 4 | 阻塞: 2

当前任务: T1.2.1 实现登录 API
阻塞任务: T1.3.1, T1.3.2 (依赖 T1.2.1)

建议: 完成当前任务后，T1.3.1 和 T1.3.2 将自动解除阻塞
```

### 场景三：项目完成后归档

```
你: 项目完成了，帮我归档

Claude: 执行 /superplanners:reset cleanup auth-module
已归档到 tasks/.archive/auth-module-20240115-143022/
```

---

## 文件结构说明

```
tasks/
├─ task-plan.yaml          # 全局项目索引
├─ blog-system/
│  ├─ tasks.yaml           # 数据源 (SSOT)
│  └─ tasks.md             # 可读视图 (自动生成)
├─ auth-module/
│  ├─ tasks.yaml
│  └─ tasks.md
└─ .archive/               # 归档目录
   └─ old-project-20240101-120000/
```

**重要原则：**
- `tasks.yaml` 是唯一数据源 (Single Source of Truth)
- `tasks.md` 是自动生成的可读视图，每次更新 yaml 后自动重新生成
- 如需手动编辑，只修改 `tasks.yaml`

---

## 任务状态说明

| 状态 | 图标 | 说明 |
|------|------|------|
| pending | ⏸️ | 待开始 |
| in_progress | 🔄 | 进行中 |
| completed | ✅ | 已完成 |
| blocked | 🚫 | 被阻塞（依赖未完成） |
| skipped | ⏭️ | 已跳过 |

---

## 下一步

- 查看 [README.md](../README.md) 了解更多功能
- 查看 [mcp-server/README.md](../mcp-server/README.md) 了解开发指南
