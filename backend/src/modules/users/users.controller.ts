import { Request, Response } from 'express';
import * as usersService from './users.service.js';
import { UsersError } from './users.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const { username } = req.params;
    if (!username || typeof username !== 'string') {
      sendError(res, 400, 'Username parameter is required', []);
      return;
    }

    const profile = await usersService.getProfileByUsername(username);
    sendSuccess(res, 200, 'Profile retrieved successfully', { profile });
  } catch (error) {
    if (error instanceof UsersError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Failed to retrieve profile', []);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const profile = await usersService.updateProfile(req.user.id, req.body);
    sendSuccess(res, 200, 'Profile updated successfully', { profile });
  } catch (error) {
    if (error instanceof UsersError) {
      sendError(res, error.statusCode, error.message, []);
      return;
    }
    sendError(res, 500, 'Failed to update profile', []);
  }
}
