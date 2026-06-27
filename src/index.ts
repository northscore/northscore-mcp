#!/usr/bin/env node
/**
 * Northscore MCP server entry point.
 *
 * Transport is selected via MCP_TRANSPORT:
 *   - stdio (default): local clients like Claude Desktop
 *   - http: Streamable HTTP for remote hosts (ChatGPT, Claude web)
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/env.js';
import { logger } from './logger.js';
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
  logger.info('northscore-mcp running on stdio', { apiBaseUrl: config.apiBaseUrl });
}

main().catch((error: unknown) => {
  logger.error('Server error', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
