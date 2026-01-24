// mcp-server/src/server.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileManager } from './file-manager.js';

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
  return { success: false, error: '尚未实现' };
}

async function handleUpdate(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}

async function handleReset(fm: FileManager, args: unknown): Promise<unknown> {
  return { success: false, error: '尚未实现' };
}
