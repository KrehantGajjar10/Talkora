import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/errors.js';
import { uploadImageStream, deleteImage } from '../../config/cloudinary.js';
import type {
  CreatePostInput,
  EditPostTextInput,
  FeedSortOption,
} from './posts.validation.js';

export class PostsError extends AppError {
  constructor(
    statusCode: number,
    message: string
  ) {
    super(statusCode, message);
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
  sort: FeedSortOption = 'newest',
  currentUserId?: string
): Promise<PaginatedPosts> {
  const skip = (page - 1) * limit;
  const take = limit;

  let orderByClause: Prisma.Sql;
  switch (sort) {
    case 'top':
      orderByClause = Prisma.sql`score DESC, p.created_at DESC, p.id DESC`;
      break;
    case 'downvoted':
      orderByClause = Prisma.sql`score ASC, p.created_at DESC, p.id DESC`;
      break;
    case 'newest':
    default:
      orderByClause = Prisma.sql`p.created_at DESC, p.id DESC`;
      break;
  }

  const userVoteSql = currentUserId
    ? Prisma.sql`(SELECT v2.type::text FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = ${currentUserId}) AS "userVote"`
    : Prisma.sql`NULL::text AS "userVote"`;

  const [rawPosts, totalPosts] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        authorUsername: string;
        authorDisplayName: string;
        authorAvatarUrl: string | null;
        commentCount: number;
        upvotes: number;
        downvotes: number;
        score: number;
        userVote: string | null;
      }>
    >`
      SELECT
        p.id,
        p.title,
        p.content,
        p.image_url AS "imageUrl",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        u.id AS "authorId",
        u.username AS "authorUsername",
        u.display_name AS "authorDisplayName",
        u.avatar_url AS "authorAvatarUrl",
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS "commentCount",
        COUNT(v.id) FILTER (WHERE v.type = 'UPVOTE')::int AS "upvotes",
        COUNT(v.id) FILTER (WHERE v.type = 'DOWNVOTE')::int AS "downvotes",
        (COUNT(v.id) FILTER (WHERE v.type = 'UPVOTE') - COUNT(v.id) FILTER (WHERE v.type = 'DOWNVOTE'))::int AS "score",
        ${userVoteSql}
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN votes v ON p.id = v.post_id
      GROUP BY p.id, u.id
      ORDER BY ${orderByClause}
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.post.count(),
  ]);

  const formattedPosts: SafePost[] = rawPosts.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    imageUrl: row.imageUrl,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
    commentCount: Number(row.commentCount),
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
    userVote: (row.userVote as 'UPVOTE' | 'DOWNVOTE') || null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));

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

  const updated = await prisma.post.update({
    where: { id: postId },
    data: updateData,
    select: postSelect,
  });

  let voteStats: PostVoteStats = {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: null,
  };

  try {
    voteStats = await getPostVoteStats(postId, userId);
  } catch (statsErr) {
    console.error(`Failed to fetch vote stats for edited post ${postId}:`, statsErr);
  }

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

  let updated;
  try {
    updated = await prisma.post.update({
      where: { id: postId },
      data: {
        imageUrl: newImage.secureUrl,
        imagePublicId: newImage.publicId,
      },
      select: postSelect,
    });
  } catch (dbError) {
    // DB update failed, delete the newly uploaded image so it doesn't become orphaned
    void deleteImage(newImage.publicId);
    throw dbError;
  }

  // DB update succeeded! Delete the previous image from Cloudinary (best-effort)
  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }

  let voteStats: PostVoteStats = {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: null,
  };

  try {
    voteStats = await getPostVoteStats(postId, userId);
  } catch (statsErr) {
    console.error(`Failed to fetch vote stats for post ${postId}:`, statsErr);
  }

  return formatSafePost(updated, voteStats);
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

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      imageUrl: null,
      imagePublicId: null,
    },
    select: postSelect,
  });

  // DB update succeeded! Delete the previous image from Cloudinary (best-effort)
  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }

  let voteStats: PostVoteStats = {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: null,
  };

  try {
    voteStats = await getPostVoteStats(postId, userId);
  } catch (statsErr) {
    console.error(`Failed to fetch vote stats for post ${postId}:`, statsErr);
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

export async function getUserPosts(
  username: string,
  page: number = 1,
  limit: number = 10,
  currentUserId?: string
): Promise<PaginatedPosts> {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: { id: true },
  });

  if (!user) {
    throw new PostsError(404, 'User not found');
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const userVoteSql = currentUserId
    ? Prisma.sql`(SELECT v2.type::text FROM votes v2 WHERE v2.post_id = p.id AND v2.user_id = ${currentUserId}) AS "userVote"`
    : Prisma.sql`NULL::text AS "userVote"`;

  const [rawPosts, totalPosts] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        content: string | null;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        authorUsername: string;
        authorDisplayName: string;
        authorAvatarUrl: string | null;
        commentCount: number;
        upvotes: number;
        downvotes: number;
        score: number;
        userVote: string | null;
      }>
    >`
      SELECT
        p.id,
        p.title,
        p.content,
        p.image_url AS "imageUrl",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        u.id AS "authorId",
        u.username AS "authorUsername",
        u.display_name AS "authorDisplayName",
        u.avatar_url AS "authorAvatarUrl",
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS "commentCount",
        COUNT(v.id) FILTER (WHERE v.type = 'UPVOTE')::int AS "upvotes",
        COUNT(v.id) FILTER (WHERE v.type = 'DOWNVOTE')::int AS "downvotes",
        (COUNT(v.id) FILTER (WHERE v.type = 'UPVOTE') - COUNT(v.id) FILTER (WHERE v.type = 'DOWNVOTE'))::int AS "score",
        ${userVoteSql}
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN votes v ON p.id = v.post_id
      WHERE u.id = ${user.id}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ${take} OFFSET ${skip}
    `,
    prisma.post.count({ where: { authorId: user.id } }),
  ]);

  const formattedPosts: SafePost[] = rawPosts.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    imageUrl: row.imageUrl,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
    commentCount: Number(row.commentCount),
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
    userVote: (row.userVote as 'UPVOTE' | 'DOWNVOTE') || null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));

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
