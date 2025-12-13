import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { logger } from '../logger/Logger';

/**
 * Implementación No-Op del Event Bus para desarrollo/testing
 * Principio: Dependency Inversion - Implementa IEventBus
 * Principio: Liskov Substitution - Puede sustituir cualquier IEventBus sin romper la aplicación
 *
 * Útil para:
 * - Testing unitario
 * - Desarrollo local sin infraestructura
 * - Deshabilitar eventos temporalmente
 */
export class NoOpEventBus implements IEventBus {
  /**
   * Simula publicar un evento (solo lo loguea)
   */
  async publish(event: IEvent): Promise<void> {
    logger.debug({
      message: '[NoOp] Event would be published',
      eventType: event.type,
      eventData: event.data,
    });
  }

  /**
   * Simula publicar múltiples eventos
   */
  async publishBatch(events: IEvent[]): Promise<void> {
    logger.debug({
      message: '[NoOp] Batch of events would be published',
      count: events.length,
      eventTypes: events.map((e) => e.type),
    });
  }
}
