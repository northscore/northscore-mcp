/**
 * Unit tests for the JWT bearer-token verifier
 */

import { describe, it, expect } from 'vitest';
import { SignJWT, type JWTPayload } from 'jose';
import { OAuthError, OAuthErrorCode } from '@modelcontextprotocol/server';
import { createJwtVerifier } from '@/auth.js';

const SECRET = 'test-secret';
const verifier = createJwtVerifier(SECRET);

function sign(
  payload: JWTPayload,
  {
    secret = SECRET,
    alg = 'HS256',
    exp = '5m',
  }: { secret?: string; alg?: string; exp?: string | null } = {},
): Promise<string> {
  const jwt = new SignJWT(payload).setProtectedHeader({ alg });
  if (exp) jwt.setExpirationTime(exp);
  return jwt.sign(new TextEncoder().encode(secret));
}

async function expectInvalid(token: string): Promise<void> {
  const error = await verifier.verifyAccessToken(token).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(OAuthError);
  expect((error as OAuthError).code).toBe(OAuthErrorCode.InvalidToken);
}

describe('createJwtVerifier', () => {
  it('accepts a valid token', async () => {
    const token = await sign({ sub: 'user-1' });
    const info = await verifier.verifyAccessToken(token);
    expect(info.clientId).toBe('user-1');
    expect(info.token).toBe(token);
    expect(info.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it('rejects an expired token', async () => {
    await expectInvalid(await sign({ sub: 'user-1' }, { exp: '-1m' }));
  });

  it('rejects a token signed with another secret', async () => {
    await expectInvalid(await sign({ sub: 'user-1' }, { secret: 'other' }));
  });

  it('rejects a token without exp', async () => {
    await expectInvalid(await sign({ sub: 'user-1' }, { exp: null }));
  });

  it.each([{}, { sub: '' }, { sub: 123 }])('rejects invalid sub %j', async (payload) => {
    await expectInvalid(await sign(payload as JWTPayload));
  });

  it('rejects a non-HS256 algorithm', async () => {
    await expectInvalid(await sign({ sub: 'user-1' }, { alg: 'HS512' }));
  });

  it('rejects garbage', async () => {
    await expectInvalid('not.a.jwt');
  });
});
