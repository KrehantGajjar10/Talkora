import { Request, Response, NextFunction } from 'express';
import * as votesService from './votes.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

function getParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? param[0] : param;
}

export async function castVote(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const postId = getParam(req.params.postId);
    if (!postId) {
      sendError(res, 400, 'Post ID is required', []);
      return;
    }

    const result = await votesService.castVote(
      req.user.id,
      postId,
      req.body.type
    );

    sendSuccess(res, 200, 'Vote recorded successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function getVote(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const postId = getParam(req.params.postId);
    if (!postId) {
      sendError(res, 400, 'Post ID is required', []);
      return;
    }

    const result = await votesService.getPostVoteData(postId, req.user?.id);
    sendSuccess(res, 200, 'Vote data retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function removeVote(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const postId = getParam(req.params.postId);
    if (!postId) {
      sendError(res, 400, 'Post ID is required', []);
      return;
    }

    const result = await votesService.removeVote(req.user.id, postId);
    sendSuccess(res, 200, 'Vote removed successfully', result);
  } catch (error) {
    next(error);
  }
}
