/**
 * Standings service.
 */

import type { GenericStandings, LeagueSystem } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildStandingsEndpoint } from './api/endpoints.js';
import { normalizeStandings } from './api/normalizers.js';

export default async function fetchStandings(
  leagueSystem: LeagueSystem,
): Promise<GenericStandings[]> {
  const endpoint = buildStandingsEndpoint(leagueSystem);
  const data = await fetchData<GenericStandings[] | Record<string, GenericStandings[]>>(endpoint);
  return normalizeStandings(data);
}
