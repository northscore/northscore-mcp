/**
 * Northscore API services — centralized exports.
 */

export { NorthScoreApiClientError } from './api/client.js';

export { default as fetchGames } from './games.js';
export { default as fetchStandings } from './standings.js';
export { default as fetchLeaderboard } from './leaderboard.js';
export { default as fetchTeamStats } from './team-stats.js';
export { default as fetchTeamInfo } from './team-info.js';
export { default as fetchTeamRoster } from './team-roster.js';
export { default as fetchAggregateGames } from './aggregate-games.js';
