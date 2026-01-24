// src/file-manager.ts
import { readFile, writeFile, rename, unlink, access, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from 'node:fs';
import YAML from 'yaml';
import type { ProjectData, TaskPlan } from './types.js';
import { parseProjectData, parseTaskPlan } from './task-engine/parser.js';
import { renderTaskPlan, renderProjectTasks } from './renderer.js';
import { calculateTaskSummary, calculateProgress, formatProgressString } from './task-engine/progress-calculator.js';

export type FileResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ArchiveInfo {
  archiveId: string;
  projectId: string;
  archivedAt: string;
}

export interface WriteOptions {
  renderMarkdown?: boolean;
}

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

  /**
   * 确保目录存在
   */
  async ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  /**
   * 原子写入文件
   * 先写入临时文件，再 rename 到目标路径
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, filePath);
    } catch (e) {
      // 清理临时文件
      try {
        await unlink(tempPath);
      } catch {
        // 忽略清理失败
      }
      throw e;
    }
  }

  /**
   * 写入项目数据
   */
  async writeProjectData(
    projectId: string,
    data: ProjectData,
    options: WriteOptions = {}
  ): Promise<FileResult<void>> {
    try {
      const projectDir = this.getProjectDir(projectId);
      await this.ensureDir(projectDir);

      // 更新 updated 时间戳
      const updatedData: ProjectData = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getProjectYamlPath(projectId);

      await this.atomicWrite(filePath, yamlContent);

      // 渲染 Markdown
      if (options.renderMarkdown !== false) {
        const summary = calculateTaskSummary(updatedData.tasks);
        const progress = calculateProgress(updatedData.tasks);
        const markdown = renderProjectTasks(updatedData, summary, progress);
        const mdPath = join(projectDir, 'tasks.md');
        await this.atomicWrite(mdPath, markdown);
      }

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 写入任务计划索引
   */
  async writeTaskPlan(
    data: TaskPlan,
    options: WriteOptions = {}
  ): Promise<FileResult<void>> {
    try {
      await this.ensureDir(this.tasksDir);

      // 更新 updated 时间戳
      const updatedData: TaskPlan = {
        ...data,
        meta: {
          ...data.meta,
          updated: new Date().toISOString(),
        },
      };

      const yamlContent = YAML.stringify(updatedData);
      const filePath = this.getTaskPlanPath();

      await this.atomicWrite(filePath, yamlContent);

      // 渲染 Markdown
      if (options.renderMarkdown !== false) {
        // 同步获取所有进度
        const progressMap = new Map<string, string>();
        for (const project of updatedData.projects) {
          const result = await this.readProjectData(project.project_id);
          if (result.success) {
            progressMap.set(project.project_id, formatProgressString(result.data.tasks));
          } else {
            progressMap.set(project.project_id, '?/?');
          }
        }

        const markdown = renderTaskPlan(updatedData, (id) => progressMap.get(id) || '?/?');
        const mdPath = join(this.tasksDir, 'task-plan.md');
        await this.atomicWrite(mdPath, markdown);
      }

      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `写入失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 列出所有项目
   */
  async listProjects(): Promise<string[]> {
    if (!(await this.fileExists(this.tasksDir))) {
      return [];
    }

    try {
      const entries = await readdir(this.tasksDir, { withFileTypes: true });
      const projects: string[] = [];

      for (const entry of entries) {
        // 跳过文件和特殊目录
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;

        // 检查是否有 tasks.yaml
        const yamlPath = join(this.tasksDir, entry.name, 'tasks.yaml');
        if (await this.fileExists(yamlPath)) {
          projects.push(entry.name);
        }
      }

      return projects;
    } catch {
      return [];
    }
  }

  /**
   * 检查项目是否存在
   */
  async projectExists(projectId: string): Promise<boolean> {
    const yamlPath = this.getProjectYamlPath(projectId);
    return this.fileExists(yamlPath);
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<FileResult<void>> {
    const projectDir = this.getProjectDir(projectId);

    if (!(await this.projectExists(projectId))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      await rm(projectDir, { recursive: true });
      return { success: true, data: undefined };
    } catch (e) {
      return {
        success: false,
        error: `删除失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 获取归档目录路径
   */
  private getArchiveDir(): string {
    return join(this.tasksDir, '.archive');
  }

  /**
   * 生成归档 ID
   */
  private generateArchiveId(projectId: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    return `${timestamp}-${projectId}`;
  }

  /**
   * 归档项目
   */
  async archiveProject(
    projectId: string
  ): Promise<FileResult<{ archiveId: string }>> {
    if (!(await this.projectExists(projectId))) {
      return { success: false, error: `项目 ${projectId} 不存在` };
    }

    try {
      const archiveDir = this.getArchiveDir();
      await this.ensureDir(archiveDir);

      const archiveId = this.generateArchiveId(projectId);
      const archivePath = join(archiveDir, archiveId);
      const projectDir = this.getProjectDir(projectId);

      // 移动项目到归档目录
      await rename(projectDir, archivePath);

      return { success: true, data: { archiveId } };
    } catch (e) {
      return {
        success: false,
        error: `归档失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * 列出所有归档
   */
  async listArchives(): Promise<ArchiveInfo[]> {
    const archiveDir = this.getArchiveDir();

    if (!(await this.fileExists(archiveDir))) {
      return [];
    }

    try {
      const entries = await readdir(archiveDir, { withFileTypes: true });
      const archives: ArchiveInfo[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // 解析归档 ID: YYYYMMDDHHMMSS-project-id
        const match = entry.name.match(/^(\d{14})-(.+)$/);
        if (match) {
          const [, timestamp, projectId] = match;
          const year = timestamp.slice(0, 4);
          const month = timestamp.slice(4, 6);
          const day = timestamp.slice(6, 8);
          const hour = timestamp.slice(8, 10);
          const min = timestamp.slice(10, 12);
          const sec = timestamp.slice(12, 14);

          archives.push({
            archiveId: entry.name,
            projectId,
            archivedAt: `${year}-${month}-${day}T${hour}:${min}:${sec}Z`,
          });
        }
      }

      // 按时间倒序
      archives.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

      return archives;
    } catch {
      return [];
    }
  }

  /**
   * 恢复归档
   */
  async restoreArchive(archiveId: string): Promise<FileResult<{ projectId: string }>> {
    const archiveDir = this.getArchiveDir();
    const archivePath = join(archiveDir, archiveId);

    if (!(await this.fileExists(archivePath))) {
      return { success: false, error: `归档 ${archiveId} 不存在` };
    }

    // 解析 project ID
    const match = archiveId.match(/^\d{14}-(.+)$/);
    if (!match) {
      return { success: false, error: `无效的归档 ID: ${archiveId}` };
    }
    const projectId = match[1];

    // 检查项目是否已存在
    if (await this.projectExists(projectId)) {
      return { success: false, error: `项目 ${projectId} 已存在，无法恢复` };
    }

    try {
      const projectDir = this.getProjectDir(projectId);
      await rename(archivePath, projectDir);

      return { success: true, data: { projectId } };
    } catch (e) {
      return {
        success: false,
        error: `恢复失败: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}
