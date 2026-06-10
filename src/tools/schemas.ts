/**
 * Shared Zod schemas for tool output validation.
 * These mirror the generated OpenAPI types (src/types/generated.ts) so MCP
 * clients receive validated, typed structured content.
 */

import { z } from 'zod';

export const localizedTextSchema = z.object({
  en: z.string().describe('English text'),
  fr: z.string().nullish().describe('French text'),
});

export const teamIdentitySchema = z.object({
  id: z.string().describe('Team identifier'),
  name: localizedTextSchema.describe('Team name (bilingual)'),
  short_name: localizedTextSchema.nullish(),
  abbreviation: z.string().nullish(),
  team_entity_id: z
    .string()
    .nullish()
    .describe('Cross-platform team entity identifier — stable across tools and leagues'),
});

export const teamScoreSchema = z.object({
  team: teamIdentitySchema,
  score: z.number().nullish(),
});

export const gameSchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  id: z.string().describe('Unique game identifier'),
  livestats_id: z.string().nullish(),
  slug: z.string().nullish().describe('Human-readable game slug'),
  date: z.string().nullish().describe('ISO 8601 date/time of the game'),
  status: z.string().describe('SCHEDULED | LIVE | FINAL | POSTPONED | CANCELLED | ...'),
  home_team: teamScoreSchema,
  away_team: teamScoreSchema,
  league_id: z.string().describe('League identifier'),
  competition: z.string().nullish().describe('REGULAR | PLAYOFFS | CHAMPIONSHIP | ...'),
  venue: z.string().nullish(),
  broadcast: z.array(z.string()).optional(),
  sport: z.string().nullish(),
});

export const standingsSchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  team: teamIdentitySchema,
  wins: z.number(),
  losses: z.number(),
  rank: z.number(),
  league_id: z.string(),
  division: z.string().nullish(),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export const teamInfoSchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  team: teamIdentitySchema,
  wins: z.number(),
  losses: z.number(),
  league_id: z.string(),
  division: z.string().nullish(),
  rank: z.number().nullish(),
  streak: z.string().nullish(),
  tickets_url: z.string().nullish(),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export const teamStatSchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  team: teamIdentitySchema,
  league_id: z.string(),
  games_played: z.number().nullish(),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  rankings: z.record(z.string(), z.number()).optional(),
});

export const playerInfoSchema = z.object({
  id: z.string().describe('Player identifier'),
  name: z.string(),
  position: z.string().nullish(),
  jersey_number: z.string().nullish(),
  photo_url: z.string().nullish(),
});

export const leaderboardEntrySchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  player: playerInfoSchema,
  team: teamIdentitySchema.nullish(),
  value: z.number().describe('Statistical value achieved'),
  rank: z.number(),
  league_id: z.string(),
  stat_type: z.string().describe('Type of statistic (e.g. POINTS)'),
  category: z.string().nullish().describe('Grouping category (e.g. OFFENCE, DEFENCE)'),
});

export const rosterPlayerSchema = z.object({
  player: playerInfoSchema,
  games_played: z.number(),
  stats: z.record(z.string(), z.unknown()).optional(),
  profile: z.record(z.string(), z.unknown()).nullish().describe('Biographical info'),
});

export const teamRosterSchema = z.object({
  league_entity_id: z.string().nullish().describe('Cross-platform league entity identifier'),
  team: teamIdentitySchema,
  league_id: z.string(),
  players: z.array(rosterPlayerSchema).optional(),
});
