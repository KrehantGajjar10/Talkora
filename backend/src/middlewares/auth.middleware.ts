import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, ACCESS_COOKIE_NAME } from '../config/auth.js';
import { prisma } from '../config/prisma.js';
import { sendError } from '../utils/api-response.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE_NAME];
    if (!token || typeof token !== 'string') {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    let payload: { sub: string; sid: string };
    try {
      payload = await verifyAccessToken(token);
    } catch {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

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
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch {
    sendError(res, 401, 'Authentication required', []);
  }
};
