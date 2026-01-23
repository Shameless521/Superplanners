import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  detectCircularDependency,
  getTaskDependencies,
} from './dependency-resolver.js';
import type { Task } from '../types.js';

describe('Dependency Resolver', () => {
  describe('buildDependencyGraph', () => {
    it('should build dependency graph from tasks', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
        {
          id: '3',
          title: '任务3',
          status: 'pending',
          priority: 'high',
          dependencies: ['1', '2'],
        },
      ];

      const graph = buildDependencyGraph(tasks);
      expect(graph.get('1')).toEqual([]);
      expect(graph.get('2')).toEqual(['1']);
      expect(graph.get('3')).toEqual(['1', '2']);
    });
  });

  describe('detectCircularDependency', () => {
    it('should detect circular dependency', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: '任务1',
          status: 'pending',
          priority: 'high',
          dependencies: ['3'],
        },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
        {
          id: '3',
          title: '任务3',
          status: 'pending',
          priority: 'high',
          dependencies: ['2'],
        },
      ];

      const result = detectCircularDependency(tasks);
      expect(result.hasCircle).toBe(true);
      expect(result.cycle).toBeDefined();
    });

    it('should return no circle for valid dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const result = detectCircularDependency(tasks);
      expect(result.hasCircle).toBe(false);
    });
  });

  describe('getTaskDependencies', () => {
    it('should return task dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
        {
          id: '2',
          title: '任务2',
          status: 'pending',
          priority: 'high',
          dependencies: ['1'],
        },
      ];

      const deps = getTaskDependencies(tasks, '2');
      expect(deps).toEqual(['1']);
    });

    it('should return empty array for task without dependencies', () => {
      const tasks: Task[] = [
        { id: '1', title: '任务1', status: 'pending', priority: 'high' },
      ];

      const deps = getTaskDependencies(tasks, '1');
      expect(deps).toEqual([]);
    });
  });
});

import { areDependenciesMet, getUnmetDependencies } from './dependency-resolver.js';

describe('Dependency Completion Check', () => {
  const tasks: Task[] = [
    { id: '1', title: '任务1', status: 'completed', priority: 'high' },
    { id: '2', title: '任务2', status: 'in_progress', priority: 'high' },
    {
      id: '3',
      title: '任务3',
      status: 'pending',
      priority: 'high',
      dependencies: ['1'],
    },
    {
      id: '4',
      title: '任务4',
      status: 'pending',
      priority: 'high',
      dependencies: ['1', '2'],
    },
  ];

  describe('areDependenciesMet', () => {
    it('should return true when all dependencies completed', () => {
      expect(areDependenciesMet(tasks, '3')).toBe(true);
    });

    it('should return false when some dependencies not completed', () => {
      expect(areDependenciesMet(tasks, '4')).toBe(false);
    });

    it('should return true for task without dependencies', () => {
      expect(areDependenciesMet(tasks, '1')).toBe(true);
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return empty array when all met', () => {
      expect(getUnmetDependencies(tasks, '3')).toEqual([]);
    });

    it('should return unmet dependency IDs', () => {
      const unmet = getUnmetDependencies(tasks, '4');
      expect(unmet).toEqual(['2']);
    });
  });
});
