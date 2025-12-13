import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { SessionRepository } from '@domain/repositories/SessionRepository';
import { config } from '../../config/environment';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export class AuthMiddleware {
  constructor(private sessionRepository: SessionRepository) {}

  authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.substring(7);

      // Verificar JWT
      const jwtSecret = config.jwt.secret;
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: number;
        email: string;
      };

      // Verificar que la sesión existe en DynamoDB
      const sessionExists = await this.sessionRepository.exists(token);
      if (!sessionExists) {
        res.status(401).json({ error: 'Session expired or invalid' });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  };
}
