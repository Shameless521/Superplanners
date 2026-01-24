---
description: 归档清理或恢复历史任务
argument-hint: "<action: cleanup|list|restore> [target]"
---

# SuperPlanners - 归档与恢复

归档清理或恢复历史任务。

## 使用方法

调用 `superplanners_reset` MCP Tool。

### 子命令

#### cleanup - 归档项目

```
/superplanners:reset cleanup [project_id]
```

- 不指定 project_id：归档所有已完成的项目
- 指定 project_id：归档指定项目

#### list - 列出归档

```
/superplanners:reset list
```

列出所有归档历史。

#### restore - 恢复归档

```
/superplanners:reset restore <archive_id>
```

从归档恢复指定项目。

## 参数映射

根据 action 类型：
- cleanup: target → project_id
- restore: target → archive_id

## 注意事项

- 归档后的项目存放在 `tasks/.archive/` 目录
- 恢复时如果项目已存在会失败
- 归档文件不可变，保持完整快照
