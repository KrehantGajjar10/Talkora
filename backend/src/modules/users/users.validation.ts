import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(
        /^[a-z0-9_]+$/,
        'Username can only contain lowercase letters, numbers, and underscores'
      )
      .optional(),
    displayName: z
      .string()
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(50, 'Display name cannot exceed 50 characters')
      .optional(),
    bio: z
      .union([
        z.string().trim().max(500, 'Bio cannot exceed 500 characters'),
        z.null(),
      ])
      .optional()
      .transform((val) => (val === '' ? null : val)),
  })
  .strict()
  .refine(
    (data) =>
      data.username !== undefined ||
      data.displayName !== undefined ||
      data.bio !== undefined,
    {
      message: 'At least one field must be provided for update',
    }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
