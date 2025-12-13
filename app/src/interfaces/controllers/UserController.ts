import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/LogoutUserUseCase';
import { CreateUserDTO, LoginDTO, User } from '../../domain/entities/User';
import { ValidationError, NotFoundError } from '../../domain/errors/AppError';
import { logger } from '../../infrastructure/logger/Logger';
import { AuthRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private logoutUserUseCase: LogoutUserUseCase,
    private userRepository: UserRepository
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const userData = req.body as CreateUserDTO;

    const user = await this.createUserUseCase.execute(userData);

    // No devolver la contraseña
    const { password: _, ...userResponse } = user;

    logger.info({ message: 'User registered successfully', userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const loginData = req.body as LoginDTO;

    // Capturar contexto de la petición
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.loginUserUseCase.execute(loginData, {
      ipAddress,
      userAgent,
    });

    logger.info({
      message: 'User logged in successfully',
      userId: result.user.id,
      email: result.user.email,
    });

    res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  }

  async getUser(req: Request, res: Response): Promise<void> {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    const user = await this.getUserUseCase.execute(userId);

    // No devolver la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userResponse } = user as User;

    res.status(200).json({
      user: userResponse,
    });
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      throw new ValidationError('Token is required');
    }

    // Extraer información del usuario del request (viene del AuthMiddleware)
    const userId = req.userId;
    const email = req.userEmail;

    await this.logoutUserUseCase.execute(token, userId, email);

    logger.info({
      message: 'User logged out successfully',
      userId,
      email,
    });

    res.status(200).json({ message: 'Logout successful' });
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validar límites
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new ValidationError('Offset must be >= 0');
    }

    const result = await this.userRepository.findAllPaginated({ limit, offset });

    // Remover passwords de todos los usuarios
    const users = result.data.map(({ password: _, ...user }) => user);

    res.status(200).json({
      users,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  }
}
