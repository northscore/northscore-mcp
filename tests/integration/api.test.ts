/**
 * Integration smoke test — one real API call per league family + aggregate.
 *
 * Manual-only (not part of `pnpm test`). Requires the NorthScore API running
 * locally and a valid .env. Run with: pnpm test:integration
 */

import {
  fetchGames,
  fetchStandings,
  fetchLeaderboard,
  fetchTeamStats,
  fetchTeamInfo,
  fetchTeamRoster,
  fetchAggregateGames,
} from '../../src/services/index.js';

let passed = 0;
let failed = 0;

async function check(name: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    const result = await fn();
    const count = Array.isArray(result)
      ? result.length
      : typeof result === 'object' && result !== null && 'games' in result
        ? (result as { games: unknown[] }).games.length
        : 1;
    console.log(`✅ ${name} (${count} item${count === 1 ? '' : 's'})`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());

// One smoke call per league family, exercising each path quirk
await check('CEBL games', () => fetchGames('cebl'));
await check('CFL standings', () => fetchStandings('cfl'));
await check('CPL leaderboard', () => fetchLeaderboard('cpl'));
await check('HoopQueens standings', () => fetchStandings('hoopqueens'));
await check('NSL team stats', () => fetchTeamStats('nsl'));
await check('MWBA games (via /schedule)', () => fetchGames('mwba'));
await check('CHL (OHL) standings', () => fetchStandings('chl_ohl'));
await check('U SPORTS mbb standings', () => fetchStandings('usports_mbb'));
await check('OCAA mvb standings', () => fetchStandings('ocaa_mvb'));
await check('PSL opl-1-mens games (slug mapping)', () => fetchGames('psl_opl_1_mens'));

// Aggregate scopes
await check('Aggregate pro games (today)', () => fetchAggregateGames('pro', today, today));
await check('Aggregate usports games (today)', () => fetchAggregateGames('usports', today, today));
await check('Aggregate ocaa games (today)', () => fetchAggregateGames('ocaa', today, today));

// Team-specific paths incl. URL encoding
await check('CEBL team info (brampton)', () => fetchTeamInfo('cebl', 'brampton'));
await check("U SPORTS team info (Queen's — URL encoding)", () =>
  fetchTeamInfo('usports_mbb', "Queen's"),
);
await check('CHL team info (london-knights)', () => fetchTeamInfo('chl_ohl', 'london-knights'));
await check('CFL roster (alouettes)', () => fetchTeamRoster('cfl', 'alouettes'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
