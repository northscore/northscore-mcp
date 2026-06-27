/**
 * JWT validation for Supabase-issued tokens.
 */

import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config/env.js';
import { logger } from './logger.js';

interface JwtPayload {
  sub: string;
  aud: string;
  exp: number;
  iat: number;
}

export function validateJwt(req: Request): { userId: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.supabaseJwtSecret, {
      algorithms: ['HS256'],
    }) as unknown as JwtPayload;

    if (!payload.sub) {
      throw new Error('JWT missing sub (user ID)');
    }

    return { userId: payload.sub };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JWT validation failed';
    logger.warn('JWT validation failed', { error: message });
    throw new Error(message);
  }
}
