// src/renderer.test.ts
import { describe, it, expect } from 'vitest';
import { renderTaskPlan, renderProjectTasks } from './renderer.js';
import type { TaskPlan, ProjectData } from './types.js';
import { calculateTaskSummary, calculateProgress } from './task-engine/progress-calculator.js';

describe('Renderer', () => {
  describe('renderTaskPlan', () => {
    it('should render task plan to markdown', () => {
      const taskPlan: TaskPlan = {
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
          {
            project_id: 'api-design',
            project: 'API 设计',
            status: 'completed',
            updated: '2025-01-22T15:00:00Z',
            path: 'api-design/tasks.yaml',
          },
        ],
      };

      // 模拟进度计算函数
      const getProgress = (projectId: string) => {
        if (projectId === 'user-login') return '3/12';
        return '8/8';
      };

      const markdown = renderTaskPlan(taskPlan, getProgress);

      expect(markdown).toContain('# SuperPlanners');
      expect(markdown).toContain('用户登录功能');
      expect(markdown).toContain('🔄'); // active 状态图标
      expect(markdown).toContain('3/12');
      expect(markdown).toContain('API 设计');
      expect(markdown).toContain('✅'); // completed 状态图标
    });

    it('should handle empty projects', () => {
      const taskPlan: TaskPlan = {
        meta: {
          name: 'SuperPlanners',
          version: '1.0.0',
          updated: '2025-01-23T10:30:00Z',
        },
        projects: [],
      };

      const markdown = renderTaskPlan(taskPlan, () => '0/0');

      expect(markdown).toContain('# SuperPlanners');
      expect(markdown).toContain('暂无项目');
    });
  });

  describe('renderProjectTasks', () => {
    it('should render project tasks to markdown', () => {
      const projectData: ProjectData = {
        meta: {
          project: '用户登录功能',
          project_id: 'user-login',
          created: '2025-01-23T10:00:00Z',
          updated: '2025-01-23T10:30:00Z',
          version: 1,
          description: '开发完整的用户登录功能',
        },
        tasks: [
          {
            id: '1',
            title: '后端 API 开发',
            status: 'in_progress',
            priority: 'high',
            estimate: '8h',
            subtasks: [
              { id: '1.1', title: '设计接口规范', status: 'completed' },
              { id: '1.2', title: '实现验证逻辑', status: 'in_progress' },
            ],
          },
          {
            id: '2',
            title: '前端开发',
            status: 'pending',
            priority: 'medium',
            dependencies: ['1'],
          },
        ],
      };

      const summary = calculateTaskSummary(projectData.tasks);
      const progress = calculateProgress(projectData.tasks);

      const markdown = renderProjectTasks(projectData, summary, progress);

      expect(markdown).toContain('# 用户登录功能');
      expect(markdown).toContain('开发完整的用户登录功能');
      expect(markdown).toContain('后端 API 开发');
      expect(markdown).toContain('🔄'); // in_progress
      expect(markdown).toContain('✅'); // completed (subtask)
      expect(markdown).toContain('设计接口规范');
      expect(markdown).toContain('前端开发');
      expect(markdown).toContain('**依赖:** 1');
    });

    it('should render progress bar', () => {
      const projectData: ProjectData = {
        meta: {
          project: '测试',
          project_id: 'test',
          created: '2025-01-23T10:00:00Z',
          updated: '2025-01-23T10:00:00Z',
          version: 1,
        },
        tasks: [
          { id: '1', title: '任务1', status: 'completed', priority: 'high' },
          { id: '2', title: '任务2', status: 'pending', priority: 'high' },
        ],
      };

      const summary = calculateTaskSummary(projectData.tasks);
      const progress = calculateProgress(projectData.tasks);

      const markdown = renderProjectTasks(projectData, summary, progress);

      expect(markdown).toContain('50%');
      expect(markdown).toContain('1/2');
    });
  });
});
