/**
 * get_standings — league table for any supported league.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_LEAGUES } from '../constants/index.js';
import { fetchStandings } from '../services/index.js';
import { standingsSchema } from './schemas.js';
import { errorResult, successResult, truncateList } from './helpers.js';

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
};

const outputSchema = {
  success: z.boolean(),
  count: z.number().optional(),
  standings: z
    .array(standingsSchema)
    .optional()
    .describe('Teams with rank, wins, losses, division'),
  truncated: z.boolean().optional(),
  truncation_message: z.string().optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

export function registerGetStandingsTool(server: McpServer): void {
  server.registerTool(
    'get_standings',
    {
      title: 'Get Standings',
      description: `Use this when the user asks about standings, the league table, win-loss records, or where a team ranks in its league.

Args:
  - league_system (required): which league's table to fetch (see enum).

Returns: { count, standings[] } — each entry has team identity (with team_entity_id), rank, wins, losses, division, and league-specific extra stats (points, goal difference, win percentage, ...). Standings for divided leagues are flattened into one list; use the division field to group.

Examples:
  - "CFL standings" -> league_system="cfl"
  - "Where are the London Knights in the OHL?" -> league_system="chl_ohl", then find the team in the result
  - Don't use for a single team's detailed record — get_team_info is more direct.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ league_system }) => {
      try {
        const standings = await fetchStandings(league_system);
        const { items, info } = truncateList(standings);

        return successResult({
          success: true,
          count: standings.length,
          standings: items,
          ...info,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
