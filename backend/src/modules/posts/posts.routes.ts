import { Router } from 'express';
import * as postsController from './posts.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import {
  uploadOptionalImage,
  uploadSingleImage,
} from '../../middlewares/upload.middleware.js';
import {
  createPostSchema,
  editPostTextSchema,
  feedQuerySchema,
} from './posts.validation.js';

const router = Router();

// GET /api/posts (Public Feed)
router.get(
  '/',
  validateQuery(feedQuerySchema),
  postsController.getPublicFeed
);

// POST /api/posts (Create Post)
router.post(
  '/',
  authenticate,
  uploadOptionalImage,
  validateBody(createPostSchema),
  postsController.createPost
);

// GET /api/posts/:postId (Get Post Details)
router.get(
  '/:postId',
  postsController.getPostById
);

// PATCH /api/posts/:postId (Edit Post Text)
router.patch(
  '/:postId',
  authenticate,
  validateBody(editPostTextSchema),
  postsController.editPostText
);

// PATCH /api/posts/:postId/image (Replace or Remove Post Image)
router.patch(
  '/:postId/image',
  authenticate,
  uploadOptionalImage,
  postsController.modifyPostImage
);

// DELETE /api/posts/:postId (Delete Post)
router.delete(
  '/:postId',
  authenticate,
  postsController.deletePost
);

export default router;
