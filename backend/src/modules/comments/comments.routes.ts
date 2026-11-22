import { Router } from 'express';
import * as commentsController from './comments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import {
  createCommentSchema,
  editCommentSchema,
  commentsQuerySchema,
} from './comments.validation.js';

const router = Router();

// POST /posts/:postId/comments (Authenticated)
router.post(
  '/posts/:postId/comments',
  authenticate,
  validateBody(createCommentSchema),
  commentsController.createComment
);

// GET /posts/:postId/comments (Public)
router.get(
  '/posts/:postId/comments',
  validateQuery(commentsQuerySchema),
  commentsController.listComments
);

// PATCH /comments/:commentId (Author only)
router.patch(
  '/comments/:commentId',
  authenticate,
  validateBody(editCommentSchema),
  commentsController.editComment
);

// DELETE /comments/:commentId (Author only)
router.delete(
  '/comments/:commentId',
  authenticate,
  commentsController.deleteComment
);

export default router;
