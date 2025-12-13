import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { logger } from '../logger/Logger';
import { randomUUID } from 'crypto';

/**
 * Configuración para SQS Event Bus
 */
export interface SQSEventBusConfig {
  region: string;
  endpoint?: string; // Para LocalStack
  queueUrl: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Implementación de Event Bus usando AWS SQS
 * Principio: Dependency Inversion - Implementa IEventBus
 * Principio: Single Responsibility - Solo se encarga de publicar eventos a SQS
 */
export class SQSEventBus implements IEventBus {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(config: SQSEventBusConfig) {
    this.queueUrl = config.queueUrl;

    // Configurar cliente SQS
    this.sqsClient = new SQSClient({
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
      message: 'SQS Event Bus initialized',
      queueUrl: this.queueUrl,
      region: config.region,
    });
  }

  /**
   * Publicar un evento a SQS
   */
  async publish(event: IEvent): Promise<void> {
    try {
      // Generar ID único si no existe
      const eventWithId: IEvent = {
        ...event,
        eventId: event.eventId || randomUUID(),
      };

      // Preparar mensaje para SQS
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(eventWithId),
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
      });

      // Enviar a SQS
      const response = await this.sqsClient.send(command);

      logger.info({
        message: 'Event published to SQS',
        eventId: eventWithId.eventId,
        eventType: event.type,
        messageId: response.MessageId,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to publish event to SQS',
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publicar múltiples eventos en batch
   * SQS soporta hasta 10 mensajes por batch
   */
  async publishBatch(events: IEvent[]): Promise<void> {
    if (events.length === 0) return;

    logger.info({
      message: 'Publishing batch of events to SQS',
      count: events.length,
    });

    // SQS solo permite 10 mensajes por batch
    const batchSize = 10;
    const batches: IEvent[][] = [];

    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    // Enviar cada batch
    for (const batch of batches) {
      await this.sendBatch(batch);
    }

    logger.info({
      message: 'Batch of events published successfully',
      count: events.length,
      batches: batches.length,
    });
  }

  /**
   * Enviar un batch de hasta 10 eventos
   */
  private async sendBatch(events: IEvent[]): Promise<void> {
    try {
      const entries: SendMessageBatchRequestEntry[] = events.map((event, index) => ({
        Id: `msg-${index}`,
        MessageBody: JSON.stringify({
          ...event,
          eventId: event.eventId || randomUUID(),
        }),
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
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: this.queueUrl,
        Entries: entries,
      });

      const response = await this.sqsClient.send(command);

      // Verificar si hubo errores
      if (response.Failed && response.Failed.length > 0) {
        logger.error({
          message: 'Some events failed to publish',
          failed: response.Failed,
        });
      }
    } catch (error) {
      logger.error({
        message: 'Failed to publish batch to SQS',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Cerrar conexión (si es necesario)
   */
  async close(): Promise<void> {
    this.sqsClient.destroy();
    logger.info({ message: 'SQS Event Bus closed' });
  }
}
