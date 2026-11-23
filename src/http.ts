/**
 * Streamable HTTP transport (stateless) for remote MCP hosts.
 *
 * `createMcpHandler` builds a fresh server per request and serves both
 * protocol eras from one endpoint: 2026-07-28 (stateless) and 2025-era
 * clients via the stateless fallback. Safe behind load balancers.
 */

import { createMcpExpressApp, requireBearerAuth } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { config } from './config/env.js';
import { logger } from './logger.js';
import { createServer, SERVER_INFO } from './server.js';
import { createJwtVerifier } from './auth.js';

const logError = (error: Error): void =>
  logger.error('Error handling MCP request', { error: error.message });

export function startHttpServer(): void {
  // Host + Origin allowlists guard against DNS rebinding when bound to 0.0.0.0.
  // The SDK only checks Origin automatically on localhost binds, so pass it explicitly.
  const app = createMcpExpressApp({
    host: config.host,
    ...(config.allowedHosts && {
      allowedHosts: config.allowedHosts,
      allowedOrigins: config.allowedHosts,
    }),
  });

  const auth = requireBearerAuth({ verifier: createJwtVerifier(config.supabaseJwtSecret) });
  const mcp = toNodeHandler(createMcpHandler(createServer, { onerror: logError }), {
    onerror: logError,
  });

  // Body is already parsed by createMcpExpressApp — pass it through
  app.all('/mcp', auth, (req, res) => void mcp(req, res, req.body));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', name: SERVER_INFO.name, version: SERVER_INFO.version });
  });

  app.listen(config.port, config.host, () => {
    logger.info('northscore-mcp listening (Streamable HTTP, stateless)', {
      url: `http://${config.host}:${config.port}/mcp`,
      apiBaseUrl: config.apiBaseUrl,
    });
  });
}
