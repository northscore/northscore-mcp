/**
 * Team info service — record, division, rank, streak.
 */

import type { GenericTeamInfo, LeagueSystem } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildTeamInfoEndpoint } from './api/endpoints.js';

export default async function fetchTeamInfo(
  leagueSystem: LeagueSystem,
  teamName: string,
): Promise<GenericTeamInfo> {
  const endpoint = buildTeamInfoEndpoint(leagueSystem, teamName);
  return fetchData<GenericTeamInfo>(endpoint);
}
