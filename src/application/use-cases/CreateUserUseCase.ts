import { UserRepository } from '../../domain/repositories/UserRepository';
import { CreateUserDTO, User } from '../../domain/entities/User';
import bcrypt from 'bcrypt';

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userData: CreateUserDTO): Promise<User> {
    // Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Crear el usuario
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }
}
