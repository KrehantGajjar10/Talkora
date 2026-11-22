import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  getClearAccessCookieOptions,
  getClearRefreshCookieOptions,
} from '../../config/auth.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(req.body);

    res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions()
    );
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions()
    );

    sendSuccess(res, 201, 'User registered successfully', {
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body);

    res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions()
    );
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions()
    );

    sendSuccess(res, 200, 'Login successful', {
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await authService.refresh(rawRefreshToken);

    res.cookie(
      ACCESS_COOKIE_NAME,
      result.accessToken,
      getAccessCookieOptions()
    );
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions()
    );

    sendSuccess(res, 200, 'Session refreshed successfully', {});
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const rawAccessToken = req.cookies?.[ACCESS_COOKIE_NAME];
    await authService.logout(rawRefreshToken, rawAccessToken);

    res.clearCookie(ACCESS_COOKIE_NAME, getClearAccessCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());

    sendSuccess(res, 200, 'Logged out successfully', {});
  } catch (error) {
    // Always clear credentials from client, but propagate DB failure to error handler
    res.clearCookie(ACCESS_COOKIE_NAME, getClearAccessCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, 200, 'Current user retrieved', { user });
  } catch (error) {
    next(error);
  }
}
