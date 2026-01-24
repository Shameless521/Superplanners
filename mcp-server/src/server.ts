// mcp-server/src/server.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileManager } from './file-manager.js';
import { StatusInputSchema, UpdateInputSchema, ResetInputSchema } from './types.js';
import { updateTaskStatusWithValidation } from './task-engine/status-reducer.js';
import {
  calculateTaskSummary,
  calculateProgress,
  formatProgressString,
} from './task-engine/progress-calculator.js';
import { selectNextTask } from './task-engine/next-task-selector.js';

// 工具定义
export const TOOLS: Tool[] = [
  {
    name: 'superplanners_plan',
    description: '根据需求创建结构化任务计划',
    inputSchema: {
      type: 'object',
      properties: {
        requirement: {
          type: 'string',
          description: '需求描述，用于分解成任务',
        },
        project_name: {
          type: 'string',
          description: '项目名称，默认从需求推断',
        },
      },
      required: ['requirement'],
    },
  },
  {
    name: 'superplanners_status',
    description: '查看任务状态和整体进度',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID，不填则显示全部项目',
        },
      },
    },
  },
  {
    name: 'superplanners_update',
    description: '更新任务状态',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID',
        },
        task_id: {
          type: 'string',
          description: '任务ID',
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'blocked', 'skipped'],
          description: '新状态',
        },
        notes: {
          type: 'string',
          description: '备注',
        },
      },
      required: ['project_id', 'task_id', 'status'],
    },
  },
  {
    name: 'superplanners_reset',
    description: '归档清理或恢复历史任务',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['cleanup', 'list', 'restore'],
          description: '操作类型',
        },
        project_id: {
          type: 'string',
          description: 'cleanup 时可选的项目ID',
        },
        archive_id: {
          type: 'string',
          description: 'restore 时必填的归档ID',
        },
      },
      required: ['action'],
    },
  },
];

// 工具处理器类型
export type ToolHandler = (args: unknown) => Promise<unknown>;
export type ToolHandlers = Record<string, ToolHandler>;

// 创建工具处理器
export function createToolHandlers(baseDir: string): ToolHandlers {
  const fm = new FileManager(baseDir);

  return {
    superplanners_plan: async (args) => handlePlan(fm, args),
    superplanners_status: async (args) => handleStatus(fm, args),
    superplanners_update: async (args) => handleUpdate(fm, args),
    superplanners_reset: async (args) => handleReset(fm, args),
  };
}

// 占位处理器（将在后续任务中实现）
async function handlePlan(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}

async function handleStatus(fm: FileManager, args: unknown): Promise<unknown> {
  const input = StatusInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { project_id } = input.data;

  // 项目视图
  if (project_id) {
    const result = await fm.readProjectData(project_id);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const { meta, tasks } = result.data;
    const summary = calculateTaskSummary(tasks);
    const progress = calculateProgress(tasks);
    const nextTask = selectNextTask(tasks);

    // 找到当前进行中的任务
    const currentTask = tasks.find((t) => t.status === 'in_progress');

    return {
      success: true,
      project: {
        id: meta.project_id,
        name: meta.project,
        description: meta.description,
        updated: meta.updated,
      },
      summary,
      progress,
      current_task: currentTask
        ? { id: currentTask.id, title: currentTask.title }
        : null,
      tasks,
    };
  }

  // 全局视图
  const taskPlanResult = await fm.readTaskPlan();

  if (!taskPlanResult.success) {
    return { success: false, error: taskPlanResult.error };
  }

  // 如果没有 task-plan.yaml，返回空列表
  if (!taskPlanResult.data) {
    return {
      success: true,
      total_projects: 0,
      projects: [],
    };
  }

  const projects = [];
  for (const entry of taskPlanResult.data.projects) {
    const projectResult = await fm.readProjectData(entry.project_id);
    let progress = '?/?';

    if (projectResult.success) {
      progress = formatProgressString(projectResult.data.tasks);
    }

    projects.push({
      id: entry.project_id,
      name: entry.project,
      status: entry.status,
      progress,
      updated: entry.updated,
    });
  }

  return {
    success: true,
    total_projects: projects.length,
    projects,
  };
}

async function handleUpdate(fm: FileManager, args: unknown): Promise<unknown> {
  const input = UpdateInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { project_id, task_id, status, notes } = input.data;

  // 读取项目数据
  const readResult = await fm.readProjectData(project_id);
  if (!readResult.success) {
    return { success: false, error: readResult.error };
  }

  const projectData = readResult.data;

  // 执行状态更新（带校验）
  const updateResult = updateTaskStatusWithValidation(
    projectData.tasks,
    task_id,
    status,
    notes
  );

  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  // 更新数据
  const updatedData = {
    ...projectData,
    tasks: updateResult.tasks,
  };

  // 写回文件
  const writeResult = await fm.writeProjectData(project_id, updatedData);
  if (!writeResult.success) {
    return { success: false, error: writeResult.error };
  }

  // 计算返回值
  const summary = calculateTaskSummary(updateResult.tasks);
  const progress = calculateProgress(updateResult.tasks);
  const nextTask = selectNextTask(updateResult.tasks);

  return {
    success: true,
    updated: {
      task_id,
      status,
      notes,
    },
    summary,
    progress,
    next_task: nextTask,
  };
}

async function handleReset(fm: FileManager, args: unknown): Promise<unknown> {
  const input = ResetInputSchema.safeParse(args);
  if (!input.success) {
    return { success: false, error: `参数错误: ${input.error.message}` };
  }

  const { action, project_id, archive_id } = input.data;

  switch (action) {
    case 'cleanup': {
      if (project_id) {
        // 归档指定项目
        const result = await fm.archiveProject(project_id);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return {
          success: true,
          action: 'cleanup',
          archived_count: 1,
          archived: [result.data.archiveId],
        };
      } else {
        // 归档所有已完成项目
        const projects = await fm.listProjects();
        const archived: string[] = [];

        for (const pid of projects) {
          const readResult = await fm.readProjectData(pid);
          if (!readResult.success) continue;

          // 检查是否所有任务都完成
          const allCompleted = readResult.data.tasks.every(
            (t) => t.status === 'completed' || t.status === 'skipped'
          );

          if (allCompleted) {
            const archiveResult = await fm.archiveProject(pid);
            if (archiveResult.success) {
              archived.push(archiveResult.data.archiveId);
            }
          }
        }

        return {
          success: true,
          action: 'cleanup',
          archived_count: archived.length,
          archived,
        };
      }
    }

    case 'list': {
      const archives = await fm.listArchives();
      return {
        success: true,
        action: 'list',
        total: archives.length,
        archives: archives.map((a) => ({
          archive_id: a.archiveId,
          project_id: a.projectId,
          archived_at: a.archivedAt,
        })),
      };
    }

    case 'restore': {
      if (!archive_id) {
        return { success: false, error: 'restore 操作需要提供 archive_id' };
      }

      const result = await fm.restoreArchive(archive_id);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        action: 'restore',
        restored_project_id: result.data.projectId,
        from_archive: archive_id,
      };
    }

    default:
      return { success: false, error: `未知操作: ${action}` };
  }
}
