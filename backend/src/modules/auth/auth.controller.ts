import { Request, Response } from 'express';
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

export async function register(req: Request, res: Response): Promise<void> {
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
    if (error instanceof authService.AuthError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Registration failed', []);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
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
    if (error instanceof authService.AuthError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Login failed', []);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
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
    if (error instanceof authService.AuthError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Session refresh failed', []);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(rawRefreshToken, req.sessionId);

    res.clearCookie(ACCESS_COOKIE_NAME, getClearAccessCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());

    sendSuccess(res, 200, 'Logged out successfully', {});
  } catch {
    res.clearCookie(ACCESS_COOKIE_NAME, getClearAccessCookieOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());

    sendSuccess(res, 200, 'Logged out successfully', {});
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, 200, 'Current user retrieved', { user });
  } catch (error) {
    if (error instanceof authService.AuthError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Failed to retrieve user profile', []);
  }
}
