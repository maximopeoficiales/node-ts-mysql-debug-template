import { UserRepository } from '../../domain/repositories/UserRepository';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { User, LoginDTO } from '../../domain/entities/User';
import { UnauthorizedError } from '../../domain/errors/AppError';
import { logger } from '../../infrastructure/logger/Logger';
import { config } from '../../config/environment';
import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { EventType, UserLoginSuccessEventData, UserLoginFailedEventData } from '../dtos/EventDTOs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private eventBus?: IEventBus // Opcional para mantener retrocompatibilidad
  ) {}

  async execute(loginData: LoginDTO, context?: LoginContext): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      logger.warn({ message: 'Login attempt with non-existent email', email: loginData.email });

      // Emitir evento: Login fallido
      await this.publishLoginFailedEvent(loginData.email, 'user_not_found', context);

      throw new UnauthorizedError('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      logger.warn({ message: 'Login attempt with invalid password', email: loginData.email });

      // Emitir evento: Login fallido
      await this.publishLoginFailedEvent(loginData.email, 'invalid_credentials', context);

      throw new UnauthorizedError('Invalid credentials');
    }

    // Generar token JWT
    const jwtSecret = config.jwt.secret;
    const jwtExpiresIn = config.jwt.expiresIn;

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: jwtExpiresIn as string,
    } as jwt.SignOptions);

    // Guardar sesión en DynamoDB
    const expiresInSeconds = this.parseExpirationToSeconds(jwtExpiresIn);
    await this.sessionRepository.save(
      token,
      {
        userId: user.id,
        email: user.email,
        createdAt: new Date(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
      expiresInSeconds
    );

    // Emitir evento: Login exitoso
    if (this.eventBus) {
      const event: IEvent = {
        type: EventType.USER_LOGIN_SUCCESS,
        data: {
          userId: user.id.toString(),
          email: user.email,
          sessionId: token,
          ip: context?.ipAddress || 'unknown',
          userAgent: context?.userAgent,
          timestamp: new Date(),
        } as UserLoginSuccessEventData,
        timestamp: new Date(),
        metadata: {
          ip: context?.ipAddress,
          userAgent: context?.userAgent,
        },
      };

      // No esperamos a que se publique para no bloquear la respuesta
      this.eventBus.publish(event).catch((error) => {
        logger.error({
          message: 'Failed to publish login.success event',
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      logger.info({
        message: 'Login success event published',
        userId: user.id,
        email: user.email,
      });
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Publicar evento de login fallido
   */
  private async publishLoginFailedEvent(
    email: string,
    reason: 'invalid_credentials' | 'user_not_found' | 'account_locked',
    context?: LoginContext
  ): Promise<void> {
    if (!this.eventBus) return;

    const event: IEvent = {
      type: EventType.USER_LOGIN_FAILED,
      data: {
        email,
        reason,
        ip: context?.ipAddress || 'unknown',
        userAgent: context?.userAgent,
        timestamp: new Date(),
      } as UserLoginFailedEventData,
      timestamp: new Date(),
      metadata: {
        ip: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    };

    this.eventBus.publish(event).catch((error) => {
      logger.error({
        message: 'Failed to publish login.failed event',
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }

  /**
   * Convierte la expiración del JWT a segundos
   * Ejemplos: '1h' -> 3600, '30m' -> 1800, '7d' -> 604800
   */
  private parseExpirationToSeconds(expiration: string | number): number {
    if (typeof expiration === 'number') {
      return expiration;
    }

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default: 1 hora
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }
}
