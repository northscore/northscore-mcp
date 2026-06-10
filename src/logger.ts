/**
 * Minimal structured logger.
 *
 * Always writes to stderr: stdout is reserved for the MCP stdio protocol,
 * and clients like Claude Desktop capture stderr into their MCP log files
 * (macOS: ~/Library/Logs/Claude/mcp-server-northscore.log).
 *
 * Level is controlled by LOG_LEVEL (debug | info | warn | error, default info).
 */

import { config, LOG_LEVELS, type LogLevel } from './config/env.js';

const minLevel = LOG_LEVELS.indexOf(config.logLevel);

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (LOG_LEVELS.indexOf(level) < minLevel) return;
  const entry = { time: new Date().toISOString(), level, message, ...context };
  process.stderr.write(`${JSON.stringify(entry)}\n`);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>): void =>
    write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>): void =>
    write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>): void =>
    write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>): void =>
    write('error', message, context),
};
