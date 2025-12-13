import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../domain/errors/AppError';
import { logger } from '../logger/Logger';

/**
 * Middleware centralizado para manejo de errores
 * Captura todos los errores y los procesa de forma consistente
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Si es un error operacional (esperado)
  if (err instanceof AppError) {
    logger.warn({
      message: err.message,
      statusCode: err.statusCode,
      method: req.method,
      path: req.path,
      ip: req.ip || req.socket.remoteAddress,
      ...(err instanceof ValidationError && err.errors ? { validationErrors: err.errors } : {}),
    });

    const response: any = {
      status: 'error',
      message: err.message,
    };

    // Incluir errores de validación si existen
    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Error desconocido (bug o error no manejado)
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    body: req.body,
    query: req.query,
  });

  // No exponer detalles del error en producción
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 * Evita tener que usar try-catch en cada controller
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
