import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import type {
  CreateCommentInput,
  EditCommentInput,
} from './comments.validation.js';

export class CommentsError extends AppError {
  constructor(
    statusCode: number,
    message: string
  ) {
    super(statusCode, message);
    this.name = 'CommentsError';
  }
}

export interface SafeAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SafeComment {
  id: string;
  content: string;
  postId: string;
  author: SafeAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedComments {
  comments: SafeComment[];
  pagination: {
    page: number;
    limit: number;
    totalComments: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const commentSelect = {
  id: true,
  content: true,
  postId: true,
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
} as const;

export async function createComment(
  postId: string,
  authorId: string,
  input: CreateCommentInput
): Promise<SafeComment> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new CommentsError(404, 'Post not found');
  }

  const comment = await prisma.comment.create({
    data: {
      content: input.content.trim(),
      postId,
      authorId,
    },
    select: commentSelect,
  });

  return comment;
}

export async function listComments(
  postId: string,
  page: number,
  limit: number
): Promise<PaginatedComments> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new CommentsError(404, 'Post not found');
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [comments, totalComments] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: commentSelect,
    }),
    prisma.comment.count({
      where: { postId },
    }),
  ]);

  const totalPages = Math.ceil(totalComments / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    comments,
    pagination: {
      page,
      limit,
      totalComments,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

export async function editComment(
  commentId: string,
  userId: string,
  input: EditCommentInput
): Promise<SafeComment> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new CommentsError(404, 'Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new CommentsError(403, 'Forbidden: You can only edit your own comments');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: input.content.trim(),
    },
    select: commentSelect,
  });

  return updated;
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!comment) {
    throw new CommentsError(404, 'Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new CommentsError(403, 'Forbidden: You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
}
