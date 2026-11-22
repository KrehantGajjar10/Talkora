import { FieldError } from './api-response.js';

export class AppError extends Error {
  public readonly isOperational = true;

  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: FieldError[] = []
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', errors: FieldError[] = []) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', errors: FieldError[] = []) {
    super(401, message, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errors: FieldError[] = []) {
    super(403, message, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errors: FieldError[] = []) {
    super(404, message, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errors: FieldError[] = []) {
    super(409, message, errors);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string = 'Payload too large', errors: FieldError[] = []) {
    super(413, message, errors);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(
    message: string = 'Invalid or unsupported media type. Allowed formats: JPEG, PNG, WebP',
    errors: FieldError[] = []
  ) {
    super(415, message, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', errors: FieldError[] = []) {
    super(422, message, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', errors: FieldError[] = []) {
    super(500, message, errors);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', errors: FieldError[] = []) {
    super(503, message, errors);
  }
}
