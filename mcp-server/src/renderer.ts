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
