import { describe, it, expect } from 'vitest';
import { parseProjectData, parseTaskPlan } from './parser.js';

const validProjectYaml = `
meta:
  project: 用户登录功能
  project_id: user-login
  created: "2025-01-23T10:00:00Z"
  updated: "2025-01-23T10:30:00Z"
  version: 1

tasks:
  - id: "1"
    title: 后端API开发
    status: in_progress
    priority: high
    subtasks:
      - id: "1.1"
        title: 设计接口规范
        status: completed
      - id: "1.2"
        title: 实现验证逻辑
        status: pending
  - id: "2"
    title: 前端开发
    status: pending
    priority: medium
    dependencies:
      - "1"
`;

const validTaskPlanYaml = `
meta:
  name: SuperPlanners
  version: "1.0.0"
  updated: "2025-01-23T10:30:00Z"

projects:
  - project_id: user-login
    project: 用户登录功能
    status: active
    updated: "2025-01-23T10:30:00Z"
    path: user-login/tasks.yaml
`;

describe('Parser', () => {
  describe('parseProjectData', () => {
    it('should parse valid project YAML', () => {
      const result = parseProjectData(validProjectYaml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.project_id).toBe('user-login');
        expect(result.data.tasks).toHaveLength(2);
        expect(result.data.tasks[0].subtasks).toHaveLength(2);
      }
    });

    it('should return error for invalid YAML', () => {
      const result = parseProjectData('invalid: yaml: syntax:');
      expect(result.success).toBe(false);
    });

    it('should return error for missing required fields', () => {
      const result = parseProjectData(`
meta:
  project: test
tasks: []
`);
      expect(result.success).toBe(false);
    });
  });

  describe('parseTaskPlan', () => {
    it('should parse valid task plan YAML', () => {
      const result = parseTaskPlan(validTaskPlanYaml);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projects).toHaveLength(1);
        expect(result.data.projects[0].project_id).toBe('user-login');
      }
    });
  });
});

import { findTaskById, traverseTasks, getAllTasks } from './parser.js';
import type { Task, SubTask } from '../types.js';

describe('Task Lookup', () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: '任务1',
      status: 'in_progress',
      priority: 'high',
      subtasks: [
        { id: '1.1', title: '子任务1.1', status: 'completed' },
        { id: '1.2', title: '子任务1.2', status: 'pending' },
      ],
    },
    {
      id: '2',
      title: '任务2',
      status: 'pending',
      priority: 'medium',
    },
  ];

  describe('findTaskById', () => {
    it('should find top-level task', () => {
      const result = findTaskById(tasks, '1');
      expect(result).not.toBeNull();
      expect(result?.task.title).toBe('任务1');
      expect(result?.isSubtask).toBe(false);
    });

    it('should find subtask', () => {
      const result = findTaskById(tasks, '1.1');
      expect(result).not.toBeNull();
      expect(result?.task.title).toBe('子任务1.1');
      expect(result?.isSubtask).toBe(true);
      expect(result?.parentId).toBe('1');
    });

    it('should return null for non-existent task', () => {
      const result = findTaskById(tasks, '999');
      expect(result).toBeNull();
    });
  });

  describe('traverseTasks', () => {
    it('should visit all tasks including subtasks', () => {
      const visited: string[] = [];
      traverseTasks(tasks, (task) => {
        visited.push(task.id);
      });
      expect(visited).toEqual(['1', '1.1', '1.2', '2']);
    });
  });

  describe('getAllTasks', () => {
    it('should return flat list of all tasks', () => {
      const all = getAllTasks(tasks);
      expect(all).toHaveLength(4);
      expect(all.map((t) => t.id)).toEqual(['1', '1.1', '1.2', '2']);
    });
  });
});
