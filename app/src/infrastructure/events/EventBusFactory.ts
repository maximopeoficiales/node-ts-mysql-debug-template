import { IEventBus } from '../../domain/events/IEventBus';
import { SNSEventBus } from './SNSEventBus';
import { SQSEventBus } from './SQSEventBus';
import { NoOpEventBus } from './NoOpEventBus';
import { config } from '../../config/environment';
import { logger } from '../logger/Logger';

/**
 * Tipos de Event Bus disponibles
 */
export type EventBusType = 'sns' | 'sqs' | 'noop';

/**
 * Factory para crear instancias de Event Bus
 * Principio: Factory Pattern - Centraliza la creación de objetos complejos
 * Principio: Open/Closed - Fácil agregar nuevos tipos de Event Bus
 */
export class EventBusFactory {
  /**
   * Crear una instancia de Event Bus según la configuración
   */
  static create(type?: EventBusType): IEventBus {
    const eventBusType = type || config.events.type;

    logger.info({
      message: 'Creating Event Bus',
      type: eventBusType,
    });

    switch (eventBusType) {
      case 'sns':
        return new SNSEventBus({
          region: config.events.aws.region,
          endpoint: config.events.aws.endpoint,
          topicArn: config.events.sns.topicArn,
          accessKeyId: config.events.aws.accessKeyId,
          secretAccessKey: config.events.aws.secretAccessKey,
        });

      case 'sqs':
        return new SQSEventBus({
          region: config.events.aws.region,
          endpoint: config.events.aws.endpoint,
          queueUrl: config.events.sqs.queueUrl,
          accessKeyId: config.events.aws.accessKeyId,
          secretAccessKey: config.events.aws.secretAccessKey,
        });

      case 'noop':
        logger.warn({ message: 'Using NoOp Event Bus - events will not be published' });
        return new NoOpEventBus();

      default:
        logger.warn({
          message: 'Unknown Event Bus type, falling back to NoOp',
          type: eventBusType,
        });
        return new NoOpEventBus();
    }
  }

  /**
   * Crear Event Bus para testing
   */
  static createForTesting(): IEventBus {
    return new NoOpEventBus();
  }
}
