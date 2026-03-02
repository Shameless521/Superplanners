#!/usr/bin/env node

// CLI 命令行入口 — 供 Stop Hook 直接调用，实现全自动状态更新
// 复用 createToolHandlers 中的逻辑，零代码重复

import { createToolHandlers } from './server.js';

/**
 * 解析 --key value 格式的命令行参数
 */
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

/**
 * 从 stdin 读取全部内容
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * 单个更新命令
 * 用法: superplanners-cli update --project-id <id> --task-id <id> --status <status> [--notes <text>] [--cwd <dir>]
 */
async function handleUpdate(argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (!args['project-id'] || !args['task-id'] || !args['status']) {
    console.log(JSON.stringify({ success: false, error: '缺少必要参数: --project-id, --task-id, --status' }));
    process.exit(1);
  }

  const handlers = createToolHandlers(args['cwd'] || process.cwd());
  const result = await handlers.superplanners_update({
    project_id: args['project-id'],
    task_id: args['task-id'],
    status: args['status'],
    notes: args['notes'],
  });

  console.log(JSON.stringify(result));
  process.exit((result as { success: boolean }).success ? 0 : 1);
}

/**
 * 批量更新命令
 * 用法: echo '{"updates":[...]}' | superplanners-cli batch-update [--cwd <dir>]
 * stdin JSON 格式: { "updates": [{ "projectId": "x", "taskId": "1", "status": "completed" }] }
 */
async function handleBatchUpdate(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const cwd = args['cwd'] || process.cwd();

  let batch: { updates: Array<{ projectId: string; taskId: string; status: string; notes?: string }> };
  try {
    batch = JSON.parse(await readStdin());
  } catch {
    console.log(JSON.stringify({ success: false, error: '无效的 JSON 输入' }));
    process.exit(1);
    return;
  }

  if (!batch.updates?.length) {
    console.log(JSON.stringify({ success: false, error: '缺少 updates 数组' }));
    process.exit(1);
    return;
  }

  const handlers = createToolHandlers(cwd);
  const results: Array<{ projectId: string; taskId: string; success: boolean; error?: string }> = [];

  // 按顺序执行（保证状态转换顺序）
  for (const u of batch.updates) {
    try {
      const r = (await handlers.superplanners_update({
        project_id: u.projectId,
        task_id: u.taskId,
        status: u.status,
        notes: u.notes,
      })) as { success: boolean; error?: string };

      results.push({ projectId: u.projectId, taskId: u.taskId, success: r.success, error: r.success ? undefined : r.error });
    } catch (e) {
      results.push({ projectId: u.projectId, taskId: u.taskId, success: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  console.log(JSON.stringify({
    success: succeeded === results.length,
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  }));

  process.exit(succeeded === results.length ? 0 : 1);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'update':
      await handleUpdate(process.argv.slice(3));
      break;
    case 'batch-update':
      await handleBatchUpdate(process.argv.slice(3));
      break;
    default:
      console.log(JSON.stringify({
        success: false,
        error: '用法: superplanners-cli <update|batch-update> [选项]',
      }));
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ success: false, error: String(e) }));
  process.exit(1);
});
