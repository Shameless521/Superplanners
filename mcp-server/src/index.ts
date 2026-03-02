#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createToolHandlers, TOOLS } from './server.js';

async function main() {
  const server = new Server(
    {
      name: 'superplanners-mcp',
      version: '0.7.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 注册工具列表
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // 注册工具调用处理
  const handlers = createToolHandlers(process.cwd());

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = handlers[name];

    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: `未知工具: ${name}` }),
          },
        ],
      };
    }

    try {
      const result = await handler(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: e instanceof Error ? e.message : String(e),
            }),
          },
        ],
      };
    }
  });

  // 启动服务
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('SuperPlanners MCP Server started');
}

main().catch(console.error);
