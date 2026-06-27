/**
 * Leaderboard service — stat leaders per league.
 */

import type { GenericPlayerLeaderboard, LeaderboardLeague } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildLeaderboardEndpoint, supportsMode } from './api/endpoints.js';
import { normalizeLeaderboard } from './api/normalizers.js';

export interface LeaderboardParams {
  /** PER_GAME or TOTALS — defaults to PER_GAME where the league requires it */
  mode?: 'PER_GAME' | 'TOTALS';
  /** Client-side filter to a single stat (e.g. "points") */
  stat_type?: string;
  /** Max leaders per stat (league-dependent support) */
  limit?: number;
}

export default async function fetchLeaderboard(
  leagueSystem: LeaderboardLeague,
  params?: LeaderboardParams,
): Promise<GenericPlayerLeaderboard[]> {
  const endpoint = buildLeaderboardEndpoint(leagueSystem);
  const queryParams: Record<string, string | number> = {};

  if (supportsMode(leagueSystem)) {
    queryParams.mode = params?.mode ?? 'PER_GAME';
  }
  if (params?.limit) queryParams.limit = params.limit;

  const data = await fetchData<
    | Record<string, GenericPlayerLeaderboard[]>
    | Record<string, Record<string, GenericPlayerLeaderboard[]>>
  >(endpoint, queryParams);

  return normalizeLeaderboard(data, params?.stat_type);
}
