# Guía de Optimización y Redis Cache

Esta guía documenta las optimizaciones implementadas para escalar la aplicación a gran escala con miles de usuarios.

## 📊 Arquitectura de Datos

El sistema utiliza una arquitectura de tres capas:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   MySQL     │     │    Redis    │     │  DynamoDB   │
│  (Master)   │────▶│   (Cache)   │     │  (Sessions) │
│             │     │             │     │             │
│ Usuarios    │     │ Cache 1h    │     │ Sesiones    │
│ Datos       │     │ Hit: 85-95% │     │ TTL: 24h    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Responsabilidades:

- **MySQL**: Base de datos principal para usuarios y datos maestros
- **Redis**: Caché en memoria para reducir carga en MySQL (85-95% hit rate esperado)
- **DynamoDB**: Almacenamiento de sesiones con TTL automático

## 🚀 Optimizaciones Implementadas

### 1. Redis Caching Layer

#### Patrón: Cache-Aside (Lazy Loading)

```typescript
// CachedUserRepository implementa el patrón Decorator
const userRepo = new MySQLUserRepository();
const cachedRepo = new CachedUserRepository(userRepo, 3600); // TTL: 1 hora

// Flujo de lectura:
// 1. Buscar en caché
// 2. Si no existe (cache miss), consultar MySQL
// 3. Guardar resultado en caché
// 4. Retornar resultado
```

#### Estrategia de Cache:

| Operación            | Clave Cache                       | TTL   | Estrategia              |
| -------------------- | --------------------------------- | ----- | ----------------------- |
| `findById(id)`       | `user:id:{id}`                    | 3600s | Cache-aside             |
| `findByEmail(email)` | `user:email:{email}`              | 3600s | Cache-aside             |
| `findAll()`          | `user:all`                        | 3600s | Cache-aside             |
| `findAllPaginated()` | `user:paginated:{limit}:{offset}` | 300s  | Cache-aside (TTL corto) |
| `create()`           | Múltiple                          | 3600s | Write-through           |
| `update()`           | Invalidación                      | -     | Cache invalidation      |
| `delete()`           | Invalidación                      | -     | Cache invalidation      |

#### Beneficios:

- **Reducción de carga**: 85-95% de requests se resuelven desde caché
- **Latencia**: Redis ~1ms vs MySQL ~10-50ms
- **Escalabilidad**: MySQL soporta más usuarios concurrentes

### 2. Rate Limiting

Protección contra abuso y ataques DDoS usando Redis como contador distribuido.

#### Limitadores Implementados:

```typescript
// Rate limiters disponibles en RateLimitFactory

// 1. General (strict): 100 req/15min
RateLimitFactory.strict();

// 2. Moderado: 300 req/15min
RateLimitFactory.moderate();

// 3. Login: 5 intentos/15min (solo cuenta fallos)
RateLimitFactory.login();

// 4. Registro: 3 registros/hora
RateLimitFactory.register();

// 5. Autenticado: 200 req/15min (por userId)
RateLimitFactory.authenticated();
```

#### Aplicación en Rutas:

```typescript
// En userRoutes.ts
router.post(
  '/register',
  RateLimitFactory.register().middleware(),
  validateRegister,
  userController.register
);

router.post('/login', RateLimitFactory.login().middleware(), validateLogin, userController.login);
```

#### Headers de Respuesta:

```http
X-RateLimit-Limit: 100          # Límite máximo
X-RateLimit-Remaining: 95       # Requests restantes
X-RateLimit-Reset: 1701234567   # Timestamp de reset
Retry-After: 900                # Segundos hasta poder reintentar
```

#### Respuesta cuando se excede el límite:

```json
{
  "error": "Demasiadas peticiones, intenta de nuevo más tarde.",
  "retryAfter": 900
}
```

### 3. Paginación

Evita cargar todos los usuarios en memoria. Implementa `LIMIT` y `OFFSET` en MySQL.

#### Interfaz:

```typescript
interface PaginationOptions {
  limit: number; // Cantidad de resultados
  offset: number; // Desde qué registro
}

interface PaginatedResult<T> {
  data: T[]; // Resultados de la página
  total: number; // Total de registros
  limit: number; // Límite usado
  offset: number; // Offset usado
  hasMore: boolean; // Si hay más páginas
}
```

#### Uso:

```typescript
const result = await userRepository.findAllPaginated({
  limit: 20,
  offset: 0,
});

console.log(result.data); // 20 usuarios
console.log(result.total); // Ej: 1500
console.log(result.hasMore); // true
```

### 4. Connection Pool Optimizado

```typescript
// DatabaseConnection.ts
{
  connectionLimit: 10,        // Máximo de conexiones simultáneas
  queueLimit: 0,              // Cola ilimitada (espera disponibilidad)
  waitForConnections: true,   // Esperar si no hay conexiones disponibles
  enableKeepAlive: true,      // Mantener conexiones vivas
  keepAliveInitialDelay: 0    // Sin delay en keep-alive
}
```

### 5. Performance Monitor

Middleware que registra métricas de rendimiento de cada request.

#### Logs Automáticos:

```
⚡ GET /api/users - 200 - 45ms      # Muy rápido (<100ms)
✓  POST /api/login - 200 - 234ms   # Normal (100-500ms)
⏱️  GET /api/users/all - 200 - 789ms # Lento (500-1000ms)
🐌 GET /api/slow - 200 - 1523ms    # Muy lento (>1000ms)
```

#### Alertas de Requests Lentos:

Cuando un request supera el threshold (1000ms por defecto):

```
⚠️  SLOW REQUEST DETECTED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Path:        GET /api/users/all
Duration:    1523ms (threshold: 1000ms)
Status:      200
Timestamp:   2024-11-29T10:30:45.123Z
IP:          192.168.1.100
User Agent:  Mozilla/5.0...
Resources:
  CPU User:   45.23ms
  CPU System: 12.34ms
  Memory Δ:   2.34MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Endpoint de Health Check:

```http
GET /health
```

Respuesta:

```json
{
  "status": "healthy",
  "uptime": "45m 23s",
  "memory": {
    "heapUsed": "45.23MB",
    "heapTotal": "89.12MB",
    "rss": "123.45MB"
  },
  "performance": {
    "totalRequests": 1543,
    "averageDuration": "234.56ms",
    "slowRequests": 12,
    "slowThreshold": "1000ms",
    "byStatus": {
      "200": 1450,
      "400": 50,
      "401": 30,
      "429": 13
    },
    "topPaths": [
      {
        "path": "GET /api/users",
        "count": 456,
        "avgDuration": "123.45ms"
      }
    ]
  }
}
```

## 🐳 Configuración Docker

### Servicios:

```yaml
services:
  mysql: # Puerto 3306
  redis: # Puerto 6379
  localstack: # Puerto 4567 (DynamoDB)
  adminer: # Puerto 8080
  app: # Puerto 3000
```

### Iniciar todos los servicios:

```bash
docker-compose up -d
```

### Verificar servicios:

```bash
docker-compose ps
```

## 🔧 Variables de Entorno

```env
# MySQL
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=auth_service_db
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=3600

# DynamoDB/LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
DYNAMODB_ENDPOINT=http://localstack:4566
DYNAMODB_TABLE_NAME=sessions

# App
PORT=3000
JWT_SECRET=your-super-secret-key-change-in-production
```

## 📈 Métricas Esperadas

### Antes de las Optimizaciones:

- **Latencia promedio**: 50-100ms (todas las queries a MySQL)
- **Requests/segundo**: ~200-300
- **Carga MySQL**: Alta (100% en todas las queries)

### Después de las Optimizaciones:

- **Latencia promedio**: 10-20ms (85-95% desde caché)
- **Requests/segundo**: ~1000-2000
- **Carga MySQL**: Baja (solo 5-15% de queries)
- **Cache Hit Rate**: 85-95%
- **Rate Limiting**: Protección contra abuso

## 🧪 Testing

Ver las guías específicas:

- [RATE_LIMIT_TESTING.md](./RATE_LIMIT_TESTING.md) - Pruebas de rate limiting
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Ejemplos de uso de la API
- [DYNAMODB_SESSIONS_GUIDE.md](./DYNAMODB_SESSIONS_GUIDE.md) - Guía de sesiones

## 🔍 Debugging

### Ver logs de Redis:

```bash
docker-compose logs -f redis
```

### Conectar a Redis CLI:

```bash
docker-compose exec redis redis-cli

# Comandos útiles:
> KEYS user:*              # Ver todas las claves de usuarios
> GET user:id:1            # Ver un usuario cacheado
> TTL user:id:1            # Ver tiempo restante
> FLUSHALL                 # Limpiar toda la caché (¡cuidado!)
> INFO stats               # Ver estadísticas
```

### Ver métricas de caché:

```bash
docker-compose exec redis redis-cli INFO stats
```

Buscar:

- `keyspace_hits`: Cantidad de cache hits
- `keyspace_misses`: Cantidad de cache misses
- **Hit Rate** = hits / (hits + misses)

## 🎯 Mejores Prácticas

### 1. Invalidación de Caché

Siempre invalida el caché cuando:

- Se actualiza un usuario
- Se elimina un usuario
- Se crea un nuevo usuario (invalida listados)

### 2. TTL Apropiados

- **Datos de usuario**: 1 hora (datos relativamente estáticos)
- **Listados paginados**: 5 minutos (cambian frecuentemente)
- **Sesiones**: 24 horas (en DynamoDB, no Redis)

### 3. Rate Limiting por Contexto

- **Login**: Estricto (5/15min) para prevenir brute-force
- **Registro**: Muy estricto (3/hora) para prevenir spam
- **API General**: Moderado (300/15min) para uso normal

### 4. Monitoreo Continuo

- Revisar `/health` regularmente
- Alertar en requests lentos (>1s)
- Monitorear cache hit rate (debe ser >85%)

## 🚨 Troubleshooting

### Redis no conecta:

```bash
# Verificar que Redis esté corriendo
docker-compose ps redis

# Ver logs
docker-compose logs redis

# Reiniciar
docker-compose restart redis
```

### Cache no funciona:

```typescript
// Verificar que estés usando CachedUserRepository
const cachedRepo = new CachedUserRepository(new MySQLUserRepository(), 3600);
```

### Rate limit no funciona:

- Verificar que Redis esté conectado
- Revisar que el middleware esté aplicado en las rutas
- Ver logs de Redis para confirmar incrementos

## 📚 Referencias

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Rate Limiting Strategies](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
