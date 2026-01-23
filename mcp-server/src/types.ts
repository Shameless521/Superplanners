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
