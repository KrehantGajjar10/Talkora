import { Request, Response, NextFunction } from 'express';
import * as commentsService from './comments.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

function getParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? param[0] : param;
}

export async function createComment(
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

    const comment = await commentsService.createComment(
      postId,
      req.user.id,
      req.body
    );

    sendSuccess(res, 201, 'Comment created successfully', { comment });
  } catch (error) {
    next(error);
  }
}

export async function listComments(
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

    const query = (res.locals.validatedQuery || req.query) as {
      page?: number;
      limit?: number;
    };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await commentsService.listComments(postId, page, limit);
    sendSuccess(res, 200, 'Comments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function editComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const commentId = getParam(req.params.commentId);
    if (!commentId) {
      sendError(res, 400, 'Comment ID is required', []);
      return;
    }

    const comment = await commentsService.editComment(
      commentId,
      req.user.id,
      req.body
    );

    sendSuccess(res, 200, 'Comment updated successfully', { comment });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const commentId = getParam(req.params.commentId);
    if (!commentId) {
      sendError(res, 400, 'Comment ID is required', []);
      return;
    }

    await commentsService.deleteComment(commentId, req.user.id);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
