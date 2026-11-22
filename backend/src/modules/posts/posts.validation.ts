import { z } from 'zod';

export const createPostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(300, 'Title cannot exceed 300 characters'),
    content: z
      .string()
      .trim()
      .min(1, 'Content cannot be empty')
      .max(20000, 'Content cannot exceed 20,000 characters')
      .optional(),
  })
  .strict();

export const editPostTextSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(300, 'Title cannot exceed 300 characters')
      .optional(),
    content: z
      .string()
      .trim()
      .min(1, 'Content cannot be empty')
      .max(20000, 'Content cannot exceed 20,000 characters')
      .optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'At least one field (title or content) must be provided for update',
  });

export type FeedSortOption = 'newest' | 'top' | 'downvoted';

export const feedQuerySchema = z.object({
  sort: z
    .enum(['newest', 'top', 'downvoted'], {
      message: "Sort must be 'newest', 'top', or 'downvoted'",
    })
    .optional()
    .default('newest'),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int('Page must be an integer')
        .min(1, 'Page must be at least 1')
    ),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(50, 'Limit cannot exceed 50')
    ),
});

export const removeImageSchema = z
  .object({
    remove: z.literal(true, {
      message: 'Field "remove" must be true',
    }),
  })
  .strict();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type EditPostTextInput = z.infer<typeof editPostTextSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
export type RemoveImageInput = z.infer<typeof removeImageSchema>;
