import { z } from 'zod';

export const voteSchema = z
  .object({
    type: z.enum(['UPVOTE', 'DOWNVOTE'], {
      message: 'Vote type must be UPVOTE or DOWNVOTE',
    }),
  })
  .strict();

export type VoteInput = z.infer<typeof voteSchema>;
