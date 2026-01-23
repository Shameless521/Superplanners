import { describe, it, expect } from 'vitest';
import { selectNextTask, getNextTaskReason } from './next-task-selector.js';
import type { Task } from '../types.js';

describe('Next Task Selector', () => {
  describe('selectNextTask', () => {
    it('should select pending task with met dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const next = selectNextTask(tasks);
      expect(next).not.toBeNull();
      expect(next?.id).toBe('2');
    });

    it('should NOT select task with unmet dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'in_progress', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const next = selectNextTask(tasks);
      expect(next).toBeNull();
    });

    it('should prioritize by priority: critical > high > medium > low', () => {
      const tasks: Task[] = [
        { id: '1', title: '低优先级', status: 'pending', priority: 'low' },
        { id: '2', title: '中优先级', status: 'pending', priority: 'medium' },
        { id: '3', title: '紧急', status: 'pending', priority: 'critical' },
        { id: '4', title: '高优先级', status: 'pending', priority: 'high' },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('3');
    });

    it('should prioritize by estimate when priority is same', () => {
      const tasks: Task[] = [
        { id: '1', title: '长任务', status: 'pending', priority: 'high', estimate: '8h' },
        { id: '2', title: '短任务', status: 'pending', priority: 'high', estimate: '1h' },
        { id: '3', title: '中任务', status: 'pending', priority: 'high', estimate: '4h' },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('2');
    });

    it('should return null when all tasks completed', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
        { id: '2', title: '任务2', status: 'completed', priority: 'medium' },
      ];

      const next = selectNextTask(tasks);
      expect(next).toBeNull();
    });

    it('should skip blocked and in_progress tasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '进行中', status: 'in_progress', priority: 'critical' },
        { id: '2', title: '阻塞', status: 'blocked', priority: 'critical' },
        { id: '3', title: '待开始', status: 'pending', priority: 'low' },
      ];

      const next = selectNextTask(tasks);
      expect(next?.id).toBe('3');
    });
  });

  describe('getNextTaskReason', () => {
    it('should return reason when all completed', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'completed', priority: 'high' },
      ];

      const reason = getNextTaskReason(tasks);
      expect(reason).toContain('已完成');
    });

    it('should return reason when blocked by dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'in_progress', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const reason = getNextTaskReason(tasks);
      expect(reason).toContain('依赖');
    });
  });
});
