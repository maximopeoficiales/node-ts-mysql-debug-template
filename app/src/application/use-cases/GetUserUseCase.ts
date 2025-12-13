import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { NotFoundError } from '../../domain/errors/AppError';

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: number): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
