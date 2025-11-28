import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: number): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
