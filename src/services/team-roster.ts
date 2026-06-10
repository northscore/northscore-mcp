/**
 * Team roster service.
 */

import type { GenericTeamRoster, TeamRosterLeague } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildTeamRosterEndpoint } from './api/endpoints.js';

export interface TeamRosterParams {
  /** PER_GAME or TOTALS — required by CEBL, defaults to PER_GAME */
  mode?: 'PER_GAME' | 'TOTALS';
}

/** Leagues whose roster endpoint takes a mode param (required for CEBL) */
const MODE_LEAGUES_PREFIXES = ['cebl', 'usports_'];

export default async function fetchTeamRoster(
  leagueSystem: TeamRosterLeague,
  teamName: string,
  params?: TeamRosterParams,
): Promise<GenericTeamRoster> {
  const endpoint = buildTeamRosterEndpoint(leagueSystem, teamName);
  const queryParams: Record<string, string> = {};

  const supportsMode = MODE_LEAGUES_PREFIXES.some((prefix) => leagueSystem.startsWith(prefix));
  if (supportsMode) {
    queryParams.mode = params?.mode ?? 'PER_GAME';
  }

  return fetchData<GenericTeamRoster>(endpoint, queryParams);
}
