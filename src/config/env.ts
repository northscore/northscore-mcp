/**
 * Environment configuration for the Northscore MCP server
 */

// Load .env when present (local dev); hosted environments set vars directly
try {
  process.loadEnvFile();
} catch {
  // no .env file — use the process environment as-is
}

export type TransportMode = 'stdio' | 'http';

// Ordered low → high; the logger relies on this order to filter by severity.
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

interface Config {
  northScoreApiKey: string;
  apiBaseUrl: string;
  transport: TransportMode;
  host: string;
  port: number;
  nodeEnv: string;
  logLevel: LogLevel;
  supabaseJwtSecret: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value ?? defaultValue!;
}

function getTransport(): TransportMode {
  const value = getEnvVar('MCP_TRANSPORT', 'stdio').toLowerCase();
  if (value !== 'stdio' && value !== 'http') {
    throw new Error(`MCP_TRANSPORT must be "stdio" or "http", got "${value}"`);
  }
  return value;
}

function getLogLevel(): LogLevel {
  const value = getEnvVar('LOG_LEVEL', 'info').toLowerCase();
  if (!LOG_LEVELS.includes(value as LogLevel)) {
    throw new Error(`LOG_LEVEL must be one of ${LOG_LEVELS.join(', ')}, got "${value}"`);
  }
  return value as LogLevel;
}

export const config: Config = {
  northScoreApiKey: getEnvVar('NORTHSCORE_STATS_API_KEY'),
  apiBaseUrl: getEnvVar('NORTHSCORE_API_BASE_URL', 'https://api.northscore.ca/api/v1').replace(
    /\/$/,
    '',
  ),
  transport: getTransport(),
  host: getEnvVar('HOST', '127.0.0.1'),
  port: parseInt(getEnvVar('PORT', '3002'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  logLevel: getLogLevel(),
  supabaseJwtSecret: getEnvVar('SUPABASE_JWT_SECRET'),
};

/**
 * Validate derived config that the eager getters above can't guarantee.
 * (Required string vars already throw at module load via getEnvVar.)
 */
export function validateConfig(): void {
  if (Number.isNaN(config.port) || config.port <= 0) {
    throw new Error('PORT must be a positive integer');
  }
}
