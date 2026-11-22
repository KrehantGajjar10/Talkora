import { Request, Response, NextFunction } from 'express';
import * as postsService from './posts.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { removeImageSchema, FeedSortOption } from './posts.validation.js';

function getParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? param[0] : param;
}

export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', []);
      return;
    }

    const post = await postsService.createPost(
      req.user.id,
      req.body,
      req.file
    );

    sendSuccess(res, 201, 'Post created successfully', { post });
  } catch (error) {
    next(error);
  }
}

export async function getPublicFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (res.locals.validatedQuery || req.query) as {
      sort?: FeedSortOption;
      page?: number;
      limit?: number;
    };
    const sort = (query.sort || 'newest') as FeedSortOption;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const result = await postsService.getPublicFeed(
      page,
      limit,
      sort,
      req.user?.id
    );
    sendSuccess(res, 200, 'Feed retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}

export async function getPostById(
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

    const post = await postsService.getPostById(postId, req.user?.id);
    sendSuccess(res, 200, 'Post retrieved successfully', { post });
  } catch (error) {
    next(error);
  }
}

export async function editPostText(
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

    const post = await postsService.editPostText(
      postId,
      req.user.id,
      req.body
    );

    sendSuccess(res, 200, 'Post updated successfully', { post });
  } catch (error) {
    next(error);
  }
}

export async function modifyPostImage(
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

    if (req.is('multipart/form-data')) {
      if (!req.file) {
        sendError(res, 400, 'No replacement image provided in multipart request', []);
        return;
      }

      const post = await postsService.replacePostImage(
        postId,
        req.user.id,
        req.file
      );

      sendSuccess(res, 200, 'Post image updated successfully', { post });
      return;
    }

    if (req.is('application/json')) {
      const parsed = removeImageSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 422, 'Invalid image removal payload. Expected { remove: true }', []);
        return;
      }

      const post = await postsService.removePostImage(postId, req.user.id);
      sendSuccess(res, 200, 'Post image removed successfully', { post });
      return;
    }

    sendError(
      res,
      400,
      'Invalid request: must be multipart/form-data with image or application/json with { remove: true }',
      []
    );
  } catch (error) {
    next(error);
  }
}

export async function deletePost(
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

    await postsService.deletePost(postId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
