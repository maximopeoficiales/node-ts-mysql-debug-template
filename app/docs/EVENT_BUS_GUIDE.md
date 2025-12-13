# 📨 Event Bus - Guía de Uso

## 🎯 Introducción

El sistema de eventos permite desacoplar la aplicación de tareas asíncronas como envío de emails, notificaciones, analytics, etc.

**Arquitectura:**

```
API Express → EventBus → AWS SQS/SNS → Workers (Fase 2)
```

---

## 🏗️ Arquitectura Implementada

### Principios SOLID Aplicados

#### 1. **Single Responsibility Principle (SRP)**

Cada clase tiene una única responsabilidad:

- `SQSEventBus`: Solo publica a SQS
- `SNSEventBus`: Solo publica a SNS
- `NoOpEventBus`: Mock para testing

#### 2. **Open/Closed Principle (OCP)**

- Fácil agregar nuevos tipos de EventBus sin modificar código existente
- Nuevos eventos se agregan en `EventDTOs.ts`

#### 3. **Liskov Substitution Principle (LSP)**

- Todos los EventBus implementan `IEventBus`
- Intercambiables sin romper la aplicación

#### 4. **Interface Segregation Principle (ISP)**

- `IEventBus` tiene solo los métodos necesarios
- `IEvent` es una interfaz mínima

#### 5. **Dependency Inversion Principle (DIP)**

- UseCases dependen de `IEventBus` (abstracción)
- No dependen de implementaciones concretas

---

## 📦 Componentes

### 1. **Domain Layer** (Interfaces)

```typescript
// domain/events/IEvent.ts
interface IEvent {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  eventId?: string;
  metadata?: Record<string, any>;
}

// domain/events/IEventBus.ts
interface IEventBus {
  publish(event: IEvent): Promise<void>;
  publishBatch(events: IEvent[]): Promise<void>;
}
```

### 2. **Application Layer** (DTOs)

```typescript
// application/dtos/EventDTOs.ts
export enum EventType {
  USER_REGISTERED = 'user.registered',
  USER_LOGIN_SUCCESS = 'user.login.success',
  USER_LOGIN_FAILED = 'user.login.failed',
  USER_LOGOUT = 'user.logout',
  // ... más eventos
}

export interface UserRegisteredEventData {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
}
```

### 3. **Infrastructure Layer** (Implementaciones)

```typescript
// infrastructure/events/
├── SQSEventBus.ts        → Publica a AWS SQS
├── SNSEventBus.ts        → Publica a AWS SNS
├── NoOpEventBus.ts       → Mock para testing
└── EventBusFactory.ts    → Factory para crear instancias
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# Tipo de Event Bus
EVENT_BUS_TYPE=noop  # Opciones: 'noop' | 'sqs' | 'sns'

# AWS Configuration (reutiliza las de DynamoDB)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566  # LocalStack

# SNS (si EVENT_BUS_TYPE=sns)
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:auth-events

# SQS (si EVENT_BUS_TYPE=sqs)
SQS_QUEUE_URL=http://localhost:4566/000000000000/auth-events-queue
```

### Modos de Operación

#### 1. **Modo NoOp (Desarrollo)**

```bash
EVENT_BUS_TYPE=noop
```

- No envía eventos reales
- Solo los loguea
- Ideal para desarrollo local sin infraestructura

#### 2. **Modo SQS (Producción Simple)**

```bash
EVENT_BUS_TYPE=sqs
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/auth-events
```

- Envía eventos a una cola SQS
- Un solo consumidor (worker)

#### 3. **Modo SNS (Producción Avanzada)**

```bash
EVENT_BUS_TYPE=sns
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:auth-events
```

- Publica a un topic SNS
- Múltiples suscriptores (SQS queues, Lambdas, etc.)

---

## 🚀 Uso en UseCases

### Ejemplo: CreateUserUseCase

```typescript
import { IEventBus } from '../../domain/events/IEventBus';
import { EventType, UserRegisteredEventData } from '../dtos/EventDTOs';

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus?: IEventBus // Opcional
  ) {}

  async execute(userData: CreateUserDTO): Promise<User> {
    // 1. Crear usuario
    const user = await this.userRepository.create(userData);

    // 2. Emitir evento (asíncrono, no bloquea)
    if (this.eventBus) {
      const event: IEvent = {
        type: EventType.USER_REGISTERED,
        data: {
          userId: user.id.toString(),
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        } as UserRegisteredEventData,
        timestamp: new Date(),
      };

      // Fire & forget - no esperamos respuesta
      this.eventBus.publish(event).catch((error) => {
        logger.error({ message: 'Failed to publish event', error });
      });
    }

    // 3. Retornar inmediatamente
    return user;
  }
}
```

---

## 📋 Eventos Disponibles

### Eventos de Usuario

- ✅ `user.registered` - Usuario creado
- ✅ `user.login.success` - Login exitoso
- ✅ `user.login.failed` - Login fallido
- ✅ `user.logout` - Usuario cerró sesión
- ⏳ `user.password.changed` - Contraseña cambiada
- ⏳ `user.email.changed` - Email cambiado
- ⏳ `user.deleted` - Usuario eliminado

### Eventos de Seguridad

- ⏳ `security.login.suspicious` - Login sospechoso
- ⏳ `security.login.failed.multiple` - Múltiples intentos fallidos
- ⏳ `security.session.invalidated` - Sesión invalidada
- ⏳ `security.sessions.invalidated.all` - Todas las sesiones cerradas

### Eventos de Verificación

- ⏳ `email.verification.required` - Verificación de email necesaria
- ⏳ `email.verified` - Email verificado
- ⏳ `password.reset.requested` - Reset de contraseña solicitado
- ⏳ `password.reset.completed` - Reset completado

✅ = Implementado | ⏳ = Pendiente

---

## 🧪 Testing

### Test Unitario con NoOpEventBus

```typescript
import { EventBusFactory } from '../../infrastructure/events/EventBusFactory';

describe('CreateUserUseCase', () => {
  it('should create user and publish event', async () => {
    // Usar NoOp para testing
    const eventBus = EventBusFactory.createForTesting();

    const useCase = new CreateUserUseCase(mockUserRepository, eventBus);

    const user = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(user).toBeDefined();
    // El evento se loguea pero no se envía realmente
  });
});
```

### Test de Integración con LocalStack

1. Iniciar LocalStack:

```bash
docker-compose up localstack
```

2. Configurar:

```bash
EVENT_BUS_TYPE=sqs
AWS_ENDPOINT=http://localhost:4566
SQS_QUEUE_URL=http://localhost:4566/000000000000/auth-events-queue
```

3. Verificar eventos:

```bash
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/auth-events-queue
```

---

## 🔍 Debugging y Monitoreo

### Logs

Cada evento publicado genera logs:

```json
{
  "message": "Event published to SQS",
  "eventId": "abc-123-xyz",
  "eventType": "user.registered",
  "messageId": "def-456-uvw"
}
```

### Errores

Si falla la publicación:

```json
{
  "message": "Failed to publish event to SQS",
  "eventType": "user.registered",
  "error": "Network timeout"
}
```

**Importante:** Los errores NO bloquean la respuesta al usuario.

---

## 📊 Flujo Completo

```
1. Usuario hace POST /api/users/register

2. CreateUserUseCase.execute()
   ├─> Crear usuario en DB
   ├─> Emitir evento user.registered
   └─> Retornar respuesta (200 OK)

3. EventBus.publish()
   ├─> Serializar evento a JSON
   ├─> Enviar a SQS/SNS
   └─> Log de confirmación

4. AWS SQS/SNS
   └─> Evento queda en cola esperando worker

5. FASE 2: Worker consume evento
   └─> Enviar email de bienvenida
```

---

## 🔐 Seguridad

### Datos Sensibles

**❌ NO incluir en eventos:**

- Contraseñas (ni hasheadas)
- Tokens JWT completos
- API Keys
- Información de tarjetas de crédito

**✅ SÍ incluir:**

- IDs de usuario
- Emails
- Nombres
- Metadata (IP, user-agent)

### Ejemplo Correcto

```typescript
{
  type: 'user.registered',
  data: {
    userId: '123',
    email: 'user@example.com',
    name: 'John Doe',
    createdAt: '2024-01-15T10:30:00Z'
  }
  // ❌ NO: password: 'hashed...'
}
```

---

## 🚀 Próximos Pasos (Fase 2)

### 1. Crear Proyecto de Workers

```bash
# Nuevo proyecto separado
mkdir auth-service-workers
cd auth-service-workers
npm init -y
npm install @aws-sdk/client-sqs
```

### 2. Implementar Consumers

```typescript
// workers/src/consumers/EmailConsumer.ts
import { SQSConsumer } from 'sqs-consumer';

const consumer = SQSConsumer.create({
  queueUrl: process.env.SQS_QUEUE_URL,
  handleMessage: async (message) => {
    const event = JSON.parse(message.Body);

    switch (event.type) {
      case 'user.registered':
        await sendWelcomeEmail(event.data);
        break;
      case 'user.login.success':
        await logLoginToAnalytics(event.data);
        break;
    }
  },
});

consumer.start();
```

### 3. Deployar Workers

- AWS Lambda
- ECS/Fargate
- EC2 con PM2
- Kubernetes

---

## 📚 Referencias

- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## 💡 Tips

1. **Empezar con NoOp** en desarrollo local
2. **Usar LocalStack** para testing antes de AWS real
3. **SNS > SQS** si necesitas múltiples consumidores
4. **Fire & Forget** - No esperar confirmación
5. **Idempotencia** - Diseñar workers para reenvíos

---

## ❓ FAQ

### ¿Qué pasa si falla el envío del evento?

El error se loguea pero **NO** bloquea la respuesta al usuario. La operación principal (ej: crear usuario) ya se completó.

### ¿Cómo sé si un evento se envió?

Revisa los logs o la consola de AWS/LocalStack.

### ¿Puedo enviar eventos sincrónicamente?

No recomendado. Los eventos son para tareas asíncronas.

### ¿Cuánto cuesta AWS SQS/SNS?

SQS: $0.40 por millón de requests  
SNS: $0.50 por millón de notificaciones  
(Muy económico para la mayoría de aplicaciones)

### ¿Necesito configurar algo en AWS?

Sí, crear el SQS Queue o SNS Topic. En LocalStack se crean automáticamente.
