import argon2 from "argon2";
import { prisma } from "../../config/prisma.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../../config/auth.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    throw new AuthError(409, "Email already registered");
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new AuthError(409, "Username already taken");
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  const { user, session } = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: input.displayName.trim(),
      },
    });

    const newSession = await tx.session.create({
      data: {
        userId: newUser.id,
        tokenHash,
        expiresAt,
      },
    });

    return { user: newUser, session: newSession };
  });

  const accessToken = await signAccessToken(user.id, session.id);

  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const identifier = input.identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new AuthError(401, "Invalid credentials");
  }

  const isPasswordValid = await argon2.verify(
    user.passwordHash,
    input.password,
  );
  if (!isPasswordValid) {
    throw new AuthError(401, "Invalid credentials");
  }

  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken(user.id, session.id);

  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function refresh(
  currentRefreshToken?: string,
): Promise<RefreshResult> {
  if (!currentRefreshToken || typeof currentRefreshToken !== "string") {
    throw new AuthError(401, "Refresh token missing");
  }

  const oldTokenHash = hashRefreshToken(currentRefreshToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash: oldTokenHash },
  });

  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt <= new Date()
  ) {
    throw new AuthError(401, "Invalid or expired session");
  }

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  const updateResult = await prisma.session.updateMany({
    where: {
      id: session.id,
      tokenHash: oldTokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    throw new AuthError(401, "Session refresh failed");
  }

  const newAccessToken = await signAccessToken(session.userId, session.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(
  refreshToken?: string,
  sessionId?: string,
): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else if (sessionId) {
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthError(401, "User not found");
  }

  return user;
}
