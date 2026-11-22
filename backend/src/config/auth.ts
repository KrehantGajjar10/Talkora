import crypto from 'node:crypto';
import * as jose from 'jose';
import type { CookieOptions } from 'express';
import { env } from './env.js';

const accessTokenSecret = env.ACCESS_TOKEN_SECRET;
const secretKey = new TextEncoder().encode(accessTokenSecret);

export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ACCESS_COOKIE_NAME = 'talkora_access';
export const REFRESH_COOKIE_NAME = 'talkora_refresh';

export const JWT_ISSUER = 'talkora-api';
export const JWT_AUDIENCE = 'talkora-client';

export const COOKIE_SAME_SITE: 'lax' | 'strict' | 'none' = env.COOKIE_SAME_SITE;
const isProduction = env.NODE_ENV === 'production';
export const COOKIE_SECURE: boolean = isProduction || COOKIE_SAME_SITE === 'none';
export const COOKIE_DOMAIN: string | undefined =
  env.COOKIE_DOMAIN?.trim() || undefined;

export function getAccessCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    path: '/api',
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  };
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }
  return options;
}

export function getRefreshCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  };
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }
  return options;
}

export function getClearAccessCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    path: '/api',
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  };
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }
  return options;
}

export function getClearRefreshCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    path: '/api/auth',
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  };
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }
  return options;
}

export async function signAccessToken(
  userId: string,
  sessionId: string
): Promise<string> {
  return await new jose.SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(secretKey);
}

export async function verifyAccessToken(
  token: string
): Promise<{ sub: string; sid: string }> {
  const { payload } = await jose.jwtVerify(token, secretKey, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (!payload.sub || typeof payload.sid !== 'string') {
    throw new Error('Invalid token payload claims');
  }

  return {
    sub: payload.sub,
    sid: payload.sid,
  };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
