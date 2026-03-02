#!/usr/bin/env python3
"""Stop hook for SuperPlanners plugin.

全自动模式：检测 Claude 输出中的任务状态标记，
直接通过 CLI 命令更新状态，无需 Claude 手动调用 MCP 工具。

标记格式:
- [TASK_STARTED: {project_id}/{task_id}] -> in_progress
- [TASK_COMPLETED: {project_id}/{task_id}] -> completed
- [TASK_BLOCKED: {project_id}/{task_id}] -> blocked
- [TASK_SKIPPED: {project_id}/{task_id}] -> skipped
"""

import json
import os
import re
import subprocess
import sys


# 标记正则表达式
TASK_MARKER_PATTERN = re.compile(
    r'\[TASK_(STARTED|COMPLETED|BLOCKED|SKIPPED):\s*([^/\]]+)/([^\]]+)\]'
)

# 标记到状态的映射
MARKER_TO_STATUS = {
    'STARTED': 'in_progress',
    'COMPLETED': 'completed',
    'BLOCKED': 'blocked',
    'SKIPPED': 'skipped',
}


def parse_markers(text: str) -> list:
    """从文本中解析所有任务标记。

    同一个 project/task 的多个标记只保留最后一个状态。
    """
    matches = TASK_MARKER_PATTERN.findall(text)
    results = []

    for marker_type, project_id, task_id in matches:
        status = MARKER_TO_STATUS.get(marker_type)
        if status:
            pid = project_id.strip()
            tid = task_id.strip()
            key = f"{pid}/{tid}"
            # 后出现的标记覆盖先出现的
            results = [r for r in results if f"{r['project_id']}/{r['task_id']}" != key]
            results.append({
                'project_id': pid,
                'task_id': tid,
                'status': status,
            })

    return results


def execute_batch_update(markers: list, cwd: str) -> dict:
    """通过 CLI 批量执行状态更新。"""
    batch_input = json.dumps({
        'updates': [
            {
                'projectId': m['project_id'],
                'taskId': m['task_id'],
                'status': m['status'],
            }
            for m in markers
        ]
    })

    try:
        result = subprocess.run(
            ['npx', 'superplanners-cli', 'batch-update', '--cwd', cwd],
            input=batch_input,
            capture_output=True,
            text=True,
            timeout=12,
            cwd=cwd,
        )

        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return {'success': True}
        else:
            return {
                'success': False,
                'error': result.stderr.strip() or result.stdout.strip() or '未知错误',
            }

    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'CLI 执行超时'}
    except FileNotFoundError:
        return {'success': False, 'error': 'npx 命令未找到'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def build_fallback_message(markers: list) -> str:
    """CLI 失败时的降级提示。"""
    updates = []
    for m in markers:
        updates.append(
            f"- superplanners_update(project_id=\"{m['project_id']}\", "
            f"task_id=\"{m['task_id']}\", status=\"{m['status']}\")"
        )
    return (
        "[SuperPlanners] 自动状态更新失败，请手动调用以下 MCP 工具：\n"
        + '\n'.join(updates)
    )


def extract_content(input_data: dict) -> str:
    """从 Stop Hook 输入中提取 Claude 的输出文本。"""
    content = ''
    for field in ['assistantTurnText', 'content', 'text', 'message']:
        if field in input_data:
            value = input_data[field]
            if isinstance(value, str):
                return value
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'text' in item:
                        content += item['text'] + '\n'
                    elif isinstance(item, str):
                        content += item + '\n'
                if content:
                    return content
    return content


def main():
    """主入口点。"""
    try:
        input_data = json.load(sys.stdin)

        content = ''
        if isinstance(input_data, dict):
            content = extract_content(input_data)

        markers = parse_markers(content)

        if not markers:
            # 没有检测到标记，静默退出
            print(json.dumps({}), file=sys.stdout)
            return

        # 通过 CLI 执行批量更新
        cwd = os.getcwd()
        result = execute_batch_update(markers, cwd)

        if result.get('success'):
            # 自动更新成功，静默完成
            print(json.dumps({}), file=sys.stdout)
        else:
            # 失败时降级到手动模式
            print(json.dumps({
                'continueRunning': True,
                'systemMessage': build_fallback_message(markers),
            }), file=sys.stdout)

    except Exception as e:
        print(json.dumps({
            'systemMessage': f'[SuperPlanners Hook 错误]: {str(e)}'
        }), file=sys.stdout)

    finally:
        sys.exit(0)


if __name__ == '__main__':
    main()
