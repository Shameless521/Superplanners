import YAML from 'yaml';
import {
  ProjectData,
  ProjectDataSchema,
  TaskPlan,
  TaskPlanSchema,
} from '../types.js';

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseProjectData(yamlContent: string): ParseResult<ProjectData> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = ProjectDataSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Schema 校验失败: ' + result.error.message,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: 'YAML 解析失败: ' + (e instanceof Error ? e.message : String(e)),
    };
  }
}

export function parseTaskPlan(yamlContent: string): ParseResult<TaskPlan> {
  try {
    const parsed = YAML.parse(yamlContent);
    const result = TaskPlanSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Schema 校验失败: ' + result.error.message,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: 'YAML 解析失败: ' + (e instanceof Error ? e.message : String(e)),
    };
  }
}
