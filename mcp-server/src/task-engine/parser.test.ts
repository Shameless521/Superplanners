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
