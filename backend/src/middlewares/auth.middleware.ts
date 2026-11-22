import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, ACCESS_COOKIE_NAME } from '../config/auth.js';
import { prisma } from '../config/prisma.js';
import { sendError } from '../utils/api-response.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token || typeof token !== 'string') {
    sendError(res, 401, 'Authentication required', []);
    return;
  }

  let payload: { sub: string; sid: string };
  try {
    payload = await verifyAccessToken(token);
  } catch {
    // Missing, invalid, or expired JWT payload
    sendError(res, 401, 'Authentication required', []);
    return;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      // Session not found, revoked, or expired
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch (err) {
    // Database or infrastructure failure must reach centralized error handling (500)
    // Never silently mask a database outage as a 401 Unauthorized response!
    next(err);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token || typeof token !== 'string') {
    // Guest without credentials
    return next();
  }

  let payload: { sub: string; sid: string };
  try {
    payload = await verifyAccessToken(token);
  } catch {
    // Invalid or expired token: treat as guest according to policy
    return next();
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      // Session revoked or expired: treat as guest
      return next();
    }

    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch (err) {
    // Database or infrastructure failure must NOT be silently swallowed
    next(err);
  }
};
