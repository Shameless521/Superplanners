import { describe, it, expect } from 'vitest';
import { TaskStatusSchema, TaskPrioritySchema } from './types.js';

describe('Types', () => {
  describe('TaskStatus', () => {
    it('should accept valid status values', () => {
      expect(TaskStatusSchema.parse('pending')).toBe('pending');
      expect(TaskStatusSchema.parse('in_progress')).toBe('in_progress');
      expect(TaskStatusSchema.parse('completed')).toBe('completed');
      expect(TaskStatusSchema.parse('blocked')).toBe('blocked');
      expect(TaskStatusSchema.parse('skipped')).toBe('skipped');
    });

    it('should reject invalid status values', () => {
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
      expect(() => TaskStatusSchema.parse('')).toThrow();
    });
  });

  describe('TaskPriority', () => {
    it('should accept valid priority values', () => {
      expect(TaskPrioritySchema.parse('critical')).toBe('critical');
      expect(TaskPrioritySchema.parse('high')).toBe('high');
      expect(TaskPrioritySchema.parse('medium')).toBe('medium');
      expect(TaskPrioritySchema.parse('low')).toBe('low');
    });

    it('should reject invalid priority values', () => {
      expect(() => TaskPrioritySchema.parse('urgent')).toThrow();
    });
  });
});

import { SubTaskSchema, TaskSchema } from './types.js';

describe('SubTask', () => {
  it('should accept valid subtask', () => {
    const subtask = {
      id: '1.1',
      title: '设计接口规范',
      status: 'pending',
    };
    expect(SubTaskSchema.parse(subtask)).toEqual(subtask);
  });

  it('should accept subtask with notes', () => {
    const subtask = {
      id: '1.1',
      title: '设计接口规范',
      status: 'completed',
      notes: '已完成评审',
    };
    expect(SubTaskSchema.parse(subtask)).toEqual(subtask);
  });

  it('should reject subtask without required fields', () => {
    expect(() => SubTaskSchema.parse({ id: '1.1' })).toThrow();
    expect(() => SubTaskSchema.parse({ title: 'test' })).toThrow();
  });
});

describe('Task', () => {
  it('should accept minimal valid task', () => {
    const task = {
      id: '1',
      title: '后端 API 开发',
      status: 'pending',
      priority: 'high',
    };
    expect(TaskSchema.parse(task)).toEqual(task);
  });

  it('should accept full task with all optional fields', () => {
    const task = {
      id: '1',
      title: '后端 API 开发',
      description: '开发登录相关的后端 API',
      status: 'in_progress',
      priority: 'high',
      estimate: '8h',
      actual: '6h',
      dependencies: ['0.1', '0.2'],
      subtasks: [
        { id: '1.1', title: '设计接口', status: 'completed' },
        { id: '1.2', title: '实现逻辑', status: 'in_progress' },
      ],
      notes: '进展顺利',
      started_at: '2025-01-23T10:00:00Z',
      completed_at: undefined,
    };
    const result = TaskSchema.parse(task);
    expect(result.id).toBe('1');
    expect(result.subtasks).toHaveLength(2);
  });
});

import { ProjectMetaSchema, TaskSummarySchema } from './types.js';

describe('ProjectMeta', () => {
  it('should accept valid project meta', () => {
    const meta = {
      project: '用户登录功能',
      project_id: 'user-login',
      created: '2025-01-23T10:00:00Z',
      updated: '2025-01-23T10:30:00Z',
      version: 1,
    };
    expect(ProjectMetaSchema.parse(meta)).toEqual(meta);
  });

  it('should accept project meta with description', () => {
    const meta = {
      project: '用户登录功能',
      project_id: 'user-login',
      created: '2025-01-23T10:00:00Z',
      updated: '2025-01-23T10:30:00Z',
      version: 1,
      description: '开发完整的用户登录功能',
    };
    expect(ProjectMetaSchema.parse(meta)).toEqual(meta);
  });
});

describe('TaskSummary', () => {
  it('should accept valid task summary', () => {
    const summary = {
      total: 12,
      completed: 3,
      in_progress: 1,
      blocked: 0,
      pending: 8,
      skipped: 0,
    };
    expect(TaskSummarySchema.parse(summary)).toEqual(summary);
  });

  it('should reject negative numbers', () => {
    const summary = {
      total: -1,
      completed: 0,
      in_progress: 0,
      blocked: 0,
      pending: 0,
      skipped: 0,
    };
    expect(() => TaskSummarySchema.parse(summary)).toThrow();
  });
});

import { ProjectDataSchema, TaskPlanSchema } from './types.js';

describe('ProjectData', () => {
  it('should accept valid project data (tasks.yaml format)', () => {
    const data = {
      meta: {
        project: '用户登录功能',
        project_id: 'user-login',
        created: '2025-01-23T10:00:00Z',
        updated: '2025-01-23T10:30:00Z',
        version: 1,
      },
      tasks: [
        {
          id: '1',
          title: '后端 API 开发',
          status: 'in_progress',
          priority: 'high',
          subtasks: [
            { id: '1.1', title: '设计接口', status: 'completed' },
          ],
        },
      ],
    };
    const result = ProjectDataSchema.parse(data);
    expect(result.meta.project_id).toBe('user-login');
    expect(result.tasks).toHaveLength(1);
  });
});

describe('TaskPlan', () => {
  it('should accept valid task plan (task-plan.yaml format)', () => {
    const plan = {
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
      ],
    };
    const result = TaskPlanSchema.parse(plan);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].status).toBe('active');
  });
});
