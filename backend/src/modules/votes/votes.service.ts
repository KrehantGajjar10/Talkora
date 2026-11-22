import { prisma } from '../../config/prisma.js';

export class VotesError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'VotesError';
  }
}

export interface VoteData {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export async function castVote(
  userId: string,
  postId: string,
  type: 'UPVOTE' | 'DOWNVOTE'
): Promise<VoteData> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new VotesError(404, 'Post not found');
  }

  // Atomically upsert the vote: safe against concurrent requests via @@unique([userId, postId])
  await prisma.vote.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    create: {
      userId,
      postId,
      type,
    },
    update: {
      type,
    },
  });

  return getPostVoteData(postId, userId);
}

export async function getPostVoteData(
  postId: string,
  userId?: string
): Promise<VoteData> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new VotesError(404, 'Post not found');
  }

  const [voteCounts, userVoteRecord] = await Promise.all([
    prisma.vote.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    }),
    userId
      ? prisma.vote.findUnique({
          where: { userId_postId: { userId, postId } },
          select: { type: true },
        })
      : Promise.resolve(null),
  ]);

  let upvotes = 0;
  let downvotes = 0;
  for (const vc of voteCounts) {
    if (vc.type === 'UPVOTE') upvotes = vc._count._all;
    if (vc.type === 'DOWNVOTE') downvotes = vc._count._all;
  }
  const score = upvotes - downvotes;

  return {
    upvotes,
    downvotes,
    score,
    userVote: userVoteRecord?.type ?? null,
  };
}

export async function removeVote(
  userId: string,
  postId: string
): Promise<VoteData> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new VotesError(404, 'Post not found');
  }

  // Delete vote if it exists (idempotent, safe if no vote exists)
  await prisma.vote.deleteMany({
    where: {
      userId,
      postId,
    },
  });

  return getPostVoteData(postId, userId);
}
