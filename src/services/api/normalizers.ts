/**
 * Response normalizers for the NorthScore API.
 * Response shapes vary by league (arrays vs keyed dicts) — normalize to
 * consistent shapes for the tool layer.
 */

import type {
  AggregateGames,
  GenericGame,
  GenericPlayerLeaderboard,
  GenericStandings,
  GenericTeamStat,
} from '../../types/index.js';

/**
 * Standings: some leagues return arrays, some return dicts keyed by
 * division/conference — flatten to a single array.
 */
export function normalizeStandings(
  data: GenericStandings[] | Record<string, GenericStandings[]>,
): GenericStandings[] {
  if (Array.isArray(data)) {
    return data;
  }

  const standings: GenericStandings[] = [];
  for (const group of Object.values(data)) {
    if (Array.isArray(group)) {
      standings.push(...group);
    }
  }
  return standings;
}

/**
 * Leaderboard: API returns a dict keyed by stat name (sometimes nested one
 * level, e.g. category → stat). Flatten, optionally filtering to one stat.
 */
export function normalizeLeaderboard(
  data:
    | Record<string, GenericPlayerLeaderboard[]>
    | Record<string, Record<string, GenericPlayerLeaderboard[]>>,
  statType?: string,
): GenericPlayerLeaderboard[] {
  const flatData: Record<string, GenericPlayerLeaderboard[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      flatData[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      const nested = value as Record<string, GenericPlayerLeaderboard[]>;
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        if (Array.isArray(nestedValue)) {
          flatData[`${key}_${nestedKey}`] = nestedValue;
        }
      }
    }
  }

  if (statType) {
    const match = Object.keys(flatData).find((key) =>
      key.toLowerCase().includes(statType.toLowerCase()),
    );
    if (match) {
      return flatData[match] ?? [];
    }
  }

  const leaders: GenericPlayerLeaderboard[] = [];
  for (const statLeaders of Object.values(flatData)) {
    leaders.push(...statLeaders);
  }
  return leaders;
}

/**
 * Team stats: when team_name is provided the API returns a single-item list —
 * extract the item.
 */
export function normalizeTeamStats(
  data: GenericTeamStat[] | GenericTeamStat,
  teamName?: string,
): GenericTeamStat | GenericTeamStat[] {
  if (teamName && Array.isArray(data) && data.length > 0) {
    return data[0]!;
  }
  return data;
}

/**
 * Aggregate games: flatten { league: games[] } to a single array, retaining
 * each game's league_id, plus per-league counts for context.
 */
export function normalizeAggregateGames(data: AggregateGames): {
  games: GenericGame[];
  leagueCounts: Record<string, number>;
} {
  const games: GenericGame[] = [];
  const leagueCounts: Record<string, number> = {};

  for (const [league, leagueGames] of Object.entries(data)) {
    if (Array.isArray(leagueGames)) {
      leagueCounts[league] = leagueGames.length;
      games.push(...leagueGames);
    }
  }

  games.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  return { games, leagueCounts };
}
