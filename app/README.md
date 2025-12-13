# Auth Service Project - Clean Architecture + Prisma + PostgreSQL

Proyecto Node.js con TypeScript, PostgreSQL, Prisma ORM y Clean Architecture.

## 🏗️ Arquitectura

Este proyecto sigue los principios de Clean Architecture:

```
src/
├── domain/              # Entidades y lógica de negocio
├── application/         # Casos de uso
├── infrastructure/      # Implementaciones (Prisma, Redis, DynamoDB)
└── interfaces/          # Controllers y rutas
```

## 🚀 Stack Tecnológico

- **Runtime**: Node.js 18 + TypeScript 5
- **Framework**: Express.js
- **Database**: PostgreSQL 16 Alpine
- **ORM**: Prisma 7 (con adapter)
- **Cache**: Redis 7
- **Sessions**: DynamoDB (LocalStack)
- **Architecture**: Clean Architecture + SOLID
- **Patterns**: Repository, Decorator, Factory, Singleton

## ✨ Features

- ✅ **Prisma ORM**: Type-safe database queries
- ✅ **PostgreSQL 16**: Base de datos robusta y escalable
- ✅ **Redis Caching**: Decorator pattern para caché transparente
- ✅ **Rate Limiting**: Protección anti-spam y anti-bruteforce
- ✅ **DynamoDB Sessions**: Sesiones con TTL automático
- ✅ **Event Bus**: Sistema de eventos asíncronos con AWS SQS/SNS (LocalStack)
- ✅ **AsyncHandler**: Manejo robusto de errores en rutas Express
- ✅ **Performance Monitoring**: Métricas en tiempo real
- ✅ **Centralized Config**: Sin `process.env` directo
- ✅ **Pagination**: Listados eficientes
- ✅ **Type Safety**: 100% TypeScript
- ✅ **Prisma Studio**: GUI visual de base de datos
- ✅ **Adminer**: Admin UI para PostgreSQL

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18
- Docker y Docker Compose
- npm o yarn

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repo-url>
cd auth-service-project
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env si es necesario
```

4. **Levantar servicios con Docker**

```bash
docker-compose up -d
```

5. **Ejecutar migraciones de Prisma**

```bash
npm run prisma:migrate
```

6. **Iniciar servidor**

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar en modo desarrollo

# Build
npm run build            # Compilar TypeScript
npm start               # Ejecutar versión compilada

# Testing
npm test                # Ejecutar tests
npm run test:ratelimit  # Probar rate limiting

# Prisma
npm run prisma:migrate  # Crear/aplicar migraciones
npm run prisma:generate # Generar Prisma Client
npm run prisma:studio   # Abrir Prisma Studio (GUI)
npm run prisma:reset    # Reset database

# Event Bus (Sistema de Eventos)
npm run test:eventbus              # Probar Event Bus manualmente
npm run events:view                # Ver todos los eventos emitidos
npm run events:filter user.registered      # Filtrar por tipo específico
npm run events:filter user.login.success
npm run events:filter user.login.failed
npm run events:filter user.logout

# Code Quality
npm run lint            # ESLint
npm run format          # Prettier
```

## 🐳 Docker Services

```yaml
Services:
  - postgres:5432 # PostgreSQL 16
  - redis:6379 # Redis 7
  - localstack:4567 # DynamoDB, SQS, SNS (AWS local)
  - adminer:8080 # PostgreSQL Admin UI
```

### LocalStack Services (Port 4567)

LocalStack simula servicios AWS localmente:

- **DynamoDB**: Sesiones con TTL automático
- **SQS**: Cola de eventos (`auth-events-queue`)
- **SNS**: Topics para pub/sub (`auth-events`)

```bash
# Verificar salud de LocalStack
curl http://localhost:4567/_localstack/health

# Ver eventos en SQS
npm run events:view

# Filtrar eventos por tipo
npm run events:filter user.registered
```

### Acceder a Adminer

```
URL: http://localhost:8080
Sistema: PostgreSQL
Servidor: postgres
Usuario: authuser
Contraseña: authpass
Base de datos: auth_service_db
```

### Acceder a Prisma Studio

```bash
npm run prisma:studio
# Abre en: http://localhost:5555
```

## 🔒 Endpoints API

### Públicos

- `POST /api/users/register` - Registrar nuevo usuario (Rate limit: 3/hora)
- `POST /api/users/login` - Login (Rate limit: 5 fallos/15min)

### Protegidos (requieren JWT)

- `POST /api/users/logout` - Cerrar sesión
- `GET /api/users/:id` - Obtener usuario por ID
- `GET /api/users?limit=10&offset=0` - Listar usuarios (paginado)

### Sistema

- `GET /` - Info del API
- `GET /health` - Health check + métricas de performance

## 📖 Documentación

- **[docs/](docs/)** - 📚 **Índice completo de documentación**
- **[docs/EVENT_BUS_GUIDE.md](docs/EVENT_BUS_GUIDE.md)** - Sistema de eventos asíncronos completo
- **[docs/EVENT_BUS_IMPLEMENTATION.md](docs/EVENT_BUS_IMPLEMENTATION.md)** - Resumen de implementación
- **[docs/LOCALSTACK_EVENT_BUS_GUIDE.md](docs/LOCALSTACK_EVENT_BUS_GUIDE.md)** - LocalStack con SQS/SNS
- **[docs/STATUS.md](docs/STATUS.md)** - Estado actual del proyecto
- **[docs/EXECUTIVE_SUMMARY.md](docs/EXECUTIVE_SUMMARY.md)** - Resumen ejecutivo v3.1.0
- **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Referencia rápida de comandos
- **[docs/CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md)** - Sistema de configuración centralizada
- **[docs/POSTGRESQL_MIGRATION.md](docs/POSTGRESQL_MIGRATION.md)** - Guía de migración MySQL → PostgreSQL
- **[docs/OPTIMIZATION_GUIDE.md](docs/OPTIMIZATION_GUIDE.md)** - Redis, Rate Limiting, Caché
- **[docs/RATE_LIMIT_TESTING.md](docs/RATE_LIMIT_TESTING.md)** - Testing de rate limiting
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura Clean detallada
- **[docs/DEBUG_GUIDE.md](docs/DEBUG_GUIDE.md)** - Debugging en VS Code
- **[docs/API_EXAMPLES.md](docs/API_EXAMPLES.md)** - Ejemplos de uso del API
- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - Guía de inicio rápido
- **[docs/VALIDATION_GUIDE.md](docs/VALIDATION_GUIDE.md)** - Validación de datos

## 🏗️ Arquitectura Clean

```
┌────────────────────────────────────────┐
│           Domain Layer                 │
│  - User Entity                         │
│  - UserRepository Interface            │
│  - SessionRepository Interface         │
│  - IEventBus Interface (NEW)           │
│  - IEvent Interface (NEW)              │
└────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────┐
│        Application Layer               │
│  - CreateUserUseCase                   │
│  - LoginUserUseCase                    │
│  - GetUserUseCase                      │
│  - LogoutUserUseCase                   │
│  - EventDTOs (NEW)                     │
└────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────┐
│       Infrastructure Layer             │
│  - PrismaUserRepository                │
│  - CachedUserRepository (Decorator)    │
│  - DynamoDBSessionRepository           │
│  - SQSEventBus (NEW)                   │
│  - SNSEventBus (NEW)                   │
│  - NoOpEventBus (NEW)                  │
│  - EventBusFactory (NEW)               │
│  - PrismaConnection (Singleton)        │
│  - RedisCache                          │
│  - RateLimitMiddleware (Factory)       │
│  - AsyncHandler (NEW)                  │
└────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────┐
│        Interface Layer                 │
│  - UserController                      │
│  - Express Routes                      │
│  - Validation Middleware               │
│  - Auth Middleware                     │
└────────────────────────────────────────┘
```

## 🎨 Patrones de Diseño

- **Repository Pattern**: Abstracción de acceso a datos
- **Decorator Pattern**: `CachedUserRepository` envuelve cualquier repository
- **Factory Pattern**: `RateLimitFactory`, `EventBusFactory` crean instancias configuradas
- **Singleton Pattern**: `PrismaConnection`, `RedisConnection`, `DynamoDBConnection`
- **Dependency Injection**: Casos de uso inyectan repositorios y EventBus
- **Dependency Inversion**: UseCases dependen de `IEventBus`, no de implementaciones
- **AsyncHandler Pattern**: Wrapper para manejo robusto de errores async en Express

## � Sistema de Eventos

Sistema completo de eventos asíncronos que permite desacoplar operaciones secundarias del flujo principal.

### Eventos Implementados

| Evento               | Cuándo se Emite       | Datos Incluidos              |
| -------------------- | --------------------- | ---------------------------- |
| `user.registered`    | Usuario se registra   | userId, email, name          |
| `user.login.success` | Login exitoso         | userId, email, ip, sessionId |
| `user.login.failed`  | Login fallido         | email, reason, ip            |
| `user.logout`        | Usuario cierra sesión | userId, email, sessionId     |

### Implementaciones Disponibles

```typescript
// 1. NoOp - Para desarrollo local sin infraestructura
EVENT_BUS_TYPE=noop

// 2. SQS - Cola simple para un solo consumidor
EVENT_BUS_TYPE=sqs
SQS_QUEUE_URL=http://localhost:4567/000000000000/auth-events-queue

// 3. SNS - Pub/Sub para múltiples suscriptores
EVENT_BUS_TYPE=sns
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:auth-events
```

### Comandos Útiles

```bash
# Ver todos los eventos emitidos
npm run events:view

# Filtrar por tipo específico
npm run events:filter user.registered
npm run events:filter user.login.success
npm run events:filter user.login.failed
npm run events:filter user.logout

# Probar Event Bus manualmente
npm run test:eventbus

# Purgar todos los eventos (limpiar cola)
aws --endpoint-url=http://localhost:4567 \
  sqs purge-queue \
  --queue-url http://localhost:4567/000000000000/auth-events-queue
```

### Arquitectura de Eventos

```
UserController → UseCase → EventBus.publish()
                              ↓
                    ┌─────────┴──────────┐
                    │                    │
                SQSEventBus         SNSEventBus
                    │                    │
                    ↓                    ↓
              LocalStack SQS      LocalStack SNS
                    │                    │
                    └─────────┬──────────┘
                              ↓
                      [Future Workers]
                    (Email, Analytics, etc.)
```

**Nota**: Actualmente en **Fase 1** (solo productores). Los consumidores/workers serán implementados en Fase 2.

## �📊 Performance

- **Redis Cache**: 80-95% hit rate, ~8ms vs ~45ms sin caché
- **Rate Limiting**: Redis counters con TTL automático
- **Connection Pooling**: PostgreSQL pool optimizado
- **Pagination**: Queries eficientes con `LIMIT/OFFSET`
- **Monitoring**: Métricas en `/health` endpoint

## 🔐 Seguridad

- ✅ Rate limiting por IP
- ✅ JWT con expiración
- ✅ Sesiones en DynamoDB con TTL
- ✅ Bcrypt para passwords
- ✅ Validación de inputs (class-validator)
- ✅ CORS configurado

## 🧪 Testing

```bash
# Unit tests
npm test

# Rate limit testing
npm run test:ratelimit

# Manual testing con curl
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test"}'
```

## 📦 Tecnologías

| Categoría  | Tecnología      |
| ---------- | --------------- |
| Runtime    | Node.js 18      |
| Language   | TypeScript 5    |
| Framework  | Express.js      |
| Database   | PostgreSQL 16   |
| ORM        | Prisma 7        |
| Cache      | Redis 7         |
| Sessions   | DynamoDB        |
| Event Bus  | AWS SQS/SNS     |
| AWS Local  | LocalStack 3.0  |
| Validation | class-validator |
| Auth       | JWT             |
| Password   | bcrypt          |
| Containers | Docker Compose  |

## 🚧 Troubleshooting

### Error: Cannot connect to PostgreSQL

```bash
# Verificar que el contenedor esté corriendo
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart postgres
```

### Error: Prisma Client not generated

```bash
npm run prisma:generate
```

### Error: Migration failed

```bash
# Reset database (⚠️ solo desarrollo)
npm run prisma:reset
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

Tu nombre

---

⭐ Si te gustó el proyecto, dale una estrella!
