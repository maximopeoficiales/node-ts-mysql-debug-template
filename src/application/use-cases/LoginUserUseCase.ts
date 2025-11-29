import { UserRepository } from '../../domain/repositories/UserRepository';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { User, LoginDTO } from '../../domain/entities/User';
import { config } from '../../config/environment';
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
    private sessionRepository: SessionRepository
  ) {}

  async execute(loginData: LoginDTO, context?: LoginContext): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
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
