import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/errors.js';
import type { UpdateProfileInput } from './users.validation.js';

export class UsersError extends AppError {
  constructor(
    statusCode: number,
    message: string
  ) {
    super(statusCode, message);
    this.name = 'UsersError';
  }
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  postCount: number;
}

export async function getProfileByUsername(username: string): Promise<PublicProfile> {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!user) {
    throw new UsersError(404, 'User not found');
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    postCount: user._count.posts,
  };
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
): Promise<PublicProfile> {
  const updateData: {
    username?: string;
    displayName?: string;
    bio?: string | null;
  } = {};

  if (data.username !== undefined) {
    updateData.username = data.username.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        username: updateData.username,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new UsersError(409, 'Username already taken');
    }
  }

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName.trim();
  }

  if (data.bio !== undefined) {
    updateData.bio = data.bio === '' ? null : data.bio;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      createdAt: updatedUser.createdAt,
      postCount: updatedUser._count.posts,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new UsersError(409, 'Username already taken');
    }
    throw error;
  }
}
