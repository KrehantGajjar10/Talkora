import { Router } from 'express';
import * as votesController from './votes.controller.js';
import {
  authenticate,
  optionalAuthenticate,
} from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { voteSchema } from './votes.validation.js';

const router = Router();

// POST /posts/:postId/vote (and /votes for API client flexibility) (Authenticated)
router.post(
  ['/posts/:postId/vote', '/posts/:postId/votes'],
  authenticate,
  validateBody(voteSchema),
  votesController.castVote
);

// GET /posts/:postId/vote (and /votes) (Public, with optional auth for userVote)
router.get(
  ['/posts/:postId/vote', '/posts/:postId/votes'],
  optionalAuthenticate,
  votesController.getVote
);

// DELETE /posts/:postId/vote (and /votes) (Authenticated)
router.delete(
  ['/posts/:postId/vote', '/posts/:postId/votes'],
  authenticate,
  votesController.removeVote
);

export default router;
