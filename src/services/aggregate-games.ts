/**
 * Aggregate games service — cross-league games for a date range.
 */

import type { AggregateGames, AggregateScope, GenericGame } from '../types/index.js';
import { fetchData } from './api/client.js';
import { buildAggregateGamesEndpoint } from './api/endpoints.js';
import { normalizeAggregateGames } from './api/normalizers.js';

export interface AggregateGamesResult {
  games: GenericGame[];
  leagueCounts: Record<string, number>;
}

export default async function fetchAggregateGames(
  scope: AggregateScope,
  startDate: string,
  endDate: string,
): Promise<AggregateGamesResult> {
  const endpoint = buildAggregateGamesEndpoint(scope);
  const data = await fetchData<AggregateGames>(endpoint, {
    start_date: startDate,
    end_date: endDate,
  });
  return normalizeAggregateGames(data);
}
