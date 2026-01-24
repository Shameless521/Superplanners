// src/file-manager.ts
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from 'node:fs';
import type { ProjectData, TaskPlan } from './types.js';
import { parseProjectData, parseTaskPlan } from './task-engine/parser.js';

export type FileResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export class FileManager {
  private baseDir: string;
  private tasksDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.tasksDir = join(baseDir, 'tasks');
  }

  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取项目目录路径
   */
  getProjectDir(projectId: string): string {
    return join(this.tasksDir, projectId);
  }

  /**
   * 获取项目 YAML 文件路径
   */
  getProjectYamlPath(projectId: string): string {
    return join(this.getProjectDir(projectId), 'tasks.yaml');
  }

  /**
   * 获取任务计划索引路径
   */
  getTaskPlanPath(): string {
    return join(this.tasksDir, 'task-plan.yaml');
  }

  /**
   * 读取项目数据
   */
  async readProjectData(projectId: string): Promise<FileResult<ProjectData>> {
    const filePath = this.getProjectYamlPath(projectId);

    if (!(await this.fileExists(filePath))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const result = parseProjectData(content);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (e) {
      return {
        success: false,
        error: `读取文件失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 读取任务计划索引
   */
  async readTaskPlan(): Promise<FileResult<TaskPlan | null>> {
    const filePath = this.getTaskPlanPath();

    if (!(await this.fileExists(filePath))) {
      return { success: true, data: null };
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const result = parseTaskPlan(content);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (e) {
      return {
        success: false,
        error: `读取文件失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}
