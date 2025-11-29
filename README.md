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

# Code Quality
npm run lint            # ESLint
npm run format          # Prettier
```

## 🐳 Docker Services

```yaml
Services:
  - postgres:5432 # PostgreSQL 16
  - redis:6379 # Redis 7
  - localstack:4567 # DynamoDB local
  - adminer:8080 # PostgreSQL Admin UI
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

- **[CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md)** - Sistema de configuración centralizada
- **[POSTGRESQL_MIGRATION.md](docs/POSTGRESQL_MIGRATION.md)** - Guía de migración MySQL → PostgreSQL
- **[OPTIMIZATION_GUIDE.md](docs/OPTIMIZATION_GUIDE.md)** - Redis, Rate Limiting, Caché
- **[RATE_LIMIT_TESTING.md](docs/RATE_LIMIT_TESTING.md)** - Testing de rate limiting
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura Clean detallada
- **[DEBUG_GUIDE.md](docs/DEBUG_GUIDE.md)** - Debugging en VS Code
- **[API_EXAMPLES.md](docs/API_EXAMPLES.md)** - Ejemplos de uso del API
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Guía de inicio rápido
- **[VALIDATION_GUIDE.md](docs/VALIDATION_GUIDE.md)** - Validación de datos

## 🏗️ Arquitectura Clean

```
┌────────────────────────────────────────┐
│           Domain Layer                 │
│  - User Entity                         │
│  - UserRepository Interface            │
│  - SessionRepository Interface         │
└────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────┐
│        Application Layer               │
│  - CreateUserUseCase                   │
│  - LoginUserUseCase                    │
│  - GetUserUseCase                      │
│  - LogoutUserUseCase                   │
└────────────────────────────────────────┘
              ▲
              │
┌────────────────────────────────────────┐
│       Infrastructure Layer             │
│  - PrismaUserRepository                │
│  - CachedUserRepository (Decorator)    │
│  - DynamoDBSessionRepository           │
│  - PrismaConnection (Singleton)        │
│  - RedisCache                          │
│  - RateLimitMiddleware (Factory)       │
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
- **Factory Pattern**: `RateLimitFactory` crea rate limiters configurados
- **Singleton Pattern**: `PrismaConnection`, `RedisConnection`, `DynamoDBConnection`
- **Dependency Injection**: Casos de uso inyectan repositorios

## 📊 Performance

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
