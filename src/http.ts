/**
 * Streamable HTTP transport (stateless) for remote MCP hosts.
 *
 * Each POST /mcp creates a fresh server + transport pair, per the SDK's
 * stateless pattern — no session state, safe behind load balancers.
 */

import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { config } from './config/env.js';
import { logger } from './logger.js';
import { createServer, SERVER_INFO } from './server.js';

function methodNotAllowed(res: Response): void {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  });
}

export function startHttpServer(): void {
  const app = createMcpExpressApp({ host: config.host });

  app.post('/mcp', async (req: Request, res: Response) => {
    const server = createServer();
    try {
      // No sessionIdGenerator -> stateless mode (no sessions to resume)
      const transport = new StreamableHTTPServerTransport({});
      // Cast needed: SDK's transport classes declare `onclose: ... | undefined`,
      // which exactOptionalPropertyTypes rejects against the Transport interface.
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      logger.error('Error handling MCP request', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Stateless mode: no SSE streams or sessions to resume/terminate
  app.get('/mcp', (_req: Request, res: Response) => methodNotAllowed(res));
  app.delete('/mcp', (_req: Request, res: Response) => methodNotAllowed(res));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', name: SERVER_INFO.name, version: SERVER_INFO.version });
  });

  app.listen(config.port, config.host, () => {
    logger.info('northscore-mcp listening (Streamable HTTP, stateless)', {
      url: `http://${config.host}:${config.port}/mcp`,
      apiBaseUrl: config.apiBaseUrl,
    });
  });
}
