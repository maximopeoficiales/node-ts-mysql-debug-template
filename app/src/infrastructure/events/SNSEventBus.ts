import { SNSClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { logger } from '../logger/Logger';
import { randomUUID } from 'crypto';

/**
 * Configuración para SNS Event Bus
 */
export interface SNSEventBusConfig {
  region: string;
  endpoint?: string; // Para LocalStack
  topicArn: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Implementación de Event Bus usando AWS SNS
 * Principio: Dependency Inversion - Implementa IEventBus
 * Principio: Single Responsibility - Solo se encarga de publicar eventos a SNS
 */
export class SNSEventBus implements IEventBus {
  private snsClient: SNSClient;
  private topicArn: string;

  constructor(config: SNSEventBusConfig) {
    this.topicArn = config.topicArn;

    // Configurar cliente SNS
    this.snsClient = new SNSClient({
      region: config.region,
      endpoint: config.endpoint,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });

    logger.info({
      message: 'SNS Event Bus initialized',
      topicArn: this.topicArn,
      region: config.region,
    });
  }

  /**
   * Publicar un evento a SNS
   */
  async publish(event: IEvent): Promise<void> {
    try {
      // Generar ID único si no existe
      const eventWithId: IEvent = {
        ...event,
        eventId: event.eventId || randomUUID(),
      };

      // Preparar mensaje para SNS
      const params: PublishCommandInput = {
        TopicArn: this.topicArn,
        Message: JSON.stringify(eventWithId),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: event.type,
          },
          timestamp: {
            DataType: 'String',
            StringValue: event.timestamp.toISOString(),
          },
        },
      };

      // Publicar a SNS
      const command = new PublishCommand(params);
      const response = await this.snsClient.send(command);

      logger.info({
        message: 'Event published to SNS',
        eventId: eventWithId.eventId,
        eventType: event.type,
        messageId: response.MessageId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to publish event to SNS',
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publicar múltiples eventos en batch
   * SNS no tiene batch nativo, así que los publicamos secuencialmente
   */
  async publishBatch(events: IEvent[]): Promise<void> {
    logger.info({
      message: 'Publishing batch of events to SNS',
      count: events.length,
    });

    const promises = events.map((event) => this.publish(event));
    await Promise.all(promises);

    logger.info({
      message: 'Batch of events published successfully',
      count: events.length,
    });
  }

  /**
   * Cerrar conexión (si es necesario)
   */
  async close(): Promise<void> {
    this.snsClient.destroy();
    logger.info({ message: 'SNS Event Bus closed' });
  }
}
