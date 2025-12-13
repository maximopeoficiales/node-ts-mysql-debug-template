import { UserRepository } from '../../domain/repositories/UserRepository';
import { CreateUserDTO, User } from '../../domain/entities/User';
import { ConflictError } from '../../domain/errors/AppError';
import { logger } from '../../infrastructure/logger/Logger';
import bcrypt from 'bcrypt';

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userData: CreateUserDTO): Promise<User> {
    // Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      logger.warn({ message: 'Attempt to register with existing email', email: userData.email });
      throw new ConflictError('Email already exists');
    }
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Crear el usuario
    const user = await this.userRepository.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    });

    return user;
  }
}
