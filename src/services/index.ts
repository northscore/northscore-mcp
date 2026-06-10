/**
 * NorthScore API services — centralized exports.
 */

// Core API utilities
export { fetchData, NorthScoreApiClientError, ValidationError } from './api/client.js';
export {
  parseLeagueSystem,
  buildGamesEndpoint,
  buildStandingsEndpoint,
  buildLeaderboardEndpoint,
  buildTeamStatsEndpoint,
  buildTeamInfoEndpoint,
  buildTeamRosterEndpoint,
  buildAggregateGamesEndpoint,
  supportsMode,
} from './api/endpoints.js';
export {
  normalizeStandings,
  normalizeLeaderboard,
  normalizeTeamStats,
  normalizeAggregateGames,
} from './api/normalizers.js';

// Service functions
export { default as fetchGames } from './games.js';
export { default as fetchStandings } from './standings.js';
export { default as fetchLeaderboard } from './leaderboard.js';
export { default as fetchTeamStats } from './team-stats.js';
export { default as fetchTeamInfo } from './team-info.js';
export { default as fetchTeamRoster } from './team-roster.js';
export { default as fetchAggregateGames } from './aggregate-games.js';

// Service param types
export type { GamesParams } from './games.js';
export type { LeaderboardParams } from './leaderboard.js';
export type { TeamStatsParams } from './team-stats.js';
export type { TeamRosterParams } from './team-roster.js';
export type { AggregateGamesResult } from './aggregate-games.js';
