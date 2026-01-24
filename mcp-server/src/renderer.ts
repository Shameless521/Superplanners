// src/renderer.ts
import type { TaskPlan, ProjectData, Task, SubTask, TaskSummary, ProgressInfo } from './types.js';

const STATUS_ICONS: Record<string, string> = {
  active: '🔄',
  completed: '✅',
  pending: '⏸️',
  in_progress: '🔄',
  blocked: '🚫',
  skipped: '⏭️',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: '🔴 紧急',
  high: '🟠 高',
  medium: '🟡 中',
  low: '🟢 低',
};

/**
 * 渲染任务计划索引为 Markdown
 */
export function renderTaskPlan(
  taskPlan: TaskPlan,
  getProgress: (projectId: string) => string
): string {
  const lines: string[] = [];

  lines.push(`# ${taskPlan.meta.name}`);
  lines.push('');
  lines.push(`> 版本: ${taskPlan.meta.version}`);
  lines.push(`> 更新时间: ${formatDate(taskPlan.meta.updated)}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 项目列表');
  lines.push('');

  if (taskPlan.projects.length === 0) {
    lines.push('*暂无项目*');
  } else {
    lines.push('| 状态 | 项目 | 进度 | 更新时间 |');
    lines.push('|------|------|------|----------|');

    for (const project of taskPlan.projects) {
      const icon = STATUS_ICONS[project.status] || '❓';
      const progress = getProgress(project.project_id);
      const date = formatDate(project.updated);

      lines.push(`| ${icon} | [${project.project}](${project.path}) | ${progress} | ${date} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*此文件由 SuperPlanners 自动生成，请勿手动编辑*');

  return lines.join('\n');
}

/**
 * 格式化日期
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * 渲染进度条
 */
function renderProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

/**
 * 渲染项目任务为 Markdown
 */
export function renderProjectTasks(
  projectData: ProjectData,
  summary: TaskSummary,
  progress: ProgressInfo
): string {
  const lines: string[] = [];
  const { meta, tasks } = projectData;

  // 标题
  lines.push(`# ${meta.project}`);
  lines.push('');

  // 描述
  if (meta.description) {
    lines.push(`> ${meta.description}`);
    lines.push('');
  }

  // 进度概览
  lines.push('## 📊 进度概览');
  lines.push('');
  lines.push(`${renderProgressBar(progress.percentage)} **${progress.percentage}%** (${progress.completed}/${progress.total})`);
  lines.push('');

  // 统计摘要
  lines.push('| 状态 | 数量 |');
  lines.push('|------|------|');
  lines.push(`| ✅ 已完成 | ${summary.completed} |`);
  lines.push(`| 🔄 进行中 | ${summary.in_progress} |`);
  lines.push(`| ⏸️ 待开始 | ${summary.pending} |`);
  lines.push(`| 🚫 阻塞中 | ${summary.blocked} |`);
  lines.push(`| ⏭️ 已跳过 | ${summary.skipped} |`);
  lines.push('');

  // 任务列表
  lines.push('---');
  lines.push('');
  lines.push('## 📋 任务列表');
  lines.push('');

  for (const task of tasks) {
    lines.push(renderTask(task));
    lines.push('');
  }

  // 元信息
  lines.push('---');
  lines.push('');
  lines.push(`*项目 ID: ${meta.project_id}*`);
  lines.push(`*创建时间: ${formatDate(meta.created)}*`);
  lines.push(`*更新时间: ${formatDate(meta.updated)}*`);
  lines.push('');
  lines.push('*此文件由 SuperPlanners 自动生成，请勿手动编辑*');

  return lines.join('\n');
}

/**
 * 渲染单个任务
 */
function renderTask(task: Task, indent: number = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);
  const icon = STATUS_ICONS[task.status] || '❓';
  const priority = PRIORITY_LABELS[task.priority] || task.priority;

  // 任务标题
  lines.push(`${prefix}### ${icon} ${task.id}. ${task.title}`);
  lines.push('');

  // 任务元信息
  const metaItems: string[] = [];
  metaItems.push(`**优先级:** ${priority}`);
  if (task.estimate) metaItems.push(`**预估:** ${task.estimate}`);
  if (task.actual) metaItems.push(`**实际:** ${task.actual}`);
  if (task.dependencies && task.dependencies.length > 0) {
    metaItems.push(`**依赖:** ${task.dependencies.join(', ')}`);
  }

  lines.push(`${prefix}${metaItems.join(' | ')}`);
  lines.push('');

  // 描述
  if (task.description) {
    lines.push(`${prefix}${task.description}`);
    lines.push('');
  }

  // 备注
  if (task.notes) {
    lines.push(`${prefix}> 📝 ${task.notes}`);
    lines.push('');
  }

  // 子任务
  if (task.subtasks && task.subtasks.length > 0) {
    lines.push(`${prefix}**子任务:**`);
    lines.push('');
    for (const subtask of task.subtasks) {
      const subIcon = STATUS_ICONS[subtask.status] || '❓';
      let subtaskLine = `${prefix}- ${subIcon} **${subtask.id}** ${subtask.title}`;
      if (subtask.notes) {
        subtaskLine += ` *(${subtask.notes})*`;
      }
      lines.push(subtaskLine);
    }
    lines.push('');
  }

  return lines.join('\n');
}
