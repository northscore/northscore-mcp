/**
 * Centralized type exports.
 *
 * Domain types are aliased from src/types/generated.ts, which is produced
 * from the live NorthScore OpenAPI spec (`pnpm gen:types`). Do not hand-edit
 * generated.ts — regenerate it when the API changes.
 */

import type { components } from './generated.js';

// API wrapper types
export type { StandardResponse, ApiError, ValidationErrorDetail } from './api.js';
export { isApiError } from './api.js';

// Domain types (generated from OpenAPI)
export type GenericGame = components['schemas']['GenericGame'];
export type GenericStandings = components['schemas']['GenericStandings'];
export type GenericTeamInfo = components['schemas']['GenericTeamInfo'];
export type GenericTeamStat = components['schemas']['GenericTeamStat'];
export type GenericTeamRoster = components['schemas']['GenericTeamRoster'];
export type GenericRosterPlayer = components['schemas']['GenericRosterPlayer'];
export type GenericPlayerLeaderboard = components['schemas']['GenericPlayerLeaderboard'];
export type TeamInfo = components['schemas']['TeamInfo'];
export type TeamScore = components['schemas']['TeamScore'];
export type PlayerInfo = components['schemas']['PlayerInfo'];
export type PlayerProfile = components['schemas']['PlayerProfile'];
export type LocalizedText = components['schemas']['LocalizedText'];
export type GameStatus = components['schemas']['GameStatus'];
export type GameCompetition = components['schemas']['GameCompetition'];

/** Aggregate games response: league id → games */
export type AggregateGames = Record<string, GenericGame[]>;

// League system types
export type {
  SimpleLeague,
  ChlLeague,
  USportsLeague,
  OcaaLeague,
  PslLeague,
  LeagueSystem,
  LeaderboardLeague,
  TeamStatsLeague,
  TeamRosterLeague,
  AggregateScope,
} from '../constants/leagues.js';
