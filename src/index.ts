#!/usr/bin/env node
/**
 * NorthScore MCP server entry point.
 *
 * Transport is selected via MCP_TRANSPORT:
 *   - stdio (default): local clients like Claude Desktop
 *   - http: Streamable HTTP for remote hosts (ChatGPT, Claude web)
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/env.js';
import { createServer } from './server.js';
import { startHttpServer } from './http.js';

async function main(): Promise<void> {
  validateConfig();

  if (config.transport === 'http') {
    startHttpServer();
    return;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('northscore-mcp running on stdio');
}

main().catch((error: unknown) => {
  console.error('Server error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
