/**
 * get_team_roster — player roster for one team.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TEAM_ROSTER_LEAGUES } from '../constants/index.js';
import { fetchTeamRoster } from '../services/index.js';
import { teamRosterSchema } from './schemas.js';
import { errorResult, successResult } from './helpers.js';

const inputSchema = {
  league_system: z
    .enum(TEAM_ROSTER_LEAGUES)
    .describe(
      'League identifier — leagues with rosters: cebl, cfl, cpl, hoopqueens, mwba, ' +
        'usports_{mbb,wbb,mvb,wvb,mfb,msoc,wsoc,mhky,whky}, ocaa_{mbb,wbb,mvb,wvb,msoc,wsoc}. ' +
        'NSL, CHL and PSL do not publish rosters.',
    ),
  team_name: z
    .string()
    .describe(
      "Team identifier in the league's naming scheme. Pro leagues: lowercase nickname " +
        '(e.g. "alouettes"). U SPORTS/OCAA: school name (e.g. "Carleton"). ' +
        'MWBA: kebab-case slug (e.g. "halifax-thunder").',
    ),
  mode: z
    .enum(['PER_GAME', 'TOTALS'])
    .optional()
    .describe('Player stat aggregation (CEBL and U SPORTS only; defaults to PER_GAME)'),
};

const outputSchema = {
  success: z.boolean(),
  player_count: z.number().optional(),
  roster: teamRosterSchema.optional(),
  error: z.string().optional(),
  status_code: z.number().optional(),
};

export function registerGetTeamRosterTool(server: McpServer): void {
  server.registerTool(
    'get_team_roster',
    {
      title: 'Get Team Roster',
      description: `Use this when the user asks who plays for a team — the roster, player list, jersey numbers, positions, or per-player season stats.

Args:
  - league_system (required): see enum — NSL, CHL and PSL are NOT supported (no roster data).
  - team_name (required): league-specific team identifier.
  - mode (optional): PER_GAME (default) or TOTALS for player stats — CEBL / U SPORTS only.

Returns: { player_count, roster } — roster has team identity (with team_entity_id) and players[], each with player info (name, position, jersey_number), games_played, season stats, and biographical profile where available.

Examples:
  - "Who's on the Alouettes?" -> league_system="cfl", team_name="alouettes"
  - "Carleton men's basketball roster" -> league_system="usports_mbb", team_name="Carleton"
  - Don't use for league-wide stat leaders — use get_leaderboard.

Errors: 404/422 means team_name didn't match — call get_standings for the league and reuse the exact team id.`,
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
        const roster = await fetchTeamRoster(league_system, team_name, {
          ...(mode && { mode }),
        });
        return successResult({
          success: true,
          player_count: roster.players?.length ?? 0,
          roster,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
