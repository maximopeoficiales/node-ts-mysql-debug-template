# 📋 Guía de Configuración

Este proyecto utiliza un sistema centralizado de configuración en `src/config/environment.ts` para gestionar todas las variables de entorno.

## 🎯 Ventajas

✅ **Type-safety**: TypeScript valida todas las configuraciones  
✅ **Centralización**: Un solo punto de configuración  
✅ **Validación**: Detecta errores al inicio de la aplicación  
✅ **Documentación**: Fácil de entender qué variables se necesitan  
✅ **Testing**: Fácil de mockear en tests  
✅ **IntelliSense**: Autocompletado en el IDE

---

## 📦 Estructura del Config

```typescript
import { config } from '@/config/environment';

// Servidor
config.server.port; // 3000
config.server.nodeEnv; // 'development' | 'production'
config.server.isDevelopment; // boolean
config.server.isProduction; // boolean

// Base de datos
config.database.host; // 'localhost'
config.database.port; // 3306 | 5432
config.database.user; // 'authuser'
config.database.password; // 'authpass'
config.database.name; // 'auth_service_db'
config.database.url; // 'postgresql://...' (para Prisma)

// JWT
config.jwt.secret; // 'your-secret-key'
config.jwt.expiresIn; // '1h'

// Redis
config.redis.host; // 'localhost'
config.redis.port; // 6379
config.redis.password; // ''
config.redis.cacheTTL; // 3600 (segundos)

// DynamoDB
config.dynamodb.region; // 'us-east-1'
config.dynamodb.endpoint; // 'http://localhost:4567'
config.dynamodb.sessionsTable; // 'auth-sessions'
config.dynamodb.accessKeyId; // 'test'
config.dynamodb.secretAccessKey; // 'test'

// Rate Limiting
config.rateLimit.register.points; // 3
config.rateLimit.register.duration; // 3600 (segundos)
config.rateLimit.login.points; // 5
config.rateLimit.login.duration; // 900
config.rateLimit.general.points; // 100
config.rateLimit.general.duration; // 3600
config.rateLimit.moderate.points; // 300
config.rateLimit.moderate.duration; // 900
config.rateLimit.strict.points; // 10
config.rateLimit.strict.duration; // 3600

// Performance
config.performance.slowRequestThreshold; // 1000 (ms)
```

---

## 🔧 Variables de Entorno (.env)

### Servidor

```env
PORT=3000
NODE_ENV=development
```

### Base de Datos (PostgreSQL)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=authuser
DB_PASSWORD=authpass
DB_NAME=auth_service_db
DATABASE_URL="postgresql://authuser:authpass@localhost:5432/auth_service_db?schema=public"
```

### Base de Datos (MySQL - legacy)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=auth_service_db
```

### JWT

```env
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h
```

### Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=3600
```

### DynamoDB (LocalStack)

```env
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:4567
DYNAMODB_SESSIONS_TABLE=auth-sessions
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### Rate Limiting (Opcional - tienen valores por defecto)

```env
# Registro: 3 por hora
RATE_LIMIT_REGISTER_POINTS=3
RATE_LIMIT_REGISTER_DURATION=3600

# Login: 5 por 15 minutos
RATE_LIMIT_LOGIN_POINTS=5
RATE_LIMIT_LOGIN_DURATION=900

# General: 100 por hora
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=3600

# Moderado: 300 por 15 minutos
RATE_LIMIT_MODERATE_POINTS=300
RATE_LIMIT_MODERATE_DURATION=900

# Estricto: 10 por hora
RATE_LIMIT_STRICT_POINTS=10
RATE_LIMIT_STRICT_DURATION=3600
```

### Performance

```env
SLOW_REQUEST_THRESHOLD=1000
```

---

## 🚀 Uso en el Código

### ❌ **ANTES** (No hacer)

```typescript
// Malo: acceso directo a process.env
const port = parseInt(process.env.PORT || '3000');
const dbHost = process.env.DB_HOST || 'localhost';
const jwtSecret = process.env.JWT_SECRET || 'default';
```

### ✅ **AHORA** (Correcto)

```typescript
// Bueno: uso del config centralizado
import { config } from '@/config/environment';

const port = config.server.port;
const dbHost = config.database.host;
const jwtSecret = config.jwt.secret;
```

---

## 📝 Ejemplos de Uso

### 1. Inicializar Servidor

```typescript
import { config, validateConfig } from '@/config/environment';

class App {
  constructor() {
    validateConfig(); // Valida configuración al inicio
    this.port = config.server.port;
  }
}
```

### 2. Conectar a Base de Datos

```typescript
import { config } from '@/config/environment';

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
};
```

### 3. Rate Limiting

```typescript
import { config } from '@/config/environment';

const loginRateLimiter = new RateLimitMiddleware({
  windowMs: config.rateLimit.login.duration * 1000,
  maxRequests: config.rateLimit.login.points,
});
```

### 4. JWT

```typescript
import { config } from '@/config/environment';
import jwt from 'jsonwebtoken';

const token = jwt.sign(payload, config.jwt.secret, {
  expiresIn: config.jwt.expiresIn,
});
```

### 5. Redis

```typescript
import { config } from '@/config/environment';
import { createClient } from 'redis';

const client = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});
```

---

## 🔒 Validación de Configuración

El sistema valida automáticamente:

1. **Variables requeridas**: Lanza error si faltan
2. **Tipos numéricos**: Valida que sean números válidos
3. **Producción**: Valida JWT_SECRET no sea el default
4. **DATABASE_URL**: Requerido en producción

```typescript
import { validateConfig } from '@/config/environment';

// En App.ts constructor
validateConfig(); // ← Valida al inicio
```

**Salida si hay errores:**

```
❌ Configuration validation errors:
  - JWT_SECRET must be changed in production
  - DATABASE_URL is required in production
```

---

## 🎨 Mostrar Configuración

```typescript
import { logConfig } from '@/config/environment';

logConfig();
```

**Salida:**

```
📋 Configuration:
  Environment: development
  Port: 3000
  Database: localhost:3306/auth_service_db
  Redis: localhost:6379
  DynamoDB: http://localhost:4567
  JWT Expires: 1h
```

---

## 🧪 Testing

En tests, puedes mockear fácilmente:

```typescript
jest.mock('@/config/environment', () => ({
  config: {
    server: { port: 3001, isDevelopment: true },
    database: { host: 'localhost', port: 5432 },
    jwt: { secret: 'test-secret', expiresIn: '1h' },
    // ... más configuraciones de test
  },
}));
```

---

## 🔄 Migración de Código Existente

### Paso 1: Reemplazar imports

```typescript
// Antes
import dotenv from 'dotenv';
dotenv.config();

// Después
import { config } from '@/config/environment';
```

### Paso 2: Reemplazar process.env

```typescript
// Antes
const port = parseInt(process.env.PORT || '3000');
const dbHost = process.env.DB_HOST || 'localhost';

// Después
const port = config.server.port;
const dbHost = config.database.host;
```

---

## ⚙️ Agregar Nueva Configuración

### 1. Actualizar `.env`

```env
NEW_FEATURE_ENABLED=true
NEW_FEATURE_MAX_ITEMS=100
```

### 2. Actualizar `src/config/environment.ts`

```typescript
export const config = {
  // ... configuraciones existentes

  // Nueva feature
  newFeature: {
    enabled: getEnvVar('NEW_FEATURE_ENABLED', 'false') === 'true',
    maxItems: getEnvNumber('NEW_FEATURE_MAX_ITEMS', 100),
  },
} as const;
```

### 3. Usar en tu código

```typescript
import { config } from '@/config/environment';

if (config.newFeature.enabled) {
  const items = getItems(config.newFeature.maxItems);
}
```

---

## 🎯 Best Practices

1. ✅ **Siempre usar config**: No acceder a `process.env` directamente
2. ✅ **Valores por defecto**: Siempre proporcionar defaults sensatos
3. ✅ **Validar en producción**: Usar `validateConfig()` al inicio
4. ✅ **Tipos correctos**: Usar `getEnvNumber()` para números
5. ✅ **Documentar**: Agregar comentarios a nuevas configs
6. ✅ **No commitear secrets**: Usar `.env.example` como plantilla

---

## 📚 Archivos Relacionados

- `src/config/environment.ts` - Configuración centralizada
- `.env` - Variables de entorno (NO COMMITEAR)
- `.env.example` - Plantilla de variables (SÍ COMMITEAR)
- `CONFIGURATION_GUIDE.md` - Esta guía

---

## 🔐 Seguridad

**⚠️ IMPORTANTE:**

- ❌ **NUNCA** commitees `.env` al repositorio
- ✅ Usa `.env.example` como plantilla sin valores reales
- ✅ Cambia `JWT_SECRET` en producción
- ✅ Usa variables de entorno del host en producción
- ✅ Valida configuración con `validateConfig()`

---

## 🐳 Docker

En `docker-compose.yml` las variables se pasan automáticamente:

```yaml
services:
  app:
    environment:
      - PORT=${PORT}
      - DB_HOST=${DB_HOST}
      - REDIS_HOST=${REDIS_HOST}
    env_file:
      - .env
```

---

## 🌐 Variables por Entorno

### Development (.env.development)

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
REDIS_HOST=localhost
```

### Production (.env.production)

```env
NODE_ENV=production
PORT=8080
DB_HOST=production-db-host
REDIS_HOST=production-redis-host
JWT_SECRET=super-secure-production-secret
```

### Testing (.env.test)

```env
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_NAME=auth_service_test
```

---

## 💡 Tips

- Use TypeScript autocomplete: `config.` muestra todas las opciones
- Valores son `readonly`: No se pueden modificar accidentalmente
- Validación temprana: Errores se detectan al inicio, no en runtime
- Fácil de testear: Mock solo `@/config/environment`
