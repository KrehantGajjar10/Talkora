import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response.js';

export const validateOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (origin && origin !== frontendUrl) {
    sendError(res, 403, 'Cross-origin request rejected', []);
    return;
  }

  next();
};
