import { z } from 'zod';

// ============================================
// 基础枚举类型
// ============================================

/**
 * 任务状态
 * - pending: 待开始
 * - in_progress: 进行中
 * - completed: 已完成
 * - blocked: 阻塞中
 * - skipped: 已跳过
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * 任务优先级
 * - critical: 紧急
 * - high: 高
 * - medium: 中
 * - low: 低
 */
export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// ============================================
// SubTask 数据结构
// ============================================

export const SubTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema,
  notes: z.string().optional(),
});
export type SubTask = z.infer<typeof SubTaskSchema>;

// ============================================
// Task 数据结构
// ============================================

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  estimate: z.string().optional(),
  actual: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  subtasks: z.array(SubTaskSchema).optional(),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// ============================================
// ProjectMeta 数据结构
// ============================================

export const ProjectMetaSchema = z.object({
  project: z.string().min(1),
  project_id: z.string().min(1),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  version: z.number().int().positive(),
  description: z.string().optional(),
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

// ============================================
// TaskSummary 数据结构（实时计算，不存储）
// ============================================

export const TaskSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  in_progress: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export type TaskSummary = z.infer<typeof TaskSummarySchema>;

// ============================================
// ProjectData 完整数据结构 (tasks.yaml)
// ============================================

export const ProjectDataSchema = z.object({
  meta: ProjectMetaSchema,
  tasks: z.array(TaskSchema),
});
export type ProjectData = z.infer<typeof ProjectDataSchema>;

// ============================================
// TaskPlan 索引数据结构 (task-plan.yaml)
// ============================================

export const ProjectStatusSchema = z.enum(['active', 'completed']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectEntrySchema = z.object({
  project_id: z.string().min(1),
  project: z.string().min(1),
  status: ProjectStatusSchema,
  updated: z.string().datetime(),
  path: z.string().min(1),
});
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

export const TaskPlanMetaSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  updated: z.string().datetime(),
});
export type TaskPlanMeta = z.infer<typeof TaskPlanMetaSchema>;

export const TaskPlanSchema = z.object({
  meta: TaskPlanMetaSchema,
  projects: z.array(ProjectEntrySchema),
});
export type TaskPlan = z.infer<typeof TaskPlanSchema>;

// ============================================
// MCP Tool Input Schemas
// ============================================

// superplanners_plan 输入
export const PlanInputSchema = z.object({
  requirement: z.string().min(1),
  project_name: z.string().optional(),
});
export type PlanInput = z.infer<typeof PlanInputSchema>;

// superplanners_status 输入
export const StatusInputSchema = z.object({
  project_id: z.string().optional(),
});
export type StatusInput = z.infer<typeof StatusInputSchema>;

// superplanners_update 输入
export const UpdateInputSchema = z.object({
  project_id: z.string().min(1),
  task_id: z.string().min(1),
  status: TaskStatusSchema,
  notes: z.string().optional(),
});
export type UpdateInput = z.infer<typeof UpdateInputSchema>;

// superplanners_reset 输入
export const ResetActionSchema = z.enum(['cleanup', 'list', 'restore']);
export type ResetAction = z.infer<typeof ResetActionSchema>;

export const ResetInputSchema = z.object({
  action: ResetActionSchema,
  project_id: z.string().optional(),
  archive_id: z.string().optional(),
});
export type ResetInput = z.infer<typeof ResetInputSchema>;

// ============================================
// MCP Tool Output Schemas
// ============================================

// 通用进度信息
export const ProgressInfoSchema = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  percentage: z.number().nonnegative(),
});
export type ProgressInfo = z.infer<typeof ProgressInfoSchema>;

// 下一任务信息
export const NextTaskInfoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .nullable();
export type NextTaskInfo = z.infer<typeof NextTaskInfoSchema>;

// superplanners_plan 输出
export const PlanOutputSchema = z.object({
  success: z.boolean(),
  project_id: z.string(),
  project_name: z.string(),
  summary: z.object({
    total_tasks: z.number(),
    total_estimate: z.string(),
  }),
  files: z.object({
    index_yaml: z.string(),
    index_md: z.string(),
    project_yaml: z.string(),
    project_md: z.string(),
  }),
  next_task: NextTaskInfoSchema,
});
export type PlanOutput = z.infer<typeof PlanOutputSchema>;

// superplanners_status 全局视图输出
export const StatusGlobalOutputSchema = z.object({
  success: z.boolean(),
  total_projects: z.number(),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: ProjectStatusSchema,
      progress: z.string(),
      updated: z.string(),
    })
  ),
});
export type StatusGlobalOutput = z.infer<typeof StatusGlobalOutputSchema>;

// superplanners_status 项目视图输出
export const StatusProjectOutputSchema = z.object({
  success: z.boolean(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    updated: z.string(),
  }),
  summary: TaskSummarySchema,
  progress: ProgressInfoSchema,
  current_task: NextTaskInfoSchema,
  tasks: z.array(TaskSchema),
});
export type StatusProjectOutput = z.infer<typeof StatusProjectOutputSchema>;

// superplanners_update 输出
export const UpdateOutputSchema = z.object({
  success: z.boolean(),
  updated: z.object({
    task_id: z.string(),
    status: z.string(),
    notes: z.string().optional(),
  }),
  summary: TaskSummarySchema,
  progress: ProgressInfoSchema,
  next_task: NextTaskInfoSchema,
});
export type UpdateOutput = z.infer<typeof UpdateOutputSchema>;

// superplanners_reset 输出
export const ResetCleanupOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('cleanup'),
  archived_count: z.number(),
  archived: z.array(z.string()),
});

export const ResetListOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('list'),
  total: z.number(),
  archives: z.array(
    z.object({
      archive_id: z.string(),
      project_id: z.string(),
      archived_at: z.string(),
    })
  ),
});

export const ResetRestoreOutputSchema = z.object({
  success: z.boolean(),
  action: z.literal('restore'),
  restored_project_id: z.string(),
  from_archive: z.string(),
});

// 错误输出
export const ErrorOutputSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});
export type ErrorOutput = z.infer<typeof ErrorOutputSchema>;
