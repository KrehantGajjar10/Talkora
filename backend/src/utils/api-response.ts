import { Response } from 'express';

export interface FieldError {
  field?: string;
  message: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: FieldError[];
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors: FieldError[] = []
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
