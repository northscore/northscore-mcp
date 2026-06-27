/**
 * Shared MCP server factory — used by both stdio and Streamable HTTP entries.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetGamesByDateTool } from './tools/games-by-date.js';
import { registerGetGamesTool } from './tools/games.js';
import { registerGetStandingsTool } from './tools/standings.js';
import { registerGetLeaderboardTool } from './tools/leaderboard.js';
import { registerGetTeamInfoTool } from './tools/team-info.js';
import { registerGetTeamStatsTool } from './tools/team-stats.js';
import { registerGetTeamRosterTool } from './tools/team-roster.js';

export const SERVER_INFO = {
  name: 'northscore-mcp',
  title: 'Northscore',
  version: '0.0.1',
} as const;

export function createServer(): McpServer {
  const server = new McpServer(SERVER_INFO, {
    instructions:
      'Canadian sports statistics: games, standings, leaderboards, team info/stats/rosters ' +
      'across CEBL, CFL, CPL, HoopQueens, NSL, MWBA, CHL, U SPORTS, OCAA and PSL. ' +
      'For "games today/this week" across leagues use get_games_by_date; for one league\'s ' +
      'schedule use get_games. Entity IDs (league_entity_id, team_entity_id) are stable ' +
      'across tools — use them to correlate results.',
  });

  registerGetGamesByDateTool(server);
  registerGetGamesTool(server);
  registerGetStandingsTool(server);
  registerGetLeaderboardTool(server);
  registerGetTeamInfoTool(server);
  registerGetTeamStatsTool(server);
  registerGetTeamRosterTool(server);

  return server;
}
