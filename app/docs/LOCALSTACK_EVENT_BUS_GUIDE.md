# 🎯 Guía Rápida: Event Bus con LocalStack

## ✅ Resumen de la Configuración

Tu aplicación ahora puede emitir eventos a **LocalStack** (que simula AWS SQS/SNS) corriendo en tu Docker Compose.

### 📦 Servicios en Docker Compose

```yaml
localstack:
  - Puerto: 4567 (mapeado a 4566 interno)
  - Servicios: DynamoDB, SQS, SNS
  - Scripts de inicialización automática
```

**Importante:** LocalStack corre internamente en el puerto 4566, pero desde tu máquina host (donde corre Node.js) accedes por el puerto **4567** según tu docker-compose.yml.

## 🚀 Pasos para Usar el Event Bus

### 1️⃣ Levantar Docker Compose

```bash
cd /Users/mapaza/proyects/personal/auth-service-project/app
docker-compose up -d
```

Esto levantará:

- ✅ PostgreSQL (puerto 5432)
- ✅ Redis (puerto 6379)
- ✅ LocalStack con SQS/SNS (puerto 4567)

### 2️⃣ Verificar que LocalStack está listo

```bash
# Esperar ~10 segundos para que LocalStack inicialice
sleep 10

# Verificar health (nota: usa puerto 4567 desde tu máquina)
curl http://localhost:4567/_localstack/health
```

### 3️⃣ Ejecutar el Script de Inicialización (Manual)

Si el volumen automático no funciona, ejecuta manualmente:

```bash
chmod +x scripts/setup-localstack-events.sh
./scripts/setup-localstack-events.sh
```

Esto creará:

- 📋 **SQS Queue**: `auth-events-queue`
- 📢 **SNS Topic**: `auth-events`
- 🔗 **Subscription**: SNS → SQS

### 4️⃣ Configurar el Event Bus en `.env`

**Opción A: Sin infraestructura (Solo logs)**

```env
EVENT_BUS_TYPE=noop
```

**Opción B: Con SQS (Recomendado para desarrollo)**

```env
EVENT_BUS_TYPE=sqs
SQS_QUEUE_URL=http://localhost:4566/000000000000/auth-events-queue
```

**Opción C: Con SNS (Para múltiples consumidores)**

```env
EVENT_BUS_TYPE=sns
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:auth-events
```

### 5️⃣ Iniciar tu Aplicación

```bash
npm run dev
```

Verás en los logs:

```
📋 Configuration:
  ...
  Event Bus: sqs  # o sns, o noop
```

### 6️⃣ Probar Emisión de Eventos

#### Opción 1: Usar la API desde api.http (VS Code)

Abre el archivo `api.http` y ejecuta los requests:

```http
### Registrar usuario (emite evento user.registered)
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123!",
  "name": "Test User"
}

### Login (emite evento user.login.success)
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123!"
}
```

#### Opción 2: Usar curl

```bash
# Registrar usuario (emite evento user.registered)
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User"
  }'

# Login (emite evento user.login.success)
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

#### Opción 3: Usar el script de prueba

```bash
npm run test:eventbus
# o
ts-node examples/test-event-bus.ts
```

### 7️⃣ Verificar Eventos en LocalStack

#### 🎯 Método Recomendado: Usar los Scripts

```bash
# Ver TODOS los eventos
npm run events:view
# o
./scripts/view-events.sh

# Filtrar por tipo de evento
npm run events:filter user.registered
npm run events:filter user.login.success
npm run events:filter user.login.failed
npm run events:filter user.logout
```

#### Método Manual: AWS CLI

```bash
# Ver mensajes en SQS
aws --endpoint-url=http://localhost:4567 \
    --region=us-east-1 \
    sqs receive-message \
    --queue-url http://localhost:4567/000000000000/auth-events-queue \
    --max-number-of-messages 10
```

#### Ver mensajes publicados en SNS (desde CloudWatch Logs en LocalStack UI):

```bash
# LocalStack no persiste SNS messages, pero puedes ver que se publicaron en los logs
docker logs auth-service-localstack | grep sns
```

## 🔍 Verificación de Estado

### Verificar que los recursos existen:

```bash
# Listar colas SQS
aws --endpoint-url=http://localhost:4567 \
    --region=us-east-1 \
    sqs list-queues

# Listar topics SNS
aws --endpoint-url=http://localhost:4567 \
    --region=us-east-1 \
    sns list-topics

# Ver suscripciones
aws --endpoint-url=http://localhost:4567 \
    --region=us-east-1 \
    sns list-subscriptions
```

## 📊 Eventos que se Emiten

### Actualmente implementados:

| Evento               | UseCase           | Cuándo                |
| -------------------- | ----------------- | --------------------- |
| `user.registered`    | CreateUserUseCase | Usuario se registra   |
| `user.login.success` | LoginUserUseCase  | Login exitoso         |
| `user.login.failed`  | LoginUserUseCase  | Login fallido         |
| `user.logout`        | LogoutUserUseCase | Usuario cierra sesión |

### Estructura de un evento:

```json
{
  "type": "user.registered",
  "data": {
    "userId": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-13T10:30:00Z"
  },
  "timestamp": "2025-12-13T10:30:00Z",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## 🐛 Troubleshooting

### LocalStack no se conecta

```bash
# Verificar que el contenedor está corriendo
docker ps | grep localstack

# Ver logs de LocalStack
docker logs auth-service-localstack

# Reiniciar LocalStack
docker-compose restart localstack
```

### Eventos no se publican

1. Verifica tu `.env`:

   ```bash
   cat .env | grep EVENT_BUS_TYPE
   ```

2. Verifica logs de la aplicación:

   ```bash
   # Busca "Event published" en los logs
   ```

3. Verifica que EVENT_BUS_TYPE no sea 'noop'

### Error: Queue/Topic no existe

Ejecuta el script de setup manualmente:

```bash
./scripts/setup-localstack-events.sh
```

## 📁 Archivos Importantes

- **Configuración**: `src/config/environment.ts`
- **Interfaces**: `src/domain/events/`
- **Implementación**: `src/infrastructure/events/`
- **DTOs**: `src/application/dtos/EventDTOs.ts`
- **Docker**: `docker-compose.yml`
- **Setup**: `scripts/setup-localstack-events.sh`
- **Ejemplo**: `examples/test-event-bus.ts`

## 🎯 Próximos Pasos

1. ✅ Eventos se emiten correctamente
2. ⏳ Crear workers/consumers (FASE 2)
3. ⏳ Implementar envío de emails
4. ⏳ Agregar más eventos (password reset, etc.)

## 💡 Consejos

- En **desarrollo**: usa `EVENT_BUS_TYPE=noop` si no necesitas probar eventos
- En **testing local**: usa `EVENT_BUS_TYPE=sqs` con LocalStack
- En **producción**: usa `EVENT_BUS_TYPE=sns` con AWS real (cambiar endpoint y credentials)
