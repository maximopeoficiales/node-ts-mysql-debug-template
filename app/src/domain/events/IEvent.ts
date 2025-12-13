/**
 * Interfaz base para todos los eventos del dominio
 * Principio: Interface Segregation - Base mínima para eventos
 */
export interface IEvent {
  /** Tipo de evento (ej: 'user.registered', 'login.success') */
  type: string;

  /** Datos específicos del evento */
  data: Record<string, any>;

  /** Timestamp de cuando se generó el evento */
  timestamp: Date;

  /** ID único del evento para tracking */
  eventId?: string;

  /** Metadata adicional (IP, user-agent, etc.) */
  metadata?: Record<string, any>;
}
