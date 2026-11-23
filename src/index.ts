#!/usr/bin/env node
/**
 * Northscore MCP server entry point.
 *
 * Transport is selected via MCP_TRANSPORT:
 *   - stdio (default): local clients like Claude Desktop
 *   - http: Streamable HTTP for remote hosts (ChatGPT, Claude web)
 */

import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { config, validateConfig } from './config/env.js';
import { logger } from './logger.js';
import { createServer } from './server.js';
import { startHttpServer } from './http.js';

function main(): void {
  validateConfig();

  if (config.transport === 'http') {
    startHttpServer();
    return;
  }

  // serveStdio negotiates the protocol era (2025-11-25 or 2026-07-28) per connection
  serveStdio(createServer, {
    onerror: (error) => logger.error('stdio error', { error: error.message }),
  });
  logger.info('northscore-mcp running on stdio', { apiBaseUrl: config.apiBaseUrl });
}

try {
  main();
} catch (error) {
  logger.error('Server error', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
}
