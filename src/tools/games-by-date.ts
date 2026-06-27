/**
 * get_games_by_date — cross-league games for a date or date range.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AGGREGATE_SCOPES } from '../constants/index.js';
import { fetchAggregateGames } from '../services/index.js';
import { gameSchema } from './schemas.js';
import { errorResult, successResult, torontoDateString, truncateList } from './helpers.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const inputSchema = {
  scope: z
    .enum(AGGREGATE_SCOPES)
    .describe(
      'League group to search: "pro" (CFL, CPL, CEBL, CHL, HoopQueens, NSL), ' +
        '"usports" (U SPORTS university leagues), or "ocaa" (Ontario college leagues)',
    ),
  preset: z
    .enum(['today', 'this_week'])
    .optional()
    .describe(
      'Date shortcut in the America/Toronto timezone: "today" or "this_week" (today through the next 6 days). Ignored when start_date/end_date are provided.',
    ),
  start_date: z
    .string()
    .regex(DATE_PATTERN, 'Use YYYY-MM-DD format')
    .optional()
    .describe('Range start date (YYYY-MM-DD). Requires end_date.'),
  end_date: z
    .string()
    .regex(DATE_PATTERN, 'Use YYYY-MM-DD format')
    .optional()
    .describe('Range end date (YYYY-MM-DD). Requires start_date.'),
};

const outputSchema = {
  success: z.boolean(),
  scope: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  count: z.number().optional().describe('Total games across all leagues'),
  league_counts: z
    .record(z.string(), z.number())
    .optional()
    .describe('Games per league in the range'),
  games: z.array(gameSchema).optional().describe('Games sorted by date'),
  truncated: z.boolean().optional(),
  truncation_message: z.string().optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

function resolveDateRange(
  preset: 'today' | 'this_week' | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): { start: string; end: string } {
  if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw new Error('Provide both start_date and end_date, or use a preset instead.');
    }
    if (startDate > endDate) {
      throw new Error(`start_date (${startDate}) must not be after end_date (${endDate}).`);
    }
    return { start: startDate, end: endDate };
  }

  const today = torontoDateString(new Date());
  if (preset === 'this_week') {
    const end = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    return { start: today, end: torontoDateString(end) };
  }
  // Default to today when neither preset nor dates were given
  return { start: today, end: today };
}

export function registerGetGamesByDateTool(server: McpServer): void {
  server.registerTool(
    'get_games_by_date',
    {
      title: 'Get Games by Date',
      description: `Use this when the user asks about games happening today, this week, or in a specific date range — across multiple Canadian leagues at once.

Searches one league group ("scope") per call:
- pro: CFL, CPL, CEBL, CHL (OHL/WHL/QMJHL), HoopQueens, NSL
- usports: all U SPORTS university leagues
- ocaa: all OCAA Ontario college leagues

Args:
  - scope (required): "pro" | "usports" | "ocaa"
  - preset (optional): "today" | "this_week" (America/Toronto). Defaults to "today" when no dates given.
  - start_date + end_date (optional): explicit YYYY-MM-DD range; overrides preset.

Returns: { count, league_counts, games[] } — games sorted by date, each with home/away teams, scores, status, venue, league_id, and cross-platform entity IDs (league_entity_id, team_entity_id) you can use to correlate with get_standings / get_team_info results.

Examples:
  - "Any pro games tonight?" -> scope="pro" (defaults to today)
  - "U SPORTS games this week" -> scope="usports", preset="this_week"
  - "Games between June 1 and June 15" -> scope="pro", start_date="2026-06-01", end_date="2026-06-15"
  - Don't use for a single league's full schedule — use get_games instead.

Errors: an empty games list means no games in that range for that scope — try another scope or widen the range.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ scope, preset, start_date, end_date }) => {
      try {
        const { start, end } = resolveDateRange(preset, start_date, end_date);
        const { games, leagueCounts } = await fetchAggregateGames(scope, start, end);
        const { items, info } = truncateList(games);

        return successResult({
          success: true,
          scope,
          start_date: start,
          end_date: end,
          count: games.length,
          league_counts: leagueCounts,
          games: items,
          ...info,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
