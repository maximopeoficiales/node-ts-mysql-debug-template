import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationError } from '../../domain/errors/AppError';

export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const dtoInstance = plainToInstance(dtoClass, req.body);
        const errors: ClassValidatorError[] = await validate(dtoInstance);

        if (errors.length > 0) {
          const formattedErrors = this.formatErrors(errors);
          // Usar el sistema de errores centralizado
          throw new ValidationError('Validation failed', formattedErrors);
        }

        req.body = dtoInstance;
        next();
      } catch (error) {
        next(error); // Pasar el error al error handler
      }
    };
  }

  private static formatErrors(errors: ClassValidatorError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
    });

    return formattedErrors;
  }
}
