/**
 * Script de ejemplo para probar el Event Bus
 *
 * Uso:
 * 1. Configurar .env con EVENT_BUS_TYPE=noop (o sqs/sns)
 * 2. Ejecutar: ts-node examples/test-event-bus.ts
 */

import { EventBusFactory } from '../src/infrastructure/events/EventBusFactory';
import { IEvent } from '../src/domain/events/IEvent';
import { EventType, UserRegisteredEventData } from '../src/application/dtos/EventDTOs';
import { logger } from '../src/infrastructure/logger/Logger';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function testEventBus() {
  console.log('\n🧪 Testing Event Bus\n');

  // Crear instancia del Event Bus
  const eventBus = EventBusFactory.create();

  // Ejemplo 1: Evento de usuario registrado
  const userRegisteredEvent: IEvent = {
    type: EventType.USER_REGISTERED,
    data: {
      userId: '123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    } as UserRegisteredEventData,
    timestamp: new Date(),
    metadata: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    },
  };

  // Ejemplo 2: Evento de login exitoso
  const loginSuccessEvent: IEvent = {
    type: EventType.USER_LOGIN_SUCCESS,
    data: {
      userId: '123',
      email: 'test@example.com',
      sessionId: 'session-abc-123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  };

  // Ejemplo 3: Evento de login fallido
  const loginFailedEvent: IEvent = {
    type: EventType.USER_LOGIN_FAILED,
    data: {
      email: 'test@example.com',
      reason: 'invalid_credentials',
      ip: '192.168.1.1',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  };

  try {
    console.log('📤 Publishing user.registered event...');
    await eventBus.publish(userRegisteredEvent);
    console.log('✅ Event published successfully\n');

    console.log('📤 Publishing user.login.success event...');
    await eventBus.publish(loginSuccessEvent);
    console.log('✅ Event published successfully\n');

    console.log('📤 Publishing user.login.failed event...');
    await eventBus.publish(loginFailedEvent);
    console.log('✅ Event published successfully\n');

    // Ejemplo de batch
    console.log('📤 Publishing batch of events...');
    await eventBus.publishBatch([userRegisteredEvent, loginSuccessEvent, loginFailedEvent]);
    console.log('✅ Batch published successfully\n');

    console.log('🎉 All tests completed!\n');
  } catch (error) {
    console.error('❌ Error publishing events:', error);
    process.exit(1);
  }
}

// Ejecutar test
testEventBus()
  .then(() => {
    console.log('✨ Test finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
