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
});
