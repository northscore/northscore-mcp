/**
 * Unit tests for tool output schemas
 */

import { describe, it, expect } from 'vitest';
import { standingsSchema, teamInfoSchema, teamStatSchema } from '@/tools/schemas.js';

const team = { id: 'ubc', name: { en: 'UBC' } };

describe('stat value schemas', () => {
  // College *_percentage stats are null when the denominator is 0 (northscore-api#102)
  const stats = { wins: 3, win_percentage: null, streak: 'W2' };

  it('accepts null stat values in standings', () => {
    const row = { team, wins: 3, losses: 0, rank: 1, league_id: 'usports_mbb', stats };
    expect(standingsSchema.safeParse(row).success).toBe(true);
  });

  it('accepts null stat values in team info', () => {
    const row = { team, wins: 3, losses: 0, league_id: 'usports_mbb', stats };
    expect(teamInfoSchema.safeParse(row).success).toBe(true);
  });

  it('accepts null stat values in team stats', () => {
    const row = { team, league_id: 'usports_mbb', stats };
    expect(teamStatSchema.safeParse(row).success).toBe(true);
  });
});
