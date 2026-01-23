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
