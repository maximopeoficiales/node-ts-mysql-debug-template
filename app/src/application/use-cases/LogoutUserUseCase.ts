import { SessionRepository } from '../../domain/repositories/SessionRepository';

export class LogoutUserUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(token: string): Promise<void> {
    const deleted = await this.sessionRepository.delete(token);

    if (!deleted) {
      throw new Error('Session not found or already expired');
    }
  }
}
