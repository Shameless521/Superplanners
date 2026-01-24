// src/file-manager.test.ts
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
