import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema, userPostsQuerySchema } from './users.validation.js';

const router = Router();

// PATCH /api/users/me (Authenticated users only)
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  usersController.updateProfile
);

// GET /api/users/:username/posts (Public, optional auth for vote state)
router.get(
  '/:username/posts',
  optionalAuthenticate,
  validateQuery(userPostsQuerySchema),
  usersController.getUserPosts
);

// GET /api/users/:username (Public)
router.get('/:username', usersController.getProfile);

export default router;
