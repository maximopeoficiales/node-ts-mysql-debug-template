import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const dtoInstance = plainToClass(dtoClass, req.body);
        const errors: ValidationError[] = await validate(dtoInstance);

        if (errors.length > 0) {
          const formattedErrors = this.formatErrors(errors);
          res.status(400).json({
            error: 'Validation failed',
            details: formattedErrors,
          });
          return;
        }

        req.body = dtoInstance;
        next();
      } catch (error) {
        res.status(500).json({ error: 'Internal validation error' });
      }
    };
  }

  private static formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
    });

    return formattedErrors;
  }
}
