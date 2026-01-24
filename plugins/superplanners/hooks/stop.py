#!/usr/bin/env python3
"""Stop hook for SuperPlanners plugin.

监听 Claude 的输出，检测任务状态标记并触发自动更新。

标记格式:
- [TASK_STARTED: {project_id}/{task_id}] -> in_progress
- [TASK_COMPLETED: {project_id}/{task_id}] -> completed
- [TASK_BLOCKED: {project_id}/{task_id}] -> blocked
- [TASK_SKIPPED: {project_id}/{task_id}] -> skipped
"""

import json
import re
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
    'SKIPPED': 'skipped'
}


def parse_markers(text: str) -> list:
    """从文本中解析所有任务标记。

    Args:
        text: Claude 的输出文本

    Returns:
        包含 (project_id, task_id, status) 元组的列表
    """
    matches = TASK_MARKER_PATTERN.findall(text)
    results = []
    for marker_type, project_id, task_id in matches:
        status = MARKER_TO_STATUS.get(marker_type)
        if status:
            results.append({
                'project_id': project_id.strip(),
                'task_id': task_id.strip(),
                'status': status
            })
    return results


def main():
    """主入口点。"""
    try:
        # 从 stdin 读取输入
        input_data = json.load(sys.stdin)

        # 获取 Claude 的输出文本
        # Stop hook 的输入格式可能包含 stopReason, content 等字段
        content = ''

        # 尝试从不同的字段获取文本内容
        if isinstance(input_data, dict):
            # 可能的字段名
            for field in ['assistantTurnText', 'content', 'text', 'message']:
                if field in input_data:
                    value = input_data[field]
                    if isinstance(value, str):
                        content = value
                        break
                    elif isinstance(value, list):
                        # 处理消息列表
                        for item in value:
                            if isinstance(item, dict) and 'text' in item:
                                content += item['text'] + '\n'
                            elif isinstance(item, str):
                                content += item + '\n'

        # 解析标记
        markers = parse_markers(content)

        if markers:
            # 构建系统消息，提示 Claude 调用 superplanners_update
            updates = []
            for marker in markers:
                updates.append(
                    f"- project_id: {marker['project_id']}, "
                    f"task_id: {marker['task_id']}, "
                    f"status: {marker['status']}"
                )

            update_list = '\n'.join(updates)

            result = {
                "continueRunning": True,
                "systemMessage": (
                    f"[SuperPlanners 自动状态更新]\n"
                    f"检测到以下任务状态标记，请立即调用 superplanners_update MCP 工具进行更新：\n"
                    f"{update_list}\n\n"
                    f"请依次为每个任务调用 superplanners_update 工具。"
                )
            }
        else:
            # 没有检测到标记，正常退出
            result = {}

        print(json.dumps(result), file=sys.stdout)

    except Exception as e:
        # 发生错误时，输出错误信息但不阻止操作
        error_output = {
            "systemMessage": f"[SuperPlanners Hook 错误]: {str(e)}"
        }
        print(json.dumps(error_output), file=sys.stdout)

    finally:
        sys.exit(0)


if __name__ == '__main__':
    main()
