import { IEvent } from './IEvent';

/**
 * Interfaz para el Event Bus
 * Principio: Dependency Inversion - Los use cases dependen de esta abstracción
 * Principio: Open/Closed - Abierto a extensión (nuevos publishers), cerrado a modificación
 */
export interface IEventBus {
  /**
   * Publicar un evento en el bus
   * @param event - Evento a publicar
   * @returns Promise que se resuelve cuando el evento se publicó exitosamente
   */
  publish(event: IEvent): Promise<void>;

  /**
   * Publicar múltiples eventos en batch
   * @param events - Array de eventos a publicar
   * @returns Promise que se resuelve cuando todos los eventos se publicaron
   */
  publishBatch(events: IEvent[]): Promise<void>;
}
