import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/api-response.js';

export function normalizeOrigin(url: string): string {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function getAllowedOrigins(): string[] {
  const raw = env.FRONTEND_URL;
  return raw
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const validateOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Safe read-only HTTP methods are not subject to CSRF/origin mutation checks
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const allowedOrigins = getAllowedOrigins();
  const originHeader = req.headers.origin;

  // 1. If Origin header is explicitly sent (standard in browser fetch/xhr/CORS)
  if (originHeader !== undefined) {
    if (typeof originHeader !== 'string' || originHeader === 'null') {
      sendError(res, 403, 'Cross-origin request rejected: untrusted origin', []);
      return;
    }

    const normalizedOrigin = normalizeOrigin(originHeader);
    if (!allowedOrigins.includes(normalizedOrigin)) {
      sendError(res, 403, 'Cross-origin request rejected', []);
      return;
    }

    return next();
  }

  // 2. If Origin header is absent, inspect Referer header (browsers send Referer on same-origin/navigation)
  const refererHeader = req.headers.referer;
  if (refererHeader && typeof refererHeader === 'string') {
    try {
      const refererOrigin = new URL(refererHeader).origin.toLowerCase();
      if (!allowedOrigins.includes(refererOrigin)) {
        sendError(res, 403, 'Cross-origin request rejected: invalid referer origin', []);
        return;
      }
      return next();
    } catch {
      sendError(res, 403, 'Cross-origin request rejected: malformed referer', []);
      return;
    }
  }

  // 3. Inspect Sec-Fetch-Site (modern browsers include this metadata header)
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    sendError(res, 403, 'Cross-origin request rejected: cross-site fetch detected', []);
    return;
  }

  // 4. If neither Origin nor Referer is present, allow for non-browser API clients (Postman, curl, tests)
  // Browser requests that omit both headers are still defended by SameSite=Lax cookie isolation.
  next();
};
