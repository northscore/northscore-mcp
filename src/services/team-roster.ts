/**
 * Team roster service.
 */

import type { GenericTeamRoster, TeamRosterLeague } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildTeamRosterEndpoint, supportsMode } from './api/endpoints.js';

export interface TeamRosterParams {
  /** PER_GAME or TOTALS — required by CEBL, defaults to PER_GAME */
  mode?: 'PER_GAME' | 'TOTALS';
}

export default async function fetchTeamRoster(
  leagueSystem: TeamRosterLeague,
  teamName: string,
  params?: TeamRosterParams,
): Promise<GenericTeamRoster> {
  const endpoint = buildTeamRosterEndpoint(leagueSystem, teamName);
  const queryParams: Record<string, string> = {};

  if (supportsMode(leagueSystem)) {
    queryParams.mode = params?.mode ?? 'PER_GAME';
  }

  return fetchData<GenericTeamRoster>(endpoint, queryParams);
}
