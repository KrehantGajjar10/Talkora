import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import * as postsService from '../posts/posts.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.params;
    if (!username || typeof username !== 'string') {
      sendError(res, 400, 'Username parameter is required', []);
      return;
    }

    const profile = await usersService.getProfileByUsername(username);
    sendSuccess(res, 200, 'Profile retrieved successfully', { profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const profile = await usersService.updateProfile(req.user.id, req.body);
    sendSuccess(res, 200, 'Profile updated successfully', { profile });
  } catch (error) {
    next(error);
  }
}

export async function getUserPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.params;
    if (!username || typeof username !== 'string') {
      sendError(res, 400, 'Username parameter is required', []);
      return;
    }

    const query = (res.locals.validatedQuery || req.query) as {
      page?: number;
      limit?: number;
    };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const currentUserId = req.user?.id;

    const result = await postsService.getUserPosts(
      username,
      page,
      limit,
      currentUserId
    );
    sendSuccess(res, 200, 'User posts retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}
