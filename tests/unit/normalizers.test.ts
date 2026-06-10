/**
 * Unit tests for response normalizers
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeStandings,
  normalizeLeaderboard,
  normalizeTeamStats,
  normalizeAggregateGames,
} from '@/services/api/normalizers.js';
import type {
  GenericGame,
  GenericPlayerLeaderboard,
  GenericStandings,
  GenericTeamStat,
} from '@/types/index.js';

function makeTeam(id: string) {
  return { id, name: { en: id } };
}

function makeStanding(id: string, rank: number): GenericStandings {
  return { team: makeTeam(id), wins: 5, losses: 2, rank, league_id: 'test' };
}

function makeLeader(name: string, statType: string): GenericPlayerLeaderboard {
  return {
    player: { id: name, name },
    value: 10,
    rank: 1,
    league_id: 'test',
    stat_type: statType,
  };
}

function makeGame(id: string, date: string, league: string): GenericGame {
  return {
    id,
    date,
    status: 'SCHEDULED',
    home_team: { team: makeTeam('home') },
    away_team: { team: makeTeam('away') },
    league_id: league,
  };
}

describe('normalizeStandings', () => {
  it('passes arrays through', () => {
    const data = [makeStanding('a', 1), makeStanding('b', 2)];
    expect(normalizeStandings(data)).toEqual(data);
  });

  it('flattens dicts keyed by division', () => {
    const east = [makeStanding('a', 1)];
    const west = [makeStanding('b', 1), makeStanding('c', 2)];
    const result = normalizeStandings({ east, west });
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.team.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('normalizeLeaderboard', () => {
  it('flattens stat-keyed dicts', () => {
    const data = {
      POINTS: [makeLeader('p1', 'POINTS')],
      ASSISTS: [makeLeader('p2', 'ASSISTS')],
    };
    expect(normalizeLeaderboard(data)).toHaveLength(2);
  });

  it('flattens nested category dicts', () => {
    const data = {
      OFFENCE: { POINTS: [makeLeader('p1', 'POINTS')] },
      DEFENCE: { BLOCKS: [makeLeader('p2', 'BLOCKS')] },
    };
    expect(normalizeLeaderboard(data)).toHaveLength(2);
  });

  it('filters by stat type fragment, case-insensitively', () => {
    const data = {
      POINTS_PER_GAME: [makeLeader('p1', 'POINTS_PER_GAME')],
      ASSISTS: [makeLeader('p2', 'ASSISTS')],
    };
    const result = normalizeLeaderboard(data, 'points');
    expect(result).toHaveLength(1);
    expect(result[0]!.player.name).toBe('p1');
  });

  it('returns everything when the stat filter matches nothing', () => {
    const data = { POINTS: [makeLeader('p1', 'POINTS')] };
    expect(normalizeLeaderboard(data, 'goals')).toHaveLength(1);
  });
});

describe('normalizeTeamStats', () => {
  const stat: GenericTeamStat = { team: makeTeam('a'), league_id: 'test' };

  it('extracts a single item when team_name was provided', () => {
    expect(normalizeTeamStats([stat], 'a')).toEqual(stat);
  });

  it('returns arrays unchanged without team_name', () => {
    expect(normalizeTeamStats([stat])).toEqual([stat]);
  });
});

describe('normalizeAggregateGames', () => {
  it('flattens league-keyed games and counts per league', () => {
    const data = {
      cfl: [makeGame('g2', '2026-06-10', 'cfl')],
      cebl: [makeGame('g1', '2026-06-09', 'cebl'), makeGame('g3', '2026-06-11', 'cebl')],
    };
    const { games, leagueCounts } = normalizeAggregateGames(data);
    expect(games).toHaveLength(3);
    expect(leagueCounts).toEqual({ cfl: 1, cebl: 2 });
  });

  it('sorts games by date across leagues', () => {
    const data = {
      cfl: [makeGame('late', '2026-06-12', 'cfl')],
      cebl: [makeGame('early', '2026-06-09', 'cebl')],
    };
    const { games } = normalizeAggregateGames(data);
    expect(games.map((g) => g.id)).toEqual(['early', 'late']);
  });
});
