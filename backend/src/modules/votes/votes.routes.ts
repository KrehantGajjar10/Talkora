import { Router } from 'express';
import * as votesController from './votes.controller.js';
import {
  authenticate,
  optionalAuthenticate,
} from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { voteSchema } from './votes.validation.js';

const router = Router();

// POST /posts/:postId/vote (Authenticated)
router.post(
  '/posts/:postId/vote',
  authenticate,
  validateBody(voteSchema),
  votesController.castVote
);

// GET /posts/:postId/vote (Public, with optional auth for userVote)
router.get(
  '/posts/:postId/vote',
  optionalAuthenticate,
  votesController.getVote
);

// DELETE /posts/:postId/vote (Authenticated)
router.delete(
  '/posts/:postId/vote',
  authenticate,
  votesController.removeVote
);

export default router;
