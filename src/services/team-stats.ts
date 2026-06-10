/**
 * Team statistics service.
 */

import type { GenericTeamStat, TeamStatsLeague } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildTeamStatsEndpoint, supportsMode } from './api/endpoints.js';
import { normalizeTeamStats } from './api/normalizers.js';

export interface TeamStatsParams {
  /** Filter to a specific team (query param) */
  team_name?: string;
  /** PER_GAME or TOTALS — defaults to PER_GAME where the league requires it */
  mode?: 'PER_GAME' | 'TOTALS';
}

export default async function fetchTeamStats(
  leagueSystem: TeamStatsLeague,
  params?: TeamStatsParams,
): Promise<GenericTeamStat | GenericTeamStat[]> {
  const endpoint = buildTeamStatsEndpoint(leagueSystem);
  const queryParams: Record<string, string | number> = {};

  if (supportsMode(leagueSystem)) {
    queryParams.mode = params?.mode ?? 'PER_GAME';
  }
  if (params?.team_name) queryParams.team_name = params.team_name;

  const data = await fetchData<GenericTeamStat[] | GenericTeamStat>(endpoint, queryParams);
  return normalizeTeamStats(data, params?.team_name);
}
