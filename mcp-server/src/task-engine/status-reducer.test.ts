import { describe, it, expect } from 'vitest';
import { updateTaskStatus } from './status-reducer.js';
import type { Task } from '../types.js';

describe('Status Reducer', () => {
  const createTasks = (): Task[] => [
    {
      id: '1',
      title: '任务1',
      status: 'pending',
      priority: 'high',
      subtasks: [
        { id: '1.1', title: '子任务1.1', status: 'pending' },
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

  describe('updateTaskStatus', () => {
    it('should update top-level task status', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '1', 'in_progress');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[0].status).toBe('in_progress');
        expect(result.tasks[0].started_at).toBeDefined();
        expect(tasks[0].status).toBe('pending');
      }
    });

    it('should update subtask status', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '1.1', 'completed');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[0].subtasks![0].status).toBe('completed');
      }
    });

    it('should set completed_at when status is completed', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '2', 'completed');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tasks[1].completed_at).toBeDefined();
      }
    });

    it('should return error for non-existent task', () => {
      const tasks = createTasks();
      const result = updateTaskStatus(tasks, '999', 'completed');

      expect(result.success).toBe(false);
    });

    it('should be immutable - not modify original array', () => {
      const tasks = createTasks();
      const originalTask = tasks[0];

      updateTaskStatus(tasks, '1', 'in_progress');

      expect(tasks[0]).toBe(originalTask);
      expect(tasks[0].status).toBe('pending');
    });
  });
});

import { validateStatusTransition, updateTaskStatusWithValidation } from './status-reducer.js';

describe('Status Transition Validation', () => {
  describe('validateStatusTransition', () => {
    it('should allow pending -> in_progress', () => {
      expect(validateStatusTransition('pending', 'in_progress').valid).toBe(true);
    });

    it('should allow pending -> completed (fast track)', () => {
      expect(validateStatusTransition('pending', 'completed').valid).toBe(true);
    });

    it('should allow in_progress -> completed', () => {
      expect(validateStatusTransition('in_progress', 'completed').valid).toBe(true);
    });

    it('should allow in_progress -> blocked', () => {
      expect(validateStatusTransition('in_progress', 'blocked').valid).toBe(true);
    });

    it('should allow blocked -> in_progress', () => {
      expect(validateStatusTransition('blocked', 'in_progress').valid).toBe(true);
    });

    it('should NOT allow completed -> pending', () => {
      const result = validateStatusTransition('completed', 'pending');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should NOT allow completed -> in_progress', () => {
      const result = validateStatusTransition('completed', 'in_progress');
      expect(result.valid).toBe(false);
    });

    it('should allow same status (no-op)', () => {
      expect(validateStatusTransition('pending', 'pending').valid).toBe(true);
    });
  });

  describe('updateTaskStatusWithValidation', () => {
    const createTasks = (): Task[] => [
      {
        id: '1',
        title: '任务1',
        status: 'completed',
        priority: 'high',
      },
    ];

    it('should reject invalid transition', () => {
      const tasks = createTasks();
      const result = updateTaskStatusWithValidation(tasks, '1', 'pending');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('不允许');
      }
    });
  });
});
