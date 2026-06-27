/**
 * get_team_stats — team statistics with league rankings.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TEAM_STATS_LEAGUES } from '../constants/index.js';
import { fetchTeamStats } from '../services/index.js';
import { teamStatSchema } from './schemas.js';
import { errorResult, successResult, truncateList } from './helpers.js';

const inputSchema = {
  league_system: z
    .enum(TEAM_STATS_LEAGUES)
    .describe(
      'League identifier — leagues with team statistics: cebl, cfl, cpl, hoopqueens, nsl, ' +
        'chl_{ohl,whl,qjmhl}, usports_{mbb,wbb,mvb,wvb,mfb,msoc,wsoc,mhky,whky}, ' +
        'ocaa_{mbb,wbb,mvb,wvb,msoc,wsoc}. MWBA and PSL do not publish team statistics.',
    ),
  team_name: z
    .string()
    .optional()
    .describe(
      'Filter to one team (league-specific naming — pro: lowercase nickname, college: school ' +
        'name, slug leagues: kebab-case). Omit to get statistics for every team in the league.',
    ),
  mode: z
    .enum(['PER_GAME', 'TOTALS'])
    .optional()
    .describe('Averages vs totals (CEBL and U SPORTS only; defaults to PER_GAME)'),
};

const outputSchema = {
  success: z.boolean(),
  count: z.number().optional(),
  team_stats: z
    .union([teamStatSchema, z.array(teamStatSchema)])
    .optional()
    .describe('Single team when team_name given, otherwise all teams'),
  truncated: z.boolean().optional(),
  truncation_message: z.string().optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

export function registerGetTeamStatsTool(server: McpServer): void {
  server.registerTool(
    'get_team_stats',
    {
      title: 'Get Team Stats',
      description: `Use this when the user asks for team-level statistics or how teams compare statistically — points per game, goals for/against, offensive/defensive rankings.

Args:
  - league_system (required): see enum — MWBA and PSL are NOT supported.
  - team_name (optional): one team; omit for all teams in the league.
  - mode (optional): PER_GAME (default) or TOTALS — CEBL / U SPORTS only.

Returns: { team_stats } — per team: stats (league-specific metric map), rankings (rank per metric within the league), games_played, team identity with team_entity_id.

Examples:
  - "Forge FC team stats" -> league_system="cpl", team_name="forge"
  - "Which OHL team allows the fewest goals?" -> league_system="chl_ohl" (all teams), then compare
  - Don't use for individual player leaders — use get_leaderboard.

Errors: 404/422 means team_name didn't match the league's naming — omit it and filter from the full list instead.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ league_system, team_name, mode }) => {
      try {
        const stats = await fetchTeamStats(league_system, {
          ...(team_name && { team_name }),
          ...(mode && { mode }),
        });

        if (Array.isArray(stats)) {
          const { items, info } = truncateList(stats);
          return successResult({
            success: true,
            count: stats.length,
            team_stats: items,
            ...info,
          });
        }
        return successResult({ success: true, count: 1, team_stats: stats });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
