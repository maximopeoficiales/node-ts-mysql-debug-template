import { Request, Response, NextFunction } from 'express';

/**
 * Tipo para funciones async de controladores
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Wrapper para funciones async de Express
 * Captura errores y los pasa al middleware de error
 *
 * Uso:
 * router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
