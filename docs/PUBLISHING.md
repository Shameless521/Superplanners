# SuperPlanners 发布指南

## 项目信息

| 平台 | 地址 |
|------|------|
| GitHub | https://github.com/Shameless521/Superplanners |
| npm | https://www.npmjs.com/package/superplanners-mcp |

---

## 已完成

- [x] npm 包发布 (`superplanners-mcp`)
- [x] GitHub 仓库创建

---

## 完整发布流程

### 步骤 1：同步本地代码到 GitHub

```bash
cd /Library/MonkCoding/git_Project/superplanners

# 添加所有文件
git add .

# 提交
git commit -m "docs: 更新发布文档和链接"

# 推送到 GitHub
git push origin master
```

### 步骤 2：创建 Release（可选但推荐）

1. 访问 https://github.com/Shameless521/Superplanners/releases
2. 点击 **Draft a new release**
3. 填写：
   - Tag: `v0.1.0`
   - Title: `v0.1.0 - 初始发布`
   - Description:
     ```
     ## SuperPlanners v0.1.0

     智能任务分解与管理系统，为 Claude Code / MCP 环境设计。

     ### 功能
     - 智能任务分解 (Epic → Feature → Task → Subtask)
     - 状态追踪 (pending/in_progress/completed/blocked/skipped)
     - 依赖管理和循环检测
     - 进度可视化
     - MCP 集成

     ### 安装
     ```bash
     npx superplanners-mcp
     ```
     ```
4. 点击 **Publish release**

### 步骤 3：验证发布

#### 验证 npm 包

```bash
# 查看包信息
npm view superplanners-mcp

# 测试安装
npx superplanners-mcp --help
```

#### 验证 GitHub

访问 https://github.com/Shameless521/Superplanners 确认：
- README.md 显示正常
- 代码完整

---

## 用户使用方式

### 方式一：npx 直接运行

```bash
npx superplanners-mcp
```

### 方式二：配置 MCP Server

在项目根目录创建 `.mcp.json`：

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

### 方式三：从源码安装

```bash
git clone https://github.com/Shameless521/Superplanners.git
cd Superplanners/mcp-server
npm install && npm run build
npm start
```

---

## 更新发布

当有新版本时：

### 1. 更新版本号

```bash
cd mcp-server

# 修改 package.json 中的 version
# 0.1.0 → 0.1.1 (补丁) / 0.2.0 (功能) / 1.0.0 (重大)
```

### 2. 提交并推送

```bash
git add .
git commit -m "chore: bump version to 0.1.1"
git push origin master
```

### 3. 发布到 npm

```bash
cd mcp-server
npm publish
```

### 4. 创建 GitHub Release

同上步骤 2。

---

## 宣传推广（可选）

1. **GitHub Topics**: 在仓库设置中添加 topics: `mcp`, `claude`, `task-management`, `ai`
2. **README 徽章**: 已包含 npm 版本和 License 徽章
3. **社区分享**:
   - Claude 社区
   - MCP 相关讨论区
   - Twitter/X
