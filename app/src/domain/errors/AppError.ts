/**
 * Clase base para errores de aplicación
 * Permite distinguir entre errores operacionales (esperados) y errores de programación (bugs)
 */
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.isOperational = isOperational;

    // Mantener el stack trace apropiado
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error 404 - Recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error 400 - Error de validación
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public readonly errors?: any
  ) {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error 401 - No autenticado
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error 403 - No autorizado (sin permisos)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error 409 - Conflicto (ej: email ya existe)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error 429 - Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
