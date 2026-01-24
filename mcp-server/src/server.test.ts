import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createToolHandlers } from './server.js';

describe('MCP Tools', () => {
  let testDir: string;
  let handlers: ReturnType<typeof createToolHandlers>;

  beforeEach(async () => {
    testDir = join(tmpdir(), `superplanners-mcp-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    handlers = createToolHandlers(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('superplanners_status', () => {
    it('should return empty project list when no projects', async () => {
      const result = await handlers.superplanners_status({});

      expect(result).toMatchObject({
        success: true,
        total_projects: 0,
        projects: [],
      });
    });

    it('should return project list with progress', async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
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
    status: completed
    priority: high
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
      );

      // 创建 task-plan.yaml
      await writeFile(
        join(testDir, 'tasks', 'task-plan.yaml'),
        `
meta:
  name: SuperPlanners
  version: "1.0.0"
  updated: "2025-01-23T10:00:00Z"

projects:
  - project_id: test-project
    project: 测试项目
    status: active
    updated: "2025-01-23T10:00:00Z"
    path: test-project/tasks.yaml
`
      );

      const result = await handlers.superplanners_status({});

      expect(result).toMatchObject({
        success: true,
        total_projects: 1,
      });
    });

    it('should return project detail when project_id provided', async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
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
    status: completed
    priority: high
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
      );

      const result = (await handlers.superplanners_status({
        project_id: 'test-project',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.project.id).toBe('test-project');
      expect(result.summary.total).toBe(2);
      expect(result.summary.completed).toBe(1);
      expect(result.tasks).toHaveLength(2);
    });
  });

  describe('superplanners_update', () => {
    beforeEach(async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
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
  - id: "2"
    title: 任务2
    status: pending
    priority: medium
`
      );
    });

    it('should update task status', async () => {
      const result = (await handlers.superplanners_update({
        project_id: 'test-project',
        task_id: '1',
        status: 'in_progress',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.updated.task_id).toBe('1');
      expect(result.updated.status).toBe('in_progress');
      expect(result.summary.in_progress).toBe(1);
    });

    it('should update task with notes', async () => {
      const result = (await handlers.superplanners_update({
        project_id: 'test-project',
        task_id: '1',
        status: 'blocked',
        notes: '等待设计稿',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.updated.notes).toBe('等待设计稿');
    });

    it('should reject invalid status transition', async () => {
      // 先完成任务
      await handlers.superplanners_update({
        project_id: 'test-project',
        task_id: '1',
        status: 'completed',
      });

      // 尝试将 completed 改回 pending
      const result = (await handlers.superplanners_update({
        project_id: 'test-project',
        task_id: '1',
        status: 'pending',
      })) as any;

      expect(result.success).toBe(false);
      expect(result.error).toContain('不允许');
    });

    it('should return error for non-existent project', async () => {
      const result = (await handlers.superplanners_update({
        project_id: 'non-existent',
        task_id: '1',
        status: 'completed',
      })) as any;

      expect(result.success).toBe(false);
    });
  });

  describe('superplanners_reset', () => {
    beforeEach(async () => {
      // 创建测试项目
      const tasksDir = join(testDir, 'tasks', 'test-project');
      await mkdir(tasksDir, { recursive: true });
      await writeFile(
        join(tasksDir, 'tasks.yaml'),
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
    status: completed
    priority: high
`
      );
    });

    describe('cleanup action', () => {
      it('should archive specified project', async () => {
        const result = (await handlers.superplanners_reset({
          action: 'cleanup',
          project_id: 'test-project',
        })) as any;

        expect(result.success).toBe(true);
        expect(result.action).toBe('cleanup');
        expect(result.archived_count).toBe(1);
        expect(result.archived).toHaveLength(1);
      });
    });

    describe('list action', () => {
      it('should list archives', async () => {
        // 先归档
        await handlers.superplanners_reset({
          action: 'cleanup',
          project_id: 'test-project',
        });

        const result = (await handlers.superplanners_reset({
          action: 'list',
        })) as any;

        expect(result.success).toBe(true);
        expect(result.action).toBe('list');
        expect(result.archives.length).toBeGreaterThan(0);
      });
    });

    describe('restore action', () => {
      it('should restore archived project', async () => {
        // 先归档
        const archiveResult = (await handlers.superplanners_reset({
          action: 'cleanup',
          project_id: 'test-project',
        })) as any;

        const archiveId = archiveResult.archived[0];

        // 恢复
        const result = (await handlers.superplanners_reset({
          action: 'restore',
          archive_id: archiveId,
        })) as any;

        expect(result.success).toBe(true);
        expect(result.action).toBe('restore');
        expect(result.restored_project_id).toBe('test-project');
      });
    });
  });

  describe('superplanners_plan', () => {
    it('should create project with tasks', async () => {
      const result = (await handlers.superplanners_plan({
        requirement: '开发用户登录功能，包括前后端',
        project_name: '用户登录功能',
      })) as any;

      expect(result.success).toBe(true);
      expect(result.project_id).toBeDefined();
      expect(result.project_name).toBe('用户登录功能');
      expect(result.files.project_yaml).toContain('tasks.yaml');
    });

    it('should generate project_id from project_name', async () => {
      const result = (await handlers.superplanners_plan({
        requirement: '测试需求',
        project_name: '中文项目名称',
      })) as any;

      expect(result.success).toBe(true);
      // project_id 应该是 slug 格式
      expect(result.project_id).toMatch(/^[a-z0-9-]+$/);
    });

    it('should create task-plan.yaml if not exists', async () => {
      await handlers.superplanners_plan({
        requirement: '测试需求',
        project_name: '测试项目',
      });

      const taskPlan = await handlers.superplanners_status({});
      expect((taskPlan as any).total_projects).toBeGreaterThan(0);
    });
  });
});
