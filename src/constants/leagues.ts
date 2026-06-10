/**
 * League system identifiers — single source of truth.
 *
 * MCP identifiers use underscores (e.g. `psl_opl_1_mens`); the endpoint
 * builders map them to API path segments (e.g. `/psl/opl-1-mens`).
 * Per-tool enums below include only the league families each NorthScore
 * endpoint actually supports, so unsupported leagues never appear as
 * valid options to the model.
 */

/** Pro/simple leagues mounted directly at /{league} */
export const SIMPLE_LEAGUES = ['cebl', 'cfl', 'cpl', 'hoopqueens', 'nsl', 'mwba'] as const;

/** CHL hockey leagues — path /chl/{league} */
export const CHL_LEAGUES = ['chl_ohl', 'chl_whl', 'chl_qjmhl'] as const;

/** U SPORTS leagues — path /usports/{sport}/{league} */
export const USPORTS_LEAGUES = [
  'usports_mbb',
  'usports_wbb',
  'usports_mvb',
  'usports_wvb',
  'usports_mfb',
  'usports_msoc',
  'usports_wsoc',
  'usports_mhky',
  'usports_whky',
] as const;

/** OCAA leagues — path /ocaa/{sport}/{league} */
export const OCAA_LEAGUES = [
  'ocaa_mbb',
  'ocaa_wbb',
  'ocaa_mvb',
  'ocaa_wvb',
  'ocaa_msoc',
  'ocaa_wsoc',
] as const;

/** PSL soccer sub-leagues — path /psl/{league} (hyphenated slugs) */
export const PSL_LEAGUES = [
  'psl_ppl_mens',
  'psl_ppl_womens',
  'psl_apl_mens',
  'psl_apl_womens',
  'psl_bcpl_mens',
  'psl_bcpl_womens',
  'psl_opl_1_mens',
  'psl_opl_1_womens',
  'psl_opl_2_mens',
  'psl_opl_2_womens',
  'psl_opl_3_mens',
  'psl_opl_3_womens',
  'psl_opl_u20_mens',
  'psl_opl_u20_womens',
] as const;

/** Every supported league system (get_games, get_standings, get_team_info) */
export const ALL_LEAGUES = [
  ...SIMPLE_LEAGUES,
  ...CHL_LEAGUES,
  ...USPORTS_LEAGUES,
  ...OCAA_LEAGUES,
  ...PSL_LEAGUES,
] as const;

/** Leagues with a /leaderboard endpoint */
export const LEADERBOARD_LEAGUES = [
  'cebl',
  'cfl',
  'cpl',
  'hoopqueens',
  ...USPORTS_LEAGUES,
  ...OCAA_LEAGUES,
] as const;

/** Leagues with a /teams/statistics endpoint (all except MWBA and PSL) */
export const TEAM_STATS_LEAGUES = [
  'cebl',
  'cfl',
  'cpl',
  'hoopqueens',
  'nsl',
  ...CHL_LEAGUES,
  ...USPORTS_LEAGUES,
  ...OCAA_LEAGUES,
] as const;

/** Leagues with a /teams/{team}/roster endpoint (all except NSL, CHL and PSL) */
export const TEAM_ROSTER_LEAGUES = [
  'cebl',
  'cfl',
  'cpl',
  'hoopqueens',
  'mwba',
  ...USPORTS_LEAGUES,
  ...OCAA_LEAGUES,
] as const;

/** Cross-league aggregate scopes — /aggregate/games/{scope} */
export const AGGREGATE_SCOPES = ['pro', 'usports', 'ocaa'] as const;

export type SimpleLeague = (typeof SIMPLE_LEAGUES)[number];
export type ChlLeague = (typeof CHL_LEAGUES)[number];
export type USportsLeague = (typeof USPORTS_LEAGUES)[number];
export type OcaaLeague = (typeof OCAA_LEAGUES)[number];
export type PslLeague = (typeof PSL_LEAGUES)[number];
export type LeagueSystem = (typeof ALL_LEAGUES)[number];
export type LeaderboardLeague = (typeof LEADERBOARD_LEAGUES)[number];
export type TeamStatsLeague = (typeof TEAM_STATS_LEAGUES)[number];
export type TeamRosterLeague = (typeof TEAM_ROSTER_LEAGUES)[number];
export type AggregateScope = (typeof AGGREGATE_SCOPES)[number];
