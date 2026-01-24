// src/renderer.test.ts
import { describe, it, expect } from 'vitest';
import { renderTaskPlan } from './renderer.js';
import type { TaskPlan } from './types.js';

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
});
