/**
 * Endpoint builders for the NorthScore API.
 *
 * Maps MCP league identifiers (underscored, e.g. `psl_opl_1_mens`) to API
 * paths (e.g. `/psl/opl-1-mens/games`) and encodes team names safely.
 */

import {
  CHL_LEAGUES,
  LEADERBOARD_LEAGUES,
  OCAA_LEAGUES,
  PSL_LEAGUES,
  SIMPLE_LEAGUES,
  TEAM_ROSTER_LEAGUES,
  TEAM_STATS_LEAGUES,
  USPORTS_LEAGUES,
} from '../../constants/leagues.js';
import type { AggregateScope, LeagueSystem } from '../../constants/leagues.js';

/** College sport-code → sport path segment (U SPORTS and OCAA) */
const LEAGUE_TO_SPORT_MAP: Record<string, string> = {
  mbb: 'basketball',
  wbb: 'basketball',
  mvb: 'volleyball',
  wvb: 'volleyball',
  mfb: 'football',
  msoc: 'soccer',
  wsoc: 'soccer',
  mhky: 'ice_hockey',
  whky: 'ice_hockey',
};

export interface ParsedLeagueSystem {
  family: 'simple' | 'chl' | 'usports' | 'ocaa' | 'psl';
  /** API base path for the league, e.g. `/usports/basketball/mbb` */
  basePath: string;
}

/**
 * Membership check that widens the `as const` league tuples to plain string
 * arrays, so any LeagueSystem can be tested without type assertions.
 */
function includes(haystack: readonly string[], needle: string): boolean {
  return haystack.includes(needle);
}

/**
 * Parse an MCP league identifier into its family and API base path.
 */
export function parseLeagueSystem(leagueSystem: LeagueSystem): ParsedLeagueSystem {
  if (includes(SIMPLE_LEAGUES, leagueSystem)) {
    return { family: 'simple', basePath: `/${leagueSystem}` };
  }

  if (includes(CHL_LEAGUES, leagueSystem)) {
    const league = leagueSystem.replace('chl_', '');
    return { family: 'chl', basePath: `/chl/${league}` };
  }

  if (includes(USPORTS_LEAGUES, leagueSystem) || includes(OCAA_LEAGUES, leagueSystem)) {
    const [family, league] = leagueSystem.split('_') as [string, string];
    const sport = LEAGUE_TO_SPORT_MAP[league];
    if (!sport) {
      throw new Error(`Unknown ${family.toUpperCase()} league code: ${league}`);
    }
    return {
      family: family as 'usports' | 'ocaa',
      basePath: `/${family}/${sport}/${league}`,
    };
  }

  if (includes(PSL_LEAGUES, leagueSystem)) {
    const slug = leagueSystem.replace('psl_', '').replaceAll('_', '-');
    return { family: 'psl', basePath: `/psl/${slug}` };
  }

  throw new Error(
    `Unsupported league system: ${leagueSystem}. ` +
      `Supported families: cebl, cfl, cpl, hoopqueens, nsl, mwba, chl_*, usports_*, ocaa_*, psl_*.`,
  );
}

/**
 * Guard for endpoints that only some league families expose.
 * Throws with the full list of supported leagues so callers (and the LLM)
 * can self-correct.
 */
function assertSupported(
  leagueSystem: LeagueSystem,
  supported: readonly string[],
  capability: string,
): void {
  if (!includes(supported, leagueSystem)) {
    throw new Error(
      `${leagueSystem} does not support ${capability}. Supported leagues: ${supported.join(', ')}.`,
    );
  }
}

/**
 * Games / schedule endpoint. MWBA exposes its schedule at /mwba/schedule.
 */
export function buildGamesEndpoint(leagueSystem: LeagueSystem): string {
  const { basePath } = parseLeagueSystem(leagueSystem);
  return leagueSystem === 'mwba' ? `${basePath}/schedule` : `${basePath}/games`;
}

/** Standings endpoint — available for every league family. */
export function buildStandingsEndpoint(leagueSystem: LeagueSystem): string {
  return `${parseLeagueSystem(leagueSystem).basePath}/standings`;
}

/** Leaderboard endpoint — not available for NSL, MWBA, CHL or PSL. */
export function buildLeaderboardEndpoint(leagueSystem: LeagueSystem): string {
  assertSupported(leagueSystem, LEADERBOARD_LEAGUES, 'leaderboards (get_leaderboard)');
  return `${parseLeagueSystem(leagueSystem).basePath}/leaderboard`;
}

/** Team statistics endpoint — not available for MWBA or PSL. */
export function buildTeamStatsEndpoint(leagueSystem: LeagueSystem): string {
  assertSupported(leagueSystem, TEAM_STATS_LEAGUES, 'team statistics (get_team_stats)');
  return `${parseLeagueSystem(leagueSystem).basePath}/teams/statistics`;
}

/** Team info endpoint — team name is URL-encoded (handles "Queen's" etc.). */
export function buildTeamInfoEndpoint(leagueSystem: LeagueSystem, teamName: string): string {
  const { basePath } = parseLeagueSystem(leagueSystem);
  return `${basePath}/teams/${encodeURIComponent(teamName)}/info`;
}

/** Team roster endpoint — not available for NSL, CHL or PSL. */
export function buildTeamRosterEndpoint(leagueSystem: LeagueSystem, teamName: string): string {
  assertSupported(leagueSystem, TEAM_ROSTER_LEAGUES, 'rosters (get_team_roster)');
  const { basePath } = parseLeagueSystem(leagueSystem);
  return `${basePath}/teams/${encodeURIComponent(teamName)}/roster`;
}

/**
 * Cross-league aggregate games endpoint — /aggregate/games/{scope}.
 */
export function buildAggregateGamesEndpoint(scope: AggregateScope): string {
  return `/aggregate/games/${scope}`;
}

/** League prefixes whose endpoints accept a PER_GAME/TOTALS `mode` param */
const MODE_LEAGUE_PREFIXES = ['cebl', 'usports_'];

/**
 * Whether a league's leaderboard/team-stats/roster endpoint takes a `mode`
 * query param (required for CEBL, supported by U SPORTS).
 */
export function supportsMode(leagueSystem: string): boolean {
  return MODE_LEAGUE_PREFIXES.some((prefix) => leagueSystem.startsWith(prefix));
}
