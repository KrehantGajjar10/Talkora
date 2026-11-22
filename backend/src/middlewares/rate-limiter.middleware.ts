import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/api-response.js';

export const isRateLimitDisabled = (): boolean => {
  // CRITICAL: Production MUST ALWAYS enforce rate limits regardless of any environment variables.
  if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return false;
  }
  // Rate-limit bypass is strictly permitted ONLY in an explicitly isolated test environment.
  return (
    (env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') &&
    process.env.ALLOW_TEST_RATE_LIMIT_BYPASS === 'true'
  );
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: isRateLimitDisabled,
  handler: (_req: Request, res: Response) => {
    sendError(res, 429, 'Too many authentication attempts, please try again later', []);
  },
});

export const mutationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 mutation requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  handler: (_req: Request, res: Response) => {
    sendError(res, 429, 'Too many requests, please try again later', []);
  },
});
