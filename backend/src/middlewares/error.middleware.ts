import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/errors.js';
import { sendError, FieldError } from '../utils/api-response.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled Operational Application Errors (AppError, AuthError, PostsError, etc.)
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  // Handle any custom domain error that has statusCode and message
  if (
    err !== null &&
    typeof err === 'object' &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    const customErr = err as { statusCode: number; message: string; errors?: FieldError[] };
    sendError(res, customErr.statusCode, customErr.message, customErr.errors || []);
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const errors: FieldError[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 422, 'Validation failed', errors);
    return;
  }

  // 3. Multer Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 413, 'Image too large. Maximum size allowed is 5 MB', []);
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      sendError(res, 400, `Unexpected form field: ${err.field}`, []);
      return;
    }
    sendError(res, 400, err.message || 'File upload error', []);
    return;
  }

  // 4. SyntaxError from body-parser (malformed JSON)
  if (err instanceof SyntaxError && 'status' in err && (err as { status: unknown }).status === 400) {
    sendError(res, 400, 'Malformed JSON in request body', []);
    return;
  }

  // 5. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        sendError(res, 409, 'A resource with this identifier already exists', []);
        return;
      case 'P2025':
        // Record not found
        sendError(res, 404, 'Resource not found', []);
        return;
      case 'P2003':
        // Foreign key constraint failed
        sendError(res, 400, 'Related resource not found', []);
        return;
      default:
        console.error(`Prisma known request error [${err.code}]:`, err.message);
        sendError(res, 500, 'Database operation failed', []);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma initialization error:', err.message);
    sendError(res, 503, 'Database service currently unavailable', []);
    return;
  }

  // 6. Generic Unhandled Server Errors
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error('Unhandled server error:', errorMessage);

  // In production, never leak internals or stack traces
  sendError(res, 500, 'Internal server error', []);
}
