# SuperPlanners 实施计划 - 第三批：IO 层

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现文件系统 IO 层，包括 YAML 读写、目录管理、归档功能和 Markdown 渲染

**Architecture:** File Manager 负责原子化的文件操作，Renderer 负责从 YAML 生成只读的 Markdown 视图

**Tech Stack:** Node.js fs/promises, yaml, path

**前置条件:** 第一批和第二批已完成

---

## Task 1: 实现 File Manager - YAML 文件读取

**Files:**
- Create: `mcp-server/src/file-manager.ts`
- Create: `mcp-server/src/file-manager.test.ts`

**Step 1: 编写文件读取测试**

```typescript
// mcp-server/src/file-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileManager } from './file-manager.js';

describe('FileManager', () => {
  let testDir: string;
  let fm: FileManager;

  beforeEach(async () => {
    testDir = join(tmpdir(), `superplanners-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    fm = new FileManager(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('readProjectData', () => {
    it('should read valid project YAML', async () => {
      const projectDir = join(testDir, 'tasks', 'test-project');
      await mkdir(projectDir, { recursive: true });
      await writeFile(
        join(projectDir, 'tasks.yaml'),
        `
meta:
  project: 测试项目
  project_id: test-project
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:00:00Z"
  version: 1

tasks:
  - id: "1"
    title: 任务1
    status: pending
    priority: high
`
      );

      const result = await fm.readProjectData('test-project');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.project_id).toBe('test-project');
        expect(result.data.tasks).toHaveLength(1);
      }
    });

    it('should return error for non-existent project', async () => {
      const result = await fm.readProjectData('non-existent');
      expect(result.success).toBe(false);
    });
  });

  describe('readTaskPlan', () => {
    it('should read valid task plan YAML', async () => {
      const tasksDir = join(testDir, 'tasks');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'task-plan.yaml'),
        `
meta:
  name: SuperPlanners
  version: "1.0.0"
  updated: "2025-01-23T10:00:00Z"

projects: []
`
      );

      const result = await fm.readTaskPlan();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.name).toBe('SuperPlanners');
      }
    });

    it('should return null result for non-existent task plan', async () => {
      const result = await fm.readTaskPlan();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: FAIL - file-manager.js 不存在

**Step 3: 实现 File Manager 基础结构和读取功能**

```typescript
// mcp-server/src/file-manager.ts
import { readFile, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from 'node:fs';
import type { ProjectData, TaskPlan } from './types.js';
import { parseProjectData, parseTaskPlan, type ParseResult } from './task-engine/parser.js';

export type FileResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export class FileManager {
  private baseDir: string;
  private tasksDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.tasksDir = join(baseDir, 'tasks');
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取项目目录路径
   */
  getProjectDir(projectId: string): string {
    return join(this.tasksDir, projectId);
  }

  /**
   * 获取项目 YAML 文件路径
   */
  getProjectYamlPath(projectId: string): string {
    return join(this.getProjectDir(projectId), 'tasks.yaml');
  }

  /**
   * 获取任务计划索引路径
   */
  getTaskPlanPath(): string {
    return join(this.tasksDir, 'task-plan.yaml');
  }

  /**
   * 读取项目数据
   */
  async readProjectData(projectId: string): Promise<FileResult<ProjectData>> {
    const filePath = this.getProjectYamlPath(projectId);

    if (!(await this.fileExists(filePath))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const result = parseProjectData(content);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (e) {
      return {
        success: false,
        error: `读取文件失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 读取任务计划索引
   */
  async readTaskPlan(): Promise<FileResult<TaskPlan | null>> {
    const filePath = this.getTaskPlanPath();

    if (!(await this.fileExists(filePath))) {
      return { success: true, data: null };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const result = parseTaskPlan(content);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (e) {
      return {
        success: false,
        error: `读取文件失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/file-manager.ts mcp-server/src/file-manager.test.ts
git commit -m "feat(io): 实现 File Manager 文件读取

- FileManager 类封装文件操作
- readProjectData: 读取项目 YAML
- readTaskPlan: 读取任务计划索引"
```

---

## Task 2: 实现 File Manager - YAML 原子写入

**Files:**
- Modify: `mcp-server/src/file-manager.ts`
- Modify: `mcp-server/src/file-manager.test.ts`

**Step 1: 添加写入测试**

```typescript
// 在 file-manager.test.ts 中添加
import type { ProjectData, TaskPlan } from './types.js';

describe('writeProjectData', () => {
  it('should write project data atomically', async () => {
    const projectData: ProjectData = {
      meta: {
        project: '测试项目',
        project_id: 'test-project',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
      ],
    };

    const result = await fm.writeProjectData('test-project', projectData);
    expect(result.success).toBe(true);

    // 验证可以读回
    const readResult = await fm.readProjectData('test-project');
    expect(readResult.success).toBe(true);
    if (readResult.success) {
      expect(readResult.data.meta.project).toBe('测试项目');
    }
  });

  it('should update meta.updated timestamp', async () => {
    const projectData: ProjectData = {
      meta: {
        project: '测试项目',
        project_id: 'test-project',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [],
    };

    await fm.writeProjectData('test-project', projectData);
    const readResult = await fm.readProjectData('test-project');

    if (readResult.success) {
      // updated 应该被自动更新
      expect(readResult.data.meta.updated).not.toBe('2025-01-23T10:00:00Z');
    }
  });
});

describe('writeTaskPlan', () => {
  it('should write task plan atomically', async () => {
    const taskPlan: TaskPlan = {
      meta: {
        name: 'SuperPlanners',
        version: '1.0.0',
        updated: '2025-01-23T10:00:00Z',
      },
      projects: [],
    };

    const result = await fm.writeTaskPlan(taskPlan);
    expect(result.success).toBe(true);

    const readResult = await fm.readTaskPlan();
    expect(readResult.success).toBe(true);
    if (readResult.success && readResult.data) {
      expect(readResult.data.meta.name).toBe('SuperPlanners');
    }
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: FAIL

**Step 3: 实现原子写入**

```typescript
// 在 file-manager.ts 中添加
import { writeFile, rename, unlink, mkdir } from 'node:fs/promises';
import YAML from 'yaml';

// 在 FileManager 类中添加以下方法

  /**
   * 确保目录存在
   */
  async ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  /**
   * 原子写入文件
   * 先写入临时文件，再 rename 到目标路径
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, filePath);
    } catch (e) {
      // 清理临时文件
      try {
        await unlink(tempPath);
      } catch {
        // 忽略清理失败
      }
      throw e;
    }
  }

  /**
   * 写入项目数据
   */
  async writeProjectData(
    projectId: string,
    data: ProjectData
  ): Promise<FileResult<void>> {
    try {
      const projectDir = this.getProjectDir(projectId);
      await this.ensureDir(projectDir);

      // 更新 updated 时间戳
      const updatedData: ProjectData = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getProjectYamlPath(projectId);

      await this.atomicWrite(filePath, yamlContent);

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 写入任务计划索引
   */
  async writeTaskPlan(data: TaskPlan): Promise<FileResult<void>> {
    try {
      await this.ensureDir(this.tasksDir);

      // 更新 updated 时间戳
      const updatedData: TaskPlan = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getTaskPlanPath();

      await this.atomicWrite(filePath, yamlContent);

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/file-manager.ts mcp-server/src/file-manager.test.ts
git commit -m "feat(io): 实现 YAML 原子写入

- atomicWrite: 先写临时文件再 rename
- writeProjectData: 写入项目数据，自动更新 updated
- writeTaskPlan: 写入任务计划索引"
```

---

## Task 3: 实现 File Manager - 目录和项目管理

**Files:**
- Modify: `mcp-server/src/file-manager.ts`
- Modify: `mcp-server/src/file-manager.test.ts`

**Step 1: 添加目录管理测试**

```typescript
// 在 file-manager.test.ts 中添加

describe('listProjects', () => {
  it('should list all projects', async () => {
    // 创建两个项目
    const project1: ProjectData = {
      meta: {
        project: '项目1',
        project_id: 'project-1',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [],
    };
    const project2: ProjectData = {
      meta: {
        project: '项目2',
        project_id: 'project-2',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [],
    };

    await fm.writeProjectData('project-1', project1);
    await fm.writeProjectData('project-2', project2);

    const projects = await fm.listProjects();
    expect(projects).toHaveLength(2);
    expect(projects).toContain('project-1');
    expect(projects).toContain('project-2');
  });

  it('should return empty array when no projects', async () => {
    const projects = await fm.listProjects();
    expect(projects).toEqual([]);
  });
});

describe('projectExists', () => {
  it('should return true for existing project', async () => {
    const project: ProjectData = {
      meta: {
        project: '测试',
        project_id: 'test',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [],
    };
    await fm.writeProjectData('test', project);

    expect(await fm.projectExists('test')).toBe(true);
  });

  it('should return false for non-existing project', async () => {
    expect(await fm.projectExists('non-existent')).toBe(false);
  });
});

describe('deleteProject', () => {
  it('should delete project directory', async () => {
    const project: ProjectData = {
      meta: {
        project: '测试',
        project_id: 'test',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [],
    };
    await fm.writeProjectData('test', project);
    expect(await fm.projectExists('test')).toBe(true);

    await fm.deleteProject('test');
    expect(await fm.projectExists('test')).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: FAIL

**Step 3: 实现目录和项目管理**

```typescript
// 在 file-manager.ts 中添加
import { readdir, rm, stat } from 'node:fs/promises';

// 在 FileManager 类中添加以下方法

  /**
   * 列出所有项目
   */
  async listProjects(): Promise<string[]> {
    if (!(await this.fileExists(this.tasksDir))) {
      return [];
    }

    try {
      const entries = await readdir(this.tasksDir, { withFileTypes: true });
      const projects: string[] = [];

      for (const entry of entries) {
        // 跳过文件和特殊目录
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;

        // 检查是否有 tasks.yaml
        const yamlPath = join(this.tasksDir, entry.name, 'tasks.yaml');
        if (await this.fileExists(yamlPath)) {
          projects.push(entry.name);
        }
      }

      return projects;
    } catch {
      return [];
    }
  }

  /**
   * 检查项目是否存在
   */
  async projectExists(projectId: string): Promise<boolean> {
    const yamlPath = this.getProjectYamlPath(projectId);
    return this.fileExists(yamlPath);
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<FileResult<void>> {
    const projectDir = this.getProjectDir(projectId);

    if (!(await this.projectExists(projectId))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      await rm(projectDir, { recursive: true });
      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `删除失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/file-manager.ts mcp-server/src/file-manager.test.ts
git commit -m "feat(io): 实现目录和项目管理

- listProjects: 列出所有项目
- projectExists: 检查项目是否存在
- deleteProject: 删除项目目录"
```

---

## Task 4: 实现 File Manager - 归档功能

**Files:**
- Modify: `mcp-server/src/file-manager.ts`
- Modify: `mcp-server/src/file-manager.test.ts`

**Step 1: 添加归档功能测试**

```typescript
// 在 file-manager.test.ts 中添加

describe('Archive', () => {
  describe('archiveProject', () => {
    it('should archive project to .archive directory', async () => {
      const project: ProjectData = {
        meta: {
          project: '测试',
          project_id: 'test',
          created: '2025-01-23T10:00:00Z',
          updated: '2025-01-23T10:00:00Z',
          version: 1,
        },
        tasks: [],
      };
      await fm.writeProjectData('test', project);

      const result = await fm.archiveProject('test');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.archiveId).toContain('test');
      }

      // 原项目应该被删除
      expect(await fm.projectExists('test')).toBe(false);
    });
  });

  describe('listArchives', () => {
    it('should list archived projects', async () => {
      const project: ProjectData = {
        meta: {
          project: '测试',
          project_id: 'test',
          created: '2025-01-23T10:00:00Z',
          updated: '2025-01-23T10:00:00Z',
          version: 1,
        },
        tasks: [],
      };
      await fm.writeProjectData('test', project);
      await fm.archiveProject('test');

      const archives = await fm.listArchives();
      expect(archives.length).toBeGreaterThan(0);
      expect(archives[0].projectId).toBe('test');
    });
  });

  describe('restoreArchive', () => {
    it('should restore archived project', async () => {
      const project: ProjectData = {
        meta: {
          project: '测试',
          project_id: 'test',
          created: '2025-01-23T10:00:00Z',
          updated: '2025-01-23T10:00:00Z',
          version: 1,
        },
        tasks: [],
      };
      await fm.writeProjectData('test', project);

      const archiveResult = await fm.archiveProject('test');
      expect(archiveResult.success).toBe(true);

      if (archiveResult.success) {
        const restoreResult = await fm.restoreArchive(archiveResult.data.archiveId);
        expect(restoreResult.success).toBe(true);
        expect(await fm.projectExists('test')).toBe(true);
      }
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: FAIL

**Step 3: 实现归档功能**

```typescript
// 在 file-manager.ts 中添加

export interface ArchiveInfo {
  archiveId: string;
  projectId: string;
  archivedAt: string;
}

// 在 FileManager 类中添加以下方法

  /**
   * 获取归档目录路径
   */
  private getArchiveDir(): string {
    return join(this.tasksDir, '.archive');
  }

  /**
   * 生成归档 ID
   */
  private generateArchiveId(projectId: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    return `${timestamp}-${projectId}`;
  }

  /**
   * 归档项目
   */
  async archiveProject(
    projectId: string
  ): Promise<FileResult<{ archiveId: string }>> {
    if (!(await this.projectExists(projectId))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      const archiveDir = this.getArchiveDir();
      await this.ensureDir(archiveDir);

      const archiveId = this.generateArchiveId(projectId);
      const archivePath = join(archiveDir, archiveId);
      const projectDir = this.getProjectDir(projectId);

      // 移动项目到归档目录
      await rename(projectDir, archivePath);

      return { success: true, data: { archiveId } };
    } catch (e) {
      return {
        success: false,
        error: `归档失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 列出所有归档
   */
  async listArchives(): Promise<ArchiveInfo[]> {
    const archiveDir = this.getArchiveDir();

    if (!(await this.fileExists(archiveDir))) {
      return [];
    }

    try {
      const entries = await readdir(archiveDir, { withFileTypes: true });
      const archives: ArchiveInfo[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // 解析归档 ID: YYYYMMDDHHMMSS-project-id
        const match = entry.name.match(/^(\d{14})-(.+)$/);
        if (match) {
          const [, timestamp, projectId] = match;
          const year = timestamp.slice(0, 4);
          const month = timestamp.slice(4, 6);
          const day = timestamp.slice(6, 8);
          const hour = timestamp.slice(8, 10);
          const min = timestamp.slice(10, 12);
          const sec = timestamp.slice(12, 14);

          archives.push({
            archiveId: entry.name,
            projectId,
            archivedAt: `${year}-${month}-${day}T${hour}:${min}:${sec}Z`,
          });
        }
      }

      // 按时间倒序
      archives.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

      return archives;
    } catch {
      return [];
    }
  }

  /**
   * 恢复归档
   */
  async restoreArchive(archiveId: string): Promise<FileResult<{ projectId: string }>> {
    const archiveDir = this.getArchiveDir();
    const archivePath = join(archiveDir, archiveId);

    if (!(await this.fileExists(archivePath))) {
      return { success: false, error: `归档 ${archiveId} 不存在` };
    }

    // 解析 project ID
    const match = archiveId.match(/^\d{14}-(.+)$/);
    if (!match) {
      return { success: false, error: `无效的归档 ID: ${archiveId}` };
    }
    const projectId = match[1];

    // 检查项目是否已存在
    if (await this.projectExists(projectId)) {
      return { success: false, error: `项目 ${projectId} 已存在，无法恢复` };
    }

    try {
      const projectDir = this.getProjectDir(projectId);
      await rename(archivePath, projectDir);

      return { success: true, data: { projectId } };
    } catch (e) {
      return {
        success: false,
        error: `恢复失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/file-manager.ts mcp-server/src/file-manager.test.ts
git commit -m "feat(io): 实现归档功能

- archiveProject: 移动项目到 .archive/ 目录
- listArchives: 列出所有归档
- restoreArchive: 从归档恢复项目"
```

---

## Task 5: 实现 Markdown Renderer - task-plan.md 渲染

**Files:**
- Create: `mcp-server/src/renderer.ts`
- Create: `mcp-server/src/renderer.test.ts`

**Step 1: 编写 Renderer 测试**

```typescript
// mcp-server/src/renderer.test.ts
import { describe, it, expect } from 'vitest';
import { renderTaskPlan, renderProjectTasks } from './renderer.js';
import type { TaskPlan, ProjectData } from './types.js';

describe('Renderer', () => {
  describe('renderTaskPlan', () => {
    it('should render task plan to markdown', () => {
      const taskPlan: TaskPlan = {
        meta: {
          name: 'SuperPlanners',
          version: '1.0.0',
          updated: '2025-01-23T10:30:00Z',
        },
        projects: [
          {
            project_id: 'user-login',
            project: '用户登录功能',
            status: 'active',
            updated: '2025-01-23T10:30:00Z',
            path: 'user-login/tasks.yaml',
          },
          {
            project_id: 'api-design',
            project: 'API 设计',
            status: 'completed',
            updated: '2025-01-22T15:00:00Z',
            path: 'api-design/tasks.yaml',
          },
        ],
      };

      // 模拟进度计算函数
      const getProgress = (projectId: string) => {
        if (projectId === 'user-login') return '3/12';
        return '8/8';
      };

      const markdown = renderTaskPlan(taskPlan, getProgress);

      expect(markdown).toContain('# SuperPlanners');
      expect(markdown).toContain('用户登录功能');
      expect(markdown).toContain('🔄'); // active 状态图标
      expect(markdown).toContain('3/12');
      expect(markdown).toContain('API 设计');
      expect(markdown).toContain('✅'); // completed 状态图标
    });

    it('should handle empty projects', () => {
      const taskPlan: TaskPlan = {
        meta: {
          name: 'SuperPlanners',
          version: '1.0.0',
          updated: '2025-01-23T10:30:00Z',
        },
        projects: [],
      };

      const markdown = renderTaskPlan(taskPlan, () => '0/0');

      expect(markdown).toContain('# SuperPlanners');
      expect(markdown).toContain('暂无项目');
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/renderer.test.ts`

Expected: FAIL

**Step 3: 实现 task-plan.md 渲染**

```typescript
// mcp-server/src/renderer.ts
import type { TaskPlan, ProjectData, Task, SubTask } from './types.js';

const STATUS_ICONS: Record<string, string> = {
  active: '🔄',
  completed: '✅',
  pending: '⏸️',
  in_progress: '🔄',
  blocked: '🚫',
  skipped: '⏭️',
};

/**
 * 渲染任务计划索引为 Markdown
 */
export function renderTaskPlan(
  taskPlan: TaskPlan,
  getProgress: (projectId: string) => string
): string {
  const lines: string[] = [];

  lines.push(`# ${taskPlan.meta.name}`);
  lines.push('');
  lines.push(`> 版本: ${taskPlan.meta.version}`);
  lines.push(`> 更新时间: ${formatDate(taskPlan.meta.updated)}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 项目列表');
  lines.push('');

  if (taskPlan.projects.length === 0) {
    lines.push('*暂无项目*');
  } else {
    lines.push('| 状态 | 项目 | 进度 | 更新时间 |');
    lines.push('|------|------|------|----------|');

    for (const project of taskPlan.projects) {
      const icon = STATUS_ICONS[project.status] || '❓';
      const progress = getProgress(project.project_id);
      const date = formatDate(project.updated);

      lines.push(`| ${icon} | [${project.project}](${project.path}) | ${progress} | ${date} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*此文件由 SuperPlanners 自动生成，请勿手动编辑*');

  return lines.join('\n');
}

/**
 * 格式化日期
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/renderer.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/renderer.ts mcp-server/src/renderer.test.ts
git commit -m "feat(io): 实现 task-plan.md 渲染

- renderTaskPlan: 生成项目列表 Markdown
- 使用状态图标和表格格式
- 自动生成警告注释"
```

---

## Task 6: 实现 Markdown Renderer - tasks.md 渲染

**Files:**
- Modify: `mcp-server/src/renderer.ts`
- Modify: `mcp-server/src/renderer.test.ts`

**Step 1: 添加 tasks.md 渲染测试**

```typescript
// 在 renderer.test.ts 中添加
import { calculateTaskSummary, calculateProgress } from './task-engine/progress-calculator.js';

describe('renderProjectTasks', () => {
  it('should render project tasks to markdown', () => {
    const projectData: ProjectData = {
      meta: {
        project: '用户登录功能',
        project_id: 'user-login',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:30:00Z',
        version: 1,
        description: '开发完整的用户登录功能',
      },
      tasks: [
        {
          id: '1',
          title: '后端 API 开发',
          status: 'in_progress',
          priority: 'high',
          estimate: '8h',
          subtasks: [
            { id: '1.1', title: '设计接口规范', status: 'completed' },
            { id: '1.2', title: '实现验证逻辑', status: 'in_progress' },
          ],
        },
        {
          id: '2',
          title: '前端开发',
          status: 'pending',
          priority: 'medium',
          dependencies: ['1'],
        },
      ],
    };

    const summary = calculateTaskSummary(projectData.tasks);
    const progress = calculateProgress(projectData.tasks);

    const markdown = renderProjectTasks(projectData, summary, progress);

    expect(markdown).toContain('# 用户登录功能');
    expect(markdown).toContain('开发完整的用户登录功能');
    expect(markdown).toContain('后端 API 开发');
    expect(markdown).toContain('🔄'); // in_progress
    expect(markdown).toContain('✅'); // completed (subtask)
    expect(markdown).toContain('设计接口规范');
    expect(markdown).toContain('前端开发');
    expect(markdown).toContain('依赖: 1');
  });

  it('should render progress bar', () => {
    const projectData: ProjectData = {
      meta: {
        project: '测试',
        project_id: 'test',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'pending', priority: 'high' },
      ],
    };

    const summary = calculateTaskSummary(projectData.tasks);
    const progress = calculateProgress(projectData.tasks);

    const markdown = renderProjectTasks(projectData, summary, progress);

    expect(markdown).toContain('50%');
    expect(markdown).toContain('1/2');
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/renderer.test.ts`

Expected: FAIL

**Step 3: 实现 tasks.md 渲染**

```typescript
// 在 renderer.ts 中添加
import type { TaskSummary, ProgressInfo } from './types.js';

const PRIORITY_LABELS: Record<string, string> = {
  critical: '🔴 紧急',
  high: '🟠 高',
  medium: '🟡 中',
  low: '🟢 低',
};

/**
 * 渲染进度条
 */
function renderProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

/**
 * 渲染项目任务为 Markdown
 */
export function renderProjectTasks(
  projectData: ProjectData,
  summary: TaskSummary,
  progress: ProgressInfo
): string {
  const lines: string[] = [];
  const { meta, tasks } = projectData;

  // 标题
  lines.push(`# ${meta.project}`);
  lines.push('');

  // 描述
  if (meta.description) {
    lines.push(`> ${meta.description}`);
    lines.push('');
  }

  // 进度概览
  lines.push('## 📊 进度概览');
  lines.push('');
  lines.push(`${renderProgressBar(progress.percentage)} **${progress.percentage}%** (${progress.completed}/${progress.total})`);
  lines.push('');

  // 统计摘要
  lines.push('| 状态 | 数量 |');
  lines.push('|------|------|');
  lines.push(`| ✅ 已完成 | ${summary.completed} |`);
  lines.push(`| 🔄 进行中 | ${summary.in_progress} |`);
  lines.push(`| ⏸️ 待开始 | ${summary.pending} |`);
  lines.push(`| 🚫 阻塞中 | ${summary.blocked} |`);
  lines.push(`| ⏭️ 已跳过 | ${summary.skipped} |`);
  lines.push('');

  // 任务列表
  lines.push('---');
  lines.push('');
  lines.push('## 📋 任务列表');
  lines.push('');

  for (const task of tasks) {
    lines.push(renderTask(task));
    lines.push('');
  }

  // 元信息
  lines.push('---');
  lines.push('');
  lines.push(`*项目 ID: ${meta.project_id}*`);
  lines.push(`*创建时间: ${formatDate(meta.created)}*`);
  lines.push(`*更新时间: ${formatDate(meta.updated)}*`);
  lines.push('');
  lines.push('*此文件由 SuperPlanners 自动生成，请勿手动编辑*');

  return lines.join('\n');
}

/**
 * 渲染单个任务
 */
function renderTask(task: Task, indent: number = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);
  const icon = STATUS_ICONS[task.status] || '❓';
  const priority = PRIORITY_LABELS[task.priority] || task.priority;

  // 任务标题
  lines.push(`${prefix}### ${icon} ${task.id}. ${task.title}`);
  lines.push('');

  // 任务元信息
  const metaItems: string[] = [];
  metaItems.push(`**优先级:** ${priority}`);
  if (task.estimate) metaItems.push(`**预估:** ${task.estimate}`);
  if (task.actual) metaItems.push(`**实际:** ${task.actual}`);
  if (task.dependencies && task.dependencies.length > 0) {
    metaItems.push(`**依赖:** ${task.dependencies.join(', ')}`);
  }

  lines.push(`${prefix}${metaItems.join(' | ')}`);
  lines.push('');

  // 描述
  if (task.description) {
    lines.push(`${prefix}${task.description}`);
    lines.push('');
  }

  // 备注
  if (task.notes) {
    lines.push(`${prefix}> 📝 ${task.notes}`);
    lines.push('');
  }

  // 子任务
  if (task.subtasks && task.subtasks.length > 0) {
    lines.push(`${prefix}**子任务:**`);
    lines.push('');
    for (const subtask of task.subtasks) {
      const subIcon = STATUS_ICONS[subtask.status] || '❓';
      let subtaskLine = `${prefix}- ${subIcon} **${subtask.id}** ${subtask.title}`;
      if (subtask.notes) {
        subtaskLine += ` *(${subtask.notes})*`;
      }
      lines.push(subtaskLine);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/renderer.test.ts`

Expected: 所有测试通过

**Step 5: Commit**

```bash
git add mcp-server/src/renderer.ts mcp-server/src/renderer.test.ts
git commit -m "feat(io): 实现 tasks.md 渲染

- renderProjectTasks: 生成项目任务列表 Markdown
- 包含进度条、统计摘要、任务详情
- 使用状态图标和优先级标签
- 支持子任务渲染"
```

---

## Task 7: 在 File Manager 中集成 Renderer

**Files:**
- Modify: `mcp-server/src/file-manager.ts`
- Modify: `mcp-server/src/file-manager.test.ts`

**Step 1: 添加 Markdown 写入测试**

```typescript
// 在 file-manager.test.ts 中添加

describe('Markdown Rendering', () => {
  it('should write markdown files when writing project data', async () => {
    const project: ProjectData = {
      meta: {
        project: '测试项目',
        project_id: 'test',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:00:00Z',
        version: 1,
      },
      tasks: [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
      ],
    };

    await fm.writeProjectData('test', project, { renderMarkdown: true });

    // 检查 Markdown 文件是否存在
    const mdPath = join(testDir, 'tasks', 'test', 'tasks.md');
    const mdExists = await fm['fileExists'](mdPath);
    expect(mdExists).toBe(true);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: FAIL

**Step 3: 集成 Renderer 到 File Manager**

```typescript
// 在 file-manager.ts 中添加
import { renderTaskPlan, renderProjectTasks } from './renderer.js';
import { calculateTaskSummary, calculateProgress, formatProgressString } from './task-engine/progress-calculator.js';

export interface WriteOptions {
  renderMarkdown?: boolean;
}

// 修改 writeProjectData 方法
  async writeProjectData(
    projectId: string,
    data: ProjectData,
    options: WriteOptions = {}
  ): Promise<FileResult<void>> {
    try {
      const projectDir = this.getProjectDir(projectId);
      await this.ensureDir(projectDir);

      // 更新 updated 时间戳
      const updatedData: ProjectData = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getProjectYamlPath(projectId);

      await this.atomicWrite(filePath, yamlContent);

      // 渲染 Markdown
      if (options.renderMarkdown !== false) {
        const summary = calculateTaskSummary(updatedData.tasks);
        const progress = calculateProgress(updatedData.tasks);
        const markdown = renderProjectTasks(updatedData, summary, progress);
        const mdPath = join(projectDir, 'tasks.md');
        await this.atomicWrite(mdPath, markdown);
      }

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

// 修改 writeTaskPlan 方法，添加 Markdown 渲染
  async writeTaskPlan(
    data: TaskPlan,
    options: WriteOptions = {}
  ): Promise<FileResult<void>> {
    try {
      await this.ensureDir(this.tasksDir);

      // 更新 updated 时间戳
      const updatedData: TaskPlan = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getTaskPlanPath();

      await this.atomicWrite(filePath, yamlContent);

      // 渲染 Markdown
      if (options.renderMarkdown !== false) {
        const getProgress = async (projectId: string): Promise<string> => {
          const result = await this.readProjectData(projectId);
          if (result.success) {
            return formatProgressString(result.data.tasks);
          }
          return '?/?';
        };

        // 同步获取所有进度
        const progressMap = new Map<string, string>();
        for (const project of updatedData.projects) {
          const result = await this.readProjectData(project.project_id);
          if (result.success) {
            progressMap.set(project.project_id, formatProgressString(result.data.tasks));
          } else {
            progressMap.set(project.project_id, '?/?');
          }
        }

        const markdown = renderTaskPlan(updatedData, (id) => progressMap.get(id) || '?/?');
        const mdPath = join(this.tasksDir, 'task-plan.md');
        await this.atomicWrite(mdPath, markdown);
      }

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
```

**Step 4: 运行测试确认通过**

Run: `cd mcp-server && npm run test:run -- src/file-manager.test.ts`

Expected: 所有测试通过

**Step 5: 运行所有测试**

Run: `cd mcp-server && npm run test:run`

Expected: 所有测试通过

**Step 6: Commit**

```bash
git add mcp-server/src/file-manager.ts mcp-server/src/file-manager.test.ts
git commit -m "feat(io): 集成 Markdown 渲染到 File Manager

- writeProjectData 自动生成 tasks.md
- writeTaskPlan 自动生成 task-plan.md
- 可通过 renderMarkdown 选项控制"
```

---

## 第三批完成检查点

**完成的模块:**
1. ✅ File Manager
   - readProjectData / readTaskPlan
   - writeProjectData / writeTaskPlan (原子写入)
   - listProjects / projectExists / deleteProject
   - archiveProject / listArchives / restoreArchive
2. ✅ Markdown Renderer
   - renderTaskPlan (项目列表)
   - renderProjectTasks (任务详情)
   - 集成到 File Manager

**验证命令:**

```bash
cd mcp-server && npm run test:run && npm run build
```

Expected: 所有测试通过，编译成功

---

## 下一批预告

第四批将实现 **MCP Server + Plugin**：
- MCP Server 入口和 Tool 注册
- 4 个 MCP Tools 实现
- Plugin Commands

文件: `docs/plans/2026-01-24-superplanners-implementation-batch4.md`
