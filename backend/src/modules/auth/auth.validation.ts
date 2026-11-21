import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
