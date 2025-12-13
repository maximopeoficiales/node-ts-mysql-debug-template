import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { EventType, UserLogoutEventData } from '../dtos/EventDTOs';
import { logger } from '../../infrastructure/logger/Logger';

export class LogoutUserUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private eventBus?: IEventBus // Opcional para mantener retrocompatibilidad
  ) {}

  async execute(token: string, userId?: number, email?: string): Promise<void> {
    const deleted = await this.sessionRepository.delete(token);

    if (!deleted) {
      throw new Error('Session not found or already expired');
    }

    // Emitir evento: Usuario cerró sesión
    if (this.eventBus && userId && email) {
      const event: IEvent = {
        type: EventType.USER_LOGOUT,
        data: {
          userId: userId.toString(),
          email,
          sessionId: token,
          timestamp: new Date(),
        } as UserLogoutEventData,
        timestamp: new Date(),
      };

      // No esperamos a que se publique para no bloquear la respuesta
      this.eventBus.publish(event).catch((error) => {
        logger.error({
          message: 'Failed to publish user.logout event',
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      logger.info({
        message: 'User logout event published',
        userId,
        email,
      });
    }
  }
}
