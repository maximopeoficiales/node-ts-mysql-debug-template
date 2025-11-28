import { UserRepository } from '../../domain/repositories/UserRepository';
import { LoginDTO } from '../../domain/entities/User';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export class LoginUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(loginData: LoginDTO): Promise<LoginResponse> {
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
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: jwtExpiresIn as string,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
