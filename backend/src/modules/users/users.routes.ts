import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './users.validation.js';

const router = Router();

// PATCH /api/users/me (Authenticated users only)
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  usersController.updateProfile
);

// GET /api/users/:username (Public)
router.get('/:username', usersController.getProfile);

export default router;
