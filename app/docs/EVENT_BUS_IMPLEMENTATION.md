# 🎉 Event Bus - Implementación Completa

## ✅ ¿Qué se implementó?

### FASE 1: Productores de Eventos (Completado)

La aplicación ahora **emite eventos** cuando ocurren acciones importantes:

- ✅ Usuario se registra → `user.registered`
- ✅ Login exitoso → `user.login.success`
- ✅ Login fallido → `user.login.failed`
- ✅ Usuario cierra sesión → `user.logout`

Los eventos se envían a **AWS SQS** o **AWS SNS** (o modo NoOp para desarrollo).

---

## 🚀 Quick Start

### 1. Configurar Variables de Entorno

Edita tu archivo `.env`:

```bash
# Modo de desarrollo (sin infraestructura)
EVENT_BUS_TYPE=noop

# O modo producción con LocalStack
EVENT_BUS_TYPE=sqs
SQS_QUEUE_URL=http://localhost:4566/000000000000/auth-events-queue
```

### 2. Iniciar LocalStack (Opcional)

Si quieres usar SQS/SNS real:

```bash
# Iniciar LocalStack
docker-compose up -d localstack

# Crear recursos (queue y topic)
./scripts/setup-localstack-events.sh
```

### 3. Iniciar la Aplicación

```bash
npm run dev
```

### 4. Probar Eventos

```bash
# Registrar un usuario
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# ✅ Se emitió evento: user.registered
```

### 5. Ver Eventos (LocalStack)

```bash
# Ver mensajes en la cola SQS
aws --endpoint-url=http://localhost:4566 \
    --region=us-east-1 \
    sqs receive-message \
    --queue-url http://localhost:4566/000000000000/auth-events-queue
```

---

## 📁 Archivos Nuevos

### Domain Layer (Interfaces - SOLID)

```
src/domain/events/
├── IEvent.ts           → Interfaz base para eventos
└── IEventBus.ts        → Interfaz del Event Bus (DIP)
```

### Application Layer (DTOs)

```
src/application/dtos/
└── EventDTOs.ts        → Tipos de eventos y sus datos
```

### Infrastructure Layer (Implementaciones)

```
src/infrastructure/events/
├── SQSEventBus.ts      → Implementación con AWS SQS
├── SNSEventBus.ts      → Implementación con AWS SNS
├── NoOpEventBus.ts     → Mock para testing/desarrollo
└── EventBusFactory.ts  → Factory para crear instancias
```

### Configuration

```
src/config/environment.ts   → Variables de entorno (EVENT_BUS_TYPE, etc.)
```

### Documentation

```
docs/EVENT_BUS_GUIDE.md     → Guía completa de uso
```

### Scripts y Ejemplos

```
scripts/setup-localstack-events.sh  → Setup de LocalStack
examples/test-event-bus.ts          → Script de prueba
```

---

## 🔧 Modos de Operación

### 1. Modo NoOp (Desarrollo Local)

```bash
EVENT_BUS_TYPE=noop
```

- ✅ No requiere infraestructura
- ✅ Solo loguea eventos
- ✅ Ideal para desarrollo

### 2. Modo SQS (Cola Simple)

```bash
EVENT_BUS_TYPE=sqs
SQS_QUEUE_URL=http://localhost:4566/000000000000/auth-events-queue
```

- ✅ Un solo consumidor
- ✅ Orden garantizado (FIFO opcional)
- ✅ Simple y económico

### 3. Modo SNS (Pub/Sub Avanzado)

```bash
EVENT_BUS_TYPE=sns
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:auth-events
```

- ✅ Múltiples suscriptores
- ✅ Fan-out pattern
- ✅ Flexible

---

## 📊 Eventos Implementados

| Evento               | Trigger               | Datos                                   |
| -------------------- | --------------------- | --------------------------------------- |
| `user.registered`    | Usuario se registra   | userId, email, name, createdAt          |
| `user.login.success` | Login exitoso         | userId, email, sessionId, ip, userAgent |
| `user.login.failed`  | Login fallido         | email, reason, ip, timestamp            |
| `user.logout`        | Usuario cierra sesión | userId, email, sessionId, timestamp     |

---

## 🧪 Testing

### Test Manual con Script

```bash
# Ejecutar script de prueba
npm run test:eventbus
# o
npx ts-node examples/test-event-bus.ts
```

### Test de Integración Completo

```bash
# 1. Iniciar LocalStack
docker-compose up -d localstack

# 2. Configurar recursos (se ejecuta automáticamente con el volumen)
# O manualmente:
./scripts/setup-localstack-events.sh

# 3. Configurar .env
EVENT_BUS_TYPE=sqs
AWS_ENDPOINT=http://localhost:4567  # Puerto correcto
SQS_QUEUE_URL=http://localhost:4567/000000000000/auth-events-queue

# 4. Iniciar app
npm run dev

# 5. Hacer requests desde api.http o con curl
# Ejemplo: Registrar usuario
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test"}'

# 6. Ver eventos en cola
npm run events:view
# o
./scripts/view-events.sh

# 7. Filtrar eventos por tipo
npm run events:filter user.registered
npm run events:filter user.login.success
```

---

## 🏗️ Arquitectura

### Principios SOLID Aplicados

#### ✅ Single Responsibility

- Cada clase tiene una responsabilidad única
- `SQSEventBus` solo publica a SQS
- `CreateUserUseCase` solo crea usuarios

#### ✅ Open/Closed

- Fácil agregar nuevos tipos de EventBus
- Nuevos eventos sin modificar código existente

#### ✅ Liskov Substitution

- Todos los EventBus son intercambiables
- Tests usan `NoOpEventBus`

#### ✅ Interface Segregation

- `IEventBus` tiene solo lo necesario
- Interfaces mínimas y focalizadas

#### ✅ Dependency Inversion

- UseCases dependen de `IEventBus` (abstracción)
- No dependen de SQS/SNS directamente

---

## 🔍 Debugging

### Ver Logs

Los eventos emitidos se loguean automáticamente:

```json
{
  "message": "Event published to SQS",
  "eventId": "abc-123",
  "eventType": "user.registered",
  "messageId": "def-456"
}
```

### Errores No Bloquean

Si falla el envío del evento:

- ✅ El usuario se registra exitosamente
- ❌ El evento no se envía
- 📝 El error se loguea

```json
{
  "message": "Failed to publish event",
  "eventType": "user.registered",
  "error": "Network timeout"
}
```

---

## 📈 Próximos Pasos (FASE 2)

### Workers/Consumers

Crear un proyecto separado para consumir eventos:

```
auth-service-workers/
├── src/
│   ├── consumers/
│   │   ├── EmailConsumer.ts      → Envía emails
│   │   ├── AnalyticsConsumer.ts  → Registra analytics
│   │   └── WebhookConsumer.ts    → Notifica a webhooks
│   ├── services/
│   │   ├── EmailService.ts       → SendGrid, SES
│   │   └── AnalyticsService.ts   → Mixpanel, Segment
│   └── index.ts
└── package.json
```

### Implementación de Consumers

```typescript
// workers/src/consumers/EmailConsumer.ts
import { SQSConsumer } from 'sqs-consumer';
import { EmailService } from '../services/EmailService';

const consumer = SQSConsumer.create({
  queueUrl: process.env.SQS_QUEUE_URL,
  handleMessage: async (message) => {
    const event = JSON.parse(message.Body);

    if (event.type === 'user.registered') {
      await emailService.sendWelcomeEmail({
        to: event.data.email,
        name: event.data.name,
      });
    }
  },
});

consumer.start();
```

---

## 🎯 Casos de Uso Futuros

1. 📧 **Emails**
   - Bienvenida
   - Verificación de email
   - Reset de contraseña

2. 📊 **Analytics**
   - Tracking de eventos
   - Dashboards en tiempo real

3. 🔔 **Notificaciones**
   - Push notifications
   - SMS
   - Slack/Discord webhooks

4. 🧹 **Background Jobs**
   - Limpiar sesiones expiradas
   - Generar reportes
   - Exportar datos

5. 🔐 **Security**
   - Detección de fraude
   - Alertas de seguridad
   - Rate limiting distribuido

---

## 📚 Documentación

- [Guía Completa del Event Bus](docs/EVENT_BUS_GUIDE.md)
- [AWS SQS Docs](https://docs.aws.amazon.com/sqs/)
- [AWS SNS Docs](https://docs.aws.amazon.com/sns/)
- [LocalStack Docs](https://docs.localstack.cloud/)

---

## 💡 Tips

1. ✅ **Empieza con NoOp** para desarrollo local
2. ✅ **Usa LocalStack** antes de AWS real
3. ✅ **Fire & Forget** - No esperes confirmación
4. ✅ **Loguea todo** para debugging
5. ✅ **Workers idempotentes** - Diseña para reenvíos

---

## ❓ FAQ

**¿Los eventos bloquean la respuesta?**  
❌ No, los eventos se envían asíncronamente.

**¿Qué pasa si falla el envío?**  
Se loguea el error pero la operación principal continúa.

**¿Necesito LocalStack?**  
Solo si quieres probar SQS/SNS. Con `EVENT_BUS_TYPE=noop` no necesitas nada.

**¿Cuándo implementar los workers?**  
Cuando necesites procesar eventos (enviar emails, etc).

---

## 🎉 ¡Listo!

La aplicación ahora emite eventos. Los workers se implementarán en la Fase 2 cuando sea necesario.

**Estado actual:**

```
✅ EventBus configurado
✅ Eventos emitiendo en UseCases
✅ SQS/SNS/NoOp funcionando
✅ Tests pasando
✅ Documentación completa
⏳ Workers (Fase 2)
```
