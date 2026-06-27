/**
 * Unit tests for league parsing and endpoint builders
 */

import { describe, it, expect } from 'vitest';
import {
  parseLeagueSystem,
  buildGamesEndpoint,
  buildStandingsEndpoint,
  buildLeaderboardEndpoint,
  buildTeamStatsEndpoint,
  buildTeamInfoEndpoint,
  buildTeamRosterEndpoint,
  buildAggregateGamesEndpoint,
} from '@/services/api/endpoints.js';
import { ALL_LEAGUES } from '@/constants/leagues.js';
import type { LeagueSystem } from '@/constants/leagues.js';

describe('parseLeagueSystem', () => {
  it('parses every supported league without throwing', () => {
    for (const league of ALL_LEAGUES) {
      expect(() => parseLeagueSystem(league)).not.toThrow();
    }
  });

  it('parses simple leagues', () => {
    expect(parseLeagueSystem('cebl')).toEqual({ family: 'simple', basePath: '/cebl' });
    expect(parseLeagueSystem('nsl')).toEqual({ family: 'simple', basePath: '/nsl' });
    expect(parseLeagueSystem('mwba')).toEqual({ family: 'simple', basePath: '/mwba' });
  });

  it('parses CHL leagues', () => {
    expect(parseLeagueSystem('chl_ohl')).toEqual({ family: 'chl', basePath: '/chl/ohl' });
    expect(parseLeagueSystem('chl_qjmhl')).toEqual({ family: 'chl', basePath: '/chl/qjmhl' });
  });

  it('parses U SPORTS leagues with sport segment', () => {
    expect(parseLeagueSystem('usports_mbb')).toEqual({
      family: 'usports',
      basePath: '/usports/basketball/mbb',
    });
    expect(parseLeagueSystem('usports_whky')).toEqual({
      family: 'usports',
      basePath: '/usports/ice_hockey/whky',
    });
  });

  it('parses OCAA leagues including men’s volleyball', () => {
    expect(parseLeagueSystem('ocaa_mvb')).toEqual({
      family: 'ocaa',
      basePath: '/ocaa/volleyball/mvb',
    });
  });

  it('parses PSL leagues to hyphenated slugs', () => {
    expect(parseLeagueSystem('psl_ppl_mens')).toEqual({ family: 'psl', basePath: '/psl/ppl-mens' });
    expect(parseLeagueSystem('psl_opl_1_womens')).toEqual({
      family: 'psl',
      basePath: '/psl/opl-1-womens',
    });
    expect(parseLeagueSystem('psl_opl_u20_mens')).toEqual({
      family: 'psl',
      basePath: '/psl/opl-u20-mens',
    });
  });

  it('throws an actionable error for unknown leagues', () => {
    expect(() => parseLeagueSystem('nhl' as LeagueSystem)).toThrow(/Unsupported league system/);
  });
});

describe('buildGamesEndpoint', () => {
  it('builds standard games paths', () => {
    expect(buildGamesEndpoint('cfl')).toBe('/cfl/games');
    expect(buildGamesEndpoint('chl_whl')).toBe('/chl/whl/games');
    expect(buildGamesEndpoint('usports_msoc')).toBe('/usports/soccer/msoc/games');
    expect(buildGamesEndpoint('psl_apl_womens')).toBe('/psl/apl-womens/games');
  });

  it('uses /schedule for MWBA', () => {
    expect(buildGamesEndpoint('mwba')).toBe('/mwba/schedule');
  });
});

describe('buildStandingsEndpoint', () => {
  it('builds standings paths for all families', () => {
    expect(buildStandingsEndpoint('nsl')).toBe('/nsl/standings');
    expect(buildStandingsEndpoint('chl_ohl')).toBe('/chl/ohl/standings');
    expect(buildStandingsEndpoint('ocaa_wsoc')).toBe('/ocaa/soccer/wsoc/standings');
    expect(buildStandingsEndpoint('psl_bcpl_mens')).toBe('/psl/bcpl-mens/standings');
  });
});

describe('buildLeaderboardEndpoint', () => {
  it('builds paths for supported leagues', () => {
    expect(buildLeaderboardEndpoint('cebl')).toBe('/cebl/leaderboard');
    expect(buildLeaderboardEndpoint('usports_wbb')).toBe('/usports/basketball/wbb/leaderboard');
  });

  it('rejects leagues without leaderboards', () => {
    expect(() => buildLeaderboardEndpoint('nsl')).toThrow(/does not support leaderboards/);
    expect(() => buildLeaderboardEndpoint('chl_ohl')).toThrow(/does not support leaderboards/);
  });
});

describe('buildTeamStatsEndpoint', () => {
  it('builds paths for supported leagues', () => {
    expect(buildTeamStatsEndpoint('chl_ohl')).toBe('/chl/ohl/teams/statistics');
    expect(buildTeamStatsEndpoint('nsl')).toBe('/nsl/teams/statistics');
  });

  it('rejects MWBA and PSL', () => {
    expect(() => buildTeamStatsEndpoint('mwba')).toThrow(/does not support team statistics/);
    expect(() => buildTeamStatsEndpoint('psl_ppl_mens')).toThrow(
      /does not support team statistics/,
    );
  });
});

describe('buildTeamInfoEndpoint', () => {
  it('URL-encodes team names', () => {
    expect(buildTeamInfoEndpoint('usports_mbb', "Queen's")).toBe(
      "/usports/basketball/mbb/teams/Queen's/info".replace("Queen's", encodeURIComponent("Queen's")),
    );
    expect(buildTeamInfoEndpoint('usports_mbb', 'St. Lawrence (K)')).toBe(
      `/usports/basketball/mbb/teams/${encodeURIComponent('St. Lawrence (K)')}/info`,
    );
  });

  it('builds slug-league paths', () => {
    expect(buildTeamInfoEndpoint('chl_ohl', 'london-knights')).toBe(
      '/chl/ohl/teams/london-knights/info',
    );
    expect(buildTeamInfoEndpoint('psl_opl_1_mens', 'vaughan-azzurri')).toBe(
      '/psl/opl-1-mens/teams/vaughan-azzurri/info',
    );
  });
});

describe('buildTeamRosterEndpoint', () => {
  it('builds paths for supported leagues', () => {
    expect(buildTeamRosterEndpoint('mwba', 'halifax-thunder')).toBe(
      '/mwba/teams/halifax-thunder/roster',
    );
    expect(buildTeamRosterEndpoint('cfl', 'alouettes')).toBe('/cfl/teams/alouettes/roster');
  });

  it('rejects NSL, CHL and PSL', () => {
    expect(() => buildTeamRosterEndpoint('nsl', 'afc-toronto')).toThrow(/does not support rosters/);
    expect(() => buildTeamRosterEndpoint('chl_whl', 'regina-pats')).toThrow(
      /does not support rosters/,
    );
  });
});

describe('buildAggregateGamesEndpoint', () => {
  it('builds aggregate scope paths', () => {
    expect(buildAggregateGamesEndpoint('pro')).toBe('/aggregate/games/pro');
    expect(buildAggregateGamesEndpoint('usports')).toBe('/aggregate/games/usports');
    expect(buildAggregateGamesEndpoint('ocaa')).toBe('/aggregate/games/ocaa');
  });
});
