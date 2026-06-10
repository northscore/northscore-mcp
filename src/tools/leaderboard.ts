/**
 * get_leaderboard — stat leaders for leagues that publish leaderboards.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LEADERBOARD_LEAGUES } from '../constants/index.js';
import { fetchLeaderboard } from '../services/index.js';
import { leaderboardEntrySchema } from './schemas.js';
import { errorResult, successResult, truncateList } from './helpers.js';

const inputSchema = {
  league_system: z
    .enum(LEADERBOARD_LEAGUES)
    .describe(
      'League identifier — only leagues with leaderboards: cebl, cfl, cpl, hoopqueens, ' +
        'usports_{mbb,wbb,mvb,wvb,mfb,msoc,wsoc,mhky,whky}, ocaa_{mbb,wbb,mvb,wvb,msoc,wsoc}. ' +
        'NSL, MWBA, CHL and PSL do not publish leaderboards.',
    ),
  stat_type: z
    .string()
    .optional()
    .describe(
      'Filter to one stat by name fragment, e.g. "points", "assists", "rebounds", "goals". ' +
        'Omit to get leaders for every published stat.',
    ),
  mode: z
    .enum(['PER_GAME', 'TOTALS'])
    .optional()
    .describe('Averages vs totals (CEBL and U SPORTS only; defaults to PER_GAME)'),
  limit: z.number().int().min(1).max(100).optional().describe('Max leaders per stat'),
};

const outputSchema = {
  success: z.boolean(),
  count: z.number().optional(),
  leaders: z
    .array(leaderboardEntrySchema)
    .optional()
    .describe('Ranked players with stat_type, value, team, and entity IDs'),
  truncated: z.boolean().optional(),
  truncation_message: z.string().optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

export function registerGetLeaderboardTool(server: McpServer): void {
  server.registerTool(
    'get_leaderboard',
    {
      title: 'Get Leaderboard',
      description: `Use this when the user asks who leads a league in a statistic — top scorers, best rebounders, most assists, etc.

Args:
  - league_system (required): see enum — NSL, MWBA, CHL and PSL are NOT supported (no leaderboard data).
  - stat_type (optional): name fragment to filter to a single stat (e.g. "points").
  - mode (optional): PER_GAME (default) or TOTALS — CEBL / U SPORTS only.
  - limit (optional): max leaders per stat.

Returns: { count, leaders[] } — each entry has rank, value, stat_type, player (name, position, jersey), team identity with team_entity_id.

Examples:
  - "Who leads the CEBL in scoring?" -> league_system="cebl", stat_type="points"
  - "Top U SPORTS women's basketball rebounders" -> league_system="usports_wbb", stat_type="rebounds"
  - Don't use for team-level statistics — use get_team_stats.

Errors: if stat_type doesn't match anything, the full multi-stat list is returned — inspect stat_type values in the result and retry with one of them.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ league_system, stat_type, mode, limit }) => {
      try {
        const leaders = await fetchLeaderboard(league_system, {
          ...(stat_type && { stat_type }),
          ...(mode && { mode }),
          ...(limit && { limit }),
        });
        const { items, info } = truncateList(leaders);

        return successResult({
          success: true,
          count: leaders.length,
          leaders: items,
          ...info,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
