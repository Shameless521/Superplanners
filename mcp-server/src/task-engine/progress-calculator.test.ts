import { describe, it, expect } from 'vitest';
import { calculateTaskSummary, calculateProgress } from './progress-calculator.js';
import type { Task } from '../types.js';

describe('Progress Calculator', () => {
  describe('calculateTaskSummary', () => {
    it('should calculate summary for tasks with subtasks', () => {
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
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
        { id: '3', title: '任务3', status: 'blocked', priority: 'low' },
      ];

      const summary = calculateTaskSummary(tasks);

      expect(summary.total).toBe(5);
      expect(summary.completed).toBe(2);
      expect(summary.in_progress).toBe(1);
      expect(summary.blocked).toBe(1);
      expect(summary.pending).toBe(1);
      expect(summary.skipped).toBe(0);
    });

    it('should handle empty tasks', () => {
      const summary = calculateTaskSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.completed).toBe(0);
    });

    it('should handle tasks without subtasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'pending', priority: 'medium' },
      ];

      const summary = calculateTaskSummary(tasks);

      expect(summary.total).toBe(2);
      expect(summary.completed).toBe(1);
      expect(summary.pending).toBe(1);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress percentage', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
        { id: '3', title: '任务3', status: 'pending', priority: 'low' },
        { id: '4', title: '任务4', status: 'pending', priority: 'low' },
      ];

      const progress = calculateProgress(tasks);

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(50);
    });

    it('should handle zero tasks', () => {
      const progress = calculateProgress([]);

      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });
});
