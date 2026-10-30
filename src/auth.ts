/**
 * Bearer-token verifier for Supabase-issued JWTs (HS256).
 *
 * Plugged into the SDK's `requireBearerAuth`, which handles header parsing,
 * expiry checks, and the 401 + `WWW-Authenticate` challenge.
 */

import { jwtVerify } from 'jose';
import { OAuthError, OAuthErrorCode, type OAuthTokenVerifier } from '@modelcontextprotocol/server';
import { logger } from './logger.js';

export function createJwtVerifier(secret: string): OAuthTokenVerifier {
  const key = new TextEncoder().encode(secret);

  return {
    async verifyAccessToken(token) {
      try {
        const { payload } = await jwtVerify(token, key, {
          algorithms: ['HS256'],
          requiredClaims: ['sub', 'exp'],
        });
        return {
          token,
          clientId: payload.sub!,
          scopes: [],
          expiresAt: payload.exp!,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'JWT validation failed';
        logger.warn('JWT validation failed', { error: message });
        throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid or expired token');
      }
    },
  };
}
