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
