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

export interface SafePost {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  author: SafeAuthor;
  commentCount: number;
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

export function formatSafePost(post: {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: SafeAuthor;
  _count: { comments: number };
}): SafePost {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    author: post.author,
    commentCount: post._count.comments,
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
  limit: number
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

  const totalPages = Math.ceil(totalPosts / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    posts: posts.map(formatSafePost),
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

export async function getPostById(postId: string): Promise<SafePost> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: postSelect,
  });

  if (!post) {
    throw new PostsError(404, 'Post not found');
  }

  return formatSafePost(post);
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

  return formatSafePost(updated);
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
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        imageUrl: newImage.secureUrl,
        imagePublicId: newImage.publicId,
      },
      select: postSelect,
    });

    if (existing.imagePublicId) {
      void deleteImage(existing.imagePublicId);
    }

    return formatSafePost(updated);
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

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      imageUrl: null,
      imagePublicId: null,
    },
    select: postSelect,
  });

  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }

  return formatSafePost(updated);
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
    throw new PostsError(403, 'Forbidden: You can only delete your own posts');
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  if (existing.imagePublicId) {
    void deleteImage(existing.imagePublicId);
  }
}
