import { prisma } from '../../config/prisma.js';
import { uploadImageStream, deleteImage } from '../../config/cloudinary.js';
import type {
  CreatePostInput,
  EditPostTextInput,
} from './posts.validation.js';

export class PostsError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'PostsError';
  }
}

export interface SafeAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PostVoteStats {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export interface SafePost {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  author: SafeAuthor;
  commentCount: number;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPosts {
  posts: SafePost[];
  pagination: {
    page: number;
    limit: number;
    totalPosts: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const postSelect = {
  id: true,
  title: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  _count: {
    select: {
      comments: true,
    },
  },
} as const;

export async function getPostVoteStats(
  postId: string,
  userId?: string
): Promise<PostVoteStats> {
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

export function formatSafePost(
  post: {
    id: string;
    title: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: SafeAuthor;
    _count: { comments: number };
  },
  voteStats: PostVoteStats = {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: null,
  }
): SafePost {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    author: post.author,
    commentCount: post._count.comments,
    upvotes: voteStats.upvotes,
    downvotes: voteStats.downvotes,
    score: voteStats.score,
    userVote: voteStats.userVote,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function createPost(
  authorId: string,
  input: CreatePostInput,
  file?: Express.Multer.File
): Promise<SafePost> {
  const content = input.content ? input.content.trim() : null;

  if (!content && !file) {
    throw new PostsError(
      422,
      'A post must contain at least text content or an image'
    );
  }

  let uploadedImage: { secureUrl: string; publicId: string } | null = null;
  if (file) {
    uploadedImage = await uploadImageStream(file.buffer);
  }

  try {
    const post = await prisma.post.create({
      data: {
        title: input.title,
        content: content || null,
        imageUrl: uploadedImage ? uploadedImage.secureUrl : null,
        imagePublicId: uploadedImage ? uploadedImage.publicId : null,
        authorId,
      },
      select: postSelect,
    });

    return formatSafePost(post);
  } catch (error) {
    if (uploadedImage) {
      void deleteImage(uploadedImage.publicId);
    }
    throw error;
  }
}

export async function getPublicFeed(
  page: number,
  limit: number,
  currentUserId?: string
): Promise<PaginatedPosts> {
  const skip = (page - 1) * limit;
  const take = limit;

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: postSelect,
    }),
    prisma.post.count(),
  ]);

  const postIds = posts.map((p) => p.id);

  // Batch query: Aggregate vote counts for all posts in page in a single query
  const voteCounts =
    postIds.length > 0
      ? await prisma.vote.groupBy({
          by: ['postId', 'type'],
          where: { postId: { in: postIds } },
          _count: { _all: true },
        })
      : [];

  const voteStatsMap = new Map<string, { upvotes: number; downvotes: number }>();
  for (const id of postIds) {
    voteStatsMap.set(id, { upvotes: 0, downvotes: 0 });
  }
  for (const vc of voteCounts) {
    const stats = voteStatsMap.get(vc.postId);
    if (stats) {
      if (vc.type === 'UPVOTE') stats.upvotes = vc._count._all;
      if (vc.type === 'DOWNVOTE') stats.downvotes = vc._count._all;
    }
  }

  // Batch query: User votes for posts in page in a single query if authenticated
  const userVoteMap = new Map<string, 'UPVOTE' | 'DOWNVOTE'>();
  if (currentUserId && postIds.length > 0) {
    const userVotes = await prisma.vote.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds },
      },
      select: { postId: true, type: true },
    });
    for (const uv of userVotes) {
      userVoteMap.set(uv.postId, uv.type);
    }
  }

  const formattedPosts: SafePost[] = posts.map((post) => {
    const stats = voteStatsMap.get(post.id) || { upvotes: 0, downvotes: 0 };
    const score = stats.upvotes - stats.downvotes;
    const userVote = userVoteMap.get(post.id) ?? null;

    return formatSafePost(post, {
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      score,
      userVote,
    });
  });

  const totalPages = Math.ceil(totalPosts / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      totalPosts,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

export async function getPostById(
  postId: string,
  currentUserId?: string
): Promise<SafePost> {
  const [post, voteStats] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      select: postSelect,
    }),
    getPostVoteStats(postId, currentUserId),
  ]);

  if (!post) {
    throw new PostsError(404, 'Post not found');
  }

  return formatSafePost(post, voteStats);
}

export async function editPostText(
  postId: string,
  userId: string,
  input: EditPostTextInput
): Promise<SafePost> {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      content: true,
      imageUrl: true,
    },
  });

  if (!existing) {
    throw new PostsError(404, 'Post not found');
  }

  if (existing.authorId !== userId) {
    throw new PostsError(403, 'Forbidden: You can only edit your own posts');
  }

  const finalContent =
    input.content !== undefined ? input.content.trim() : existing.content;
  const hasContent = finalContent !== null && finalContent.trim().length > 0;
  const hasImage = existing.imageUrl !== null;

  if (!hasContent && !hasImage) {
    throw new PostsError(
      422,
      'A post must contain at least text content or an image'
    );
  }

  const updateData: { title?: string; content?: string } = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;

  const [updated, voteStats] = await Promise.all([
    prisma.post.update({
      where: { id: postId },
      data: updateData,
      select: postSelect,
    }),
    getPostVoteStats(postId, userId),
  ]);

  return formatSafePost(updated, voteStats);
}

export async function replacePostImage(
  postId: string,
  userId: string,
  file: Express.Multer.File
): Promise<SafePost> {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      imagePublicId: true,
    },
  });

  if (!existing) {
    throw new PostsError(404, 'Post not found');
  }

  if (existing.authorId !== userId) {
    throw new PostsError(403, 'Forbidden: You can only edit your own posts');
  }

  const newImage = await uploadImageStream(file.buffer);

  try {
    const [updated, voteStats] = await Promise.all([
      prisma.post.update({
        where: { id: postId },
        data: {
          imageUrl: newImage.secureUrl,
          imagePublicId: newImage.publicId,
        },
        select: postSelect,
      }),
      getPostVoteStats(postId, userId),
    ]);

    if (existing.imagePublicId) {
      void deleteImage(existing.imagePublicId);
    }

    return formatSafePost(updated, voteStats);
  } catch (error) {
    void deleteImage(newImage.publicId);
    throw error;
  }
}

export async function removePostImage(
  postId: string,
  userId: string
): Promise<SafePost> {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      content: true,
      imagePublicId: true,
    },
  });

  if (!existing) {
    throw new PostsError(404, 'Post not found');
  }

  if (existing.authorId !== userId) {
    throw new PostsError(403, 'Forbidden: You can only edit your own posts');
  }

  if (!existing.content || existing.content.trim().length === 0) {
    throw new PostsError(
      422,
      'Cannot remove image: every post must contain text or an image'
    );
  }

  const [updated, voteStats] = await Promise.all([
    prisma.post.update({
      where: { id: postId },
      data: {
        imageUrl: null,
        imagePublicId: null,
      },
      select: postSelect,
    }),
    getPostVoteStats(postId, userId),
  ]);

  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }

  return formatSafePost(updated, voteStats);
}

export async function deletePost(
  postId: string,
  userId: string
): Promise<void> {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      imagePublicId: true,
    },
  });

  if (!existing) {
    throw new PostsError(404, 'Post not found');
  }

  if (existing.authorId !== userId) {
    throw new PostsError(403, 'Forbidden: You can only edit your own posts');
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }
}
