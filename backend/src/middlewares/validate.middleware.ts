import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/api-response.js';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const formattedErrors = zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      sendError(res, 422, 'Validation failed', formattedErrors);
      return;
    }
    req.body = result.data;
    next();
  };
};
