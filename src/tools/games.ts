/**
 * get_games — single-league schedule and scores.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_LEAGUES } from '../constants/index.js';
import { fetchGames } from '../services/index.js';
import type { GenericGame } from '../types/index.js';
import { gameSchema } from './schemas.js';
import { errorResult, successResult, truncateList } from './helpers.js';

const RECENT_DAYS_LIMIT = 14;

const inputSchema = {
  league_system: z
    .enum(ALL_LEAGUES)
    .describe(
      'League identifier. Pro: cebl, cfl, cpl, hoopqueens, nsl, mwba. ' +
        'Hockey: chl_ohl, chl_whl, chl_qjmhl. ' +
        'University: usports_{mbb,wbb,mvb,wvb,mfb,msoc,wsoc,mhky,whky}. ' +
        'College: ocaa_{mbb,wbb,mvb,wvb,msoc,wsoc}. ' +
        'Soccer pathway: psl_{ppl,apl,bcpl,opl_1,opl_2,opl_3,opl_u20}_{mens,womens}.',
    ),
  team_name: z
    .string()
    .optional()
    .describe(
      'Filter to one team. Naming is league-specific: pro leagues use lowercase nicknames ' +
        '(e.g. "argonauts"), college leagues use school names (e.g. "Queen\'s"), ' +
        'slug leagues (CHL/NSL/MWBA/PSL) use kebab-case (e.g. "london-knights").',
    ),
  recent: z.boolean().optional().describe('Only games from the past 14 days'),
  upcoming: z.boolean().optional().describe('Only upcoming games'),
  year: z.number().int().optional().describe('Season year — PSL leagues only (e.g. 2026)'),
};

const outputSchema = {
  success: z.boolean(),
  count: z.number().optional(),
  games: z.array(gameSchema).optional(),
  truncated: z.boolean().optional(),
  truncation_message: z.string().optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

function filterGamesByDate(
  games: GenericGame[],
  recent?: boolean,
  upcoming?: boolean,
): GenericGame[] {
  if (!recent && !upcoming) return games;

  const now = new Date();
  const recentCutoff = new Date(now.getTime() - RECENT_DAYS_LIMIT * 24 * 60 * 60 * 1000);

  return games.filter((game) => {
    if (!game.date) return false;
    const gameDate = new Date(game.date);
    if (recent && gameDate < now && gameDate >= recentCutoff) return true;
    if (upcoming && gameDate >= now) return true;
    return false;
  });
}

export function registerGetGamesTool(server: McpServer): void {
  server.registerTool(
    'get_games',
    {
      title: 'Get Games',
      description: `Use this when the user wants the schedule, scores, or matchups for ONE specific league (optionally one team).

Args:
  - league_system (required): which league to query (see enum).
  - team_name (optional): filter to a single team.
  - recent / upcoming (optional booleans): client-side date filters.
  - year (optional): PSL season year only.

Returns: { count, games[] } — each game has home/away teams with scores, status, venue, league_id, and cross-platform entity IDs (league_entity_id, team_entity_id) usable to correlate with other tools.

Examples:
  - "When do the Argonauts play next?" -> league_system="cfl", team_name="argonauts", upcoming=true
  - "OHL scores from last week" -> league_system="chl_ohl", recent=true
  - Don't use for "games today across leagues" — use get_games_by_date instead.

Errors: a 404/422 usually means the team_name doesn't match the league's naming scheme — retry with the format described in team_name, or omit team_name and filter from the full schedule.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ league_system, team_name, recent, upcoming, year }) => {
      try {
        const games = await fetchGames(league_system, {
          ...(team_name && { team_name }),
          ...(year && { year }),
        });
        const filtered = filterGamesByDate(games, recent, upcoming);
        const { items, info } = truncateList(filtered);

        return successResult({
          success: true,
          count: filtered.length,
          games: items,
          ...info,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
