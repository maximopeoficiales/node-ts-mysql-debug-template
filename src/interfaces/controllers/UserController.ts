import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/LogoutUserUseCase';
import { CreateUserDTO, LoginDTO } from '../../domain/entities/User';
import { AuthRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private logoutUserUseCase: LogoutUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body as CreateUserDTO;

      const user = await this.createUserUseCase.execute(userData);

      // No devolver la contraseña
      const { password: _, ...userResponse } = user;

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          res.status(409).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDTO;

      // Capturar contexto de la petición
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.loginUserUseCase.execute(loginData, {
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          res.status(401).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const user = await this.getUserUseCase.execute(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // No devolver la contraseña
      const { password: _, ...userResponse } = user;

      res.status(200).json({
        user: userResponse,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.substring(7);

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      await this.logoutUserUseCase.execute(token);

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
