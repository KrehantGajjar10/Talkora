import { z } from 'zod';

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Comment content cannot be empty')
      .max(5000, 'Comment content cannot exceed 5000 characters'),
  })
  .strict();

export const editCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Comment content cannot be empty')
      .max(5000, 'Comment content cannot exceed 5000 characters'),
  })
  .strict();

export const commentsQuerySchema = z.object({
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
    .default('20')
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(50, 'Limit cannot exceed 50')
    ),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
export type CommentsQueryInput = z.infer<typeof commentsQuerySchema>;
