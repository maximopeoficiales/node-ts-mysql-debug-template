import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validaciones básicas
      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password and name are required' });
        return;
      }

      const user = await this.createUserUseCase.execute({ email, password, name });

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
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.loginUserUseCase.execute({ email, password });

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
}
