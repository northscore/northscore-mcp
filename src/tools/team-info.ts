/**
 * get_team_info — record, division, rank, streak for one team.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_LEAGUES } from '../constants/index.js';
import { fetchTeamInfo } from '../services/index.js';
import { teamInfoSchema } from './schemas.js';
import { errorResult, successResult } from './helpers.js';

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
    .describe(
      "Team identifier in the league's naming scheme. Pro leagues: lowercase nickname " +
        '(e.g. "argonauts", "brampton"). U SPORTS/OCAA: school name (e.g. "Queen\'s"). ' +
        'CHL/NSL/MWBA/PSL: kebab-case slug (e.g. "london-knights", "afc-toronto", ' +
        '"halifax-thunder", "vaughan-azzurri"). If unsure, call get_standings first and ' +
        'use the team id from the result.',
    ),
};

const outputSchema = {
  success: z.boolean(),
  team_info: teamInfoSchema.optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

export function registerGetTeamInfoTool(server: McpServer): void {
  server.registerTool(
    'get_team_info',
    {
      title: 'Get Team Info',
      description: `Use this when the user asks about one team's record, division, rank, streak, or ticket links.

Args:
  - league_system (required): the team's league (see enum).
  - team_name (required): league-specific team identifier (see parameter description for naming schemes).

Returns: { team_info } with team identity (incl. team_entity_id), wins, losses, division, rank, streak, tickets_url, and league-specific extra stats.

Examples:
  - "How are the Argonauts doing?" -> league_system="cfl", team_name="argonauts"
  - "London Knights record" -> league_system="chl_ohl", team_name="london-knights"
  - Don't use for full league tables — use get_standings.

Errors: 404/422 means the team_name didn't match — call get_standings for the league and reuse the exact team id from its results.`,
      inputSchema,
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ league_system, team_name }) => {
      try {
        const teamInfo = await fetchTeamInfo(league_system, team_name);
        return successResult({ success: true, team_info: teamInfo });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
