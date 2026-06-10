/**
 * Shared helpers for MCP tool implementations.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { CHARACTER_LIMIT } from '../constants/index.js';
import { logger } from '../logger.js';
import { NorthScoreApiClientError } from '../services/index.js';

/**
 * Build a successful tool result: JSON text fallback + structured content.
 */
export function successResult(output: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

/**
 * Build an error tool result with an actionable message.
 */
export function errorResult(error: unknown): CallToolResult {
  let message = error instanceof Error ? error.message : 'Unknown error';

  if (error instanceof NorthScoreApiClientError) {
    if (error.statusCode === 404) {
      message = `${message}. The team or resource was not found — check the team name spelling for this league (slug-based leagues like CHL/NSL/MWBA/PSL use kebab-case, e.g. "london-knights").`;
    } else if (error.statusCode === 422) {
      message = `${message}. The API rejected a parameter — check the values against the details below.`;
    }
    if (Object.keys(error.details).length > 0) {
      const details = JSON.stringify(error.details);
      message = `${message} Details: ${details.length > 1500 ? `${details.slice(0, 1500)}…` : details}`;
    }
  }

  const output = {
    success: false,
    error: message,
    ...(error instanceof NorthScoreApiClientError && { status_code: error.statusCode }),
  };

  logger.warn('Tool returned error', { error: message });

  return {
    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
    isError: true,
  };
}

export interface TruncationInfo {
  truncated: boolean;
  truncation_message?: string;
}

/**
 * Truncate a list so the serialized output stays under CHARACTER_LIMIT.
 * Halves the list until it fits; reports what was dropped.
 */
export function truncateList<T>(items: T[]): { items: T[]; info: TruncationInfo } {
  let current = items;
  while (current.length > 1 && JSON.stringify(current).length > CHARACTER_LIMIT) {
    current = current.slice(0, Math.ceil(current.length / 2));
  }

  if (current.length === items.length) {
    return { items, info: { truncated: false } };
  }
  return {
    items: current,
    info: {
      truncated: true,
      truncation_message: `Response truncated from ${items.length} to ${current.length} items to stay within the size limit. Narrow the request (e.g. filter by team or a shorter date range) to see the rest.`,
    },
  };
}

/**
 * Format a Date as YYYY-MM-DD in the America/Toronto timezone
 * (NorthScore is Canadian sports data — "today" means Toronto's today).
 */
export function torontoDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
