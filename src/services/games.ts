/**
 * Games service — single-league schedules and scores.
 */

import type { GenericGame, LeagueSystem } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildGamesEndpoint } from './api/endpoints.js';

export interface GamesParams {
  /** Filter to a specific team (query param, league-specific naming) */
  team_name?: string;
  /** Season year — PSL only (e.g. 2026) */
  year?: number;
  /** Season label — MWBA/NSL only */
  season?: string;
}

export default async function fetchGames(
  leagueSystem: LeagueSystem,
  params?: GamesParams,
): Promise<GenericGame[]> {
  const endpoint = buildGamesEndpoint(leagueSystem);
  const queryParams: Record<string, string | number> = {};

  if (params?.team_name) queryParams.team_name = params.team_name;
  if (params?.year) queryParams.year = params.year;
  if (params?.season) queryParams.season = params.season;

  return fetchData<GenericGame[]>(endpoint, queryParams);
}
