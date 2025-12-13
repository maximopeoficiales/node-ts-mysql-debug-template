# ⚡ Quick Reference - Comandos Frecuentes

Referencia rápida de comandos más usados.

---

## 🚀 Inicio Rápido

```bash
# 1. Levantar infraestructura
docker-compose up -d

# 2. Ejecutar migraciones
npm run prisma:migrate

# 3. Iniciar aplicación
npm run dev
```

---

## 📨 Event Bus

```bash
# Ver todos los eventos
npm run events:view

# Filtrar por tipo
npm run events:filter user.registered
npm run events:filter user.login.success
npm run events:filter user.login.failed
npm run events:filter user.logout

# Probar manualmente
npm run test:eventbus

# Limpiar cola
aws --endpoint-url=http://localhost:4567 \
  sqs purge-queue \
  --queue-url http://localhost:4567/000000000000/auth-events-queue
```

---

## 🐳 Docker

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f localstack
docker-compose logs -f postgres

# Detener servicios
docker-compose down

# Reiniciar un servicio
docker-compose restart localstack
docker-compose restart postgres

# Ver estado de servicios
docker-compose ps

# Recrear servicios (útil después de cambios en docker-compose.yml)
docker-compose down
docker-compose up -d --force-recreate
```

---

## 💾 Prisma

```bash
# Ejecutar migraciones
npm run prisma:migrate

# Abrir Prisma Studio (GUI)
npm run prisma:studio

# Generar Prisma Client
npm run prisma:generate

# Reset completo (⚠️ BORRA TODO)
npm run prisma:reset

# Crear nueva migración
npx prisma migrate dev --name descripcion_del_cambio
```

---

## 🧪 Testing

```bash
# Todos los tests
npm test

# Tests en watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Tests específicos
npm run test:ratelimit
npm run test:eventbus
```

---

## 🔍 Debugging

```bash
# Ver logs de la aplicación
docker-compose logs -f

# Health check
curl http://localhost:3000/health

# Verificar LocalStack
curl http://localhost:4567/_localstack/health

# Ver eventos en cola
npm run events:view

# Ver servicios corriendo
docker ps
```

---

## 🌐 API Testing

```bash
# Usando api.http (VS Code REST Client extension)
# O usar curl:

# Register
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Get User (con token)
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer <your-token>"

# Logout
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer <your-token>"
```

---

## 🔧 LocalStack

```bash
# Health check
curl http://localhost:4567/_localstack/health

# Listar colas SQS
aws --endpoint-url=http://localhost:4567 sqs list-queues

# Ver mensajes en cola
aws --endpoint-url=http://localhost:4567 \
  sqs receive-message \
  --queue-url http://localhost:4567/000000000000/auth-events-queue

# Listar topics SNS
aws --endpoint-url=http://localhost:4567 sns list-topics

# Purgar cola
aws --endpoint-url=http://localhost:4567 \
  sqs purge-queue \
  --queue-url http://localhost:4567/000000000000/auth-events-queue

# Ver tabla DynamoDB
aws --endpoint-url=http://localhost:4567 \
  dynamodb scan \
  --table-name auth-sessions
```

---

## 📊 Base de Datos

```bash
# Acceder a PostgreSQL (desde host)
psql -h localhost -p 5432 -U authuser -d auth_service_db

# Dentro de psql
\dt              # Listar tablas
\d users         # Describir tabla users
SELECT * FROM users;
\q               # Salir

# Acceder a Redis
redis-cli -p 6379
> KEYS *
> GET key_name
> FLUSHALL     # ⚠️ Borra todo
> EXIT

# Adminer (Web UI)
http://localhost:8080
Sistema: PostgreSQL
Servidor: postgres
Usuario: authuser
Contraseña: authpass
Base de datos: auth_service_db
```

---

## 🛠️ Desarrollo

```bash
# Modo desarrollo
npm run dev

# Build
npm run build

# Producción (compilado)
npm start

# Linting
npm run lint

# Formatear código
npm run format
```

---

## 📦 Gestión de Paquetes

```bash
# Instalar dependencias
npm install

# Añadir paquete
npm install <package-name>

# Añadir dev dependency
npm install -D <package-name>

# Actualizar paquetes
npm update

# Verificar vulnerabilidades
npm audit
npm audit fix
```

---

## 🔄 Workflow Típico

### Desarrollo Diario
```bash
docker-compose up -d      # Levantar servicios
npm run dev               # Iniciar app
# ... desarrollar ...
docker-compose logs -f    # Ver logs si hay problemas
```

### Después de Cambios en Schema
```bash
# Editar prisma/schema.prisma
npm run prisma:migrate    # Crear y aplicar migración
npm run prisma:generate   # Regenerar client
```

### Después de Cambios en docker-compose.yml
```bash
docker-compose down
docker-compose up -d --force-recreate
```

### Testing de Eventos
```bash
# 1. Hacer request (api.http)
POST http://localhost:3000/api/users/register

# 2. Ver evento emitido
npm run events:view

# 3. Filtrar por tipo
npm run events:filter user.registered
```

---

## 🐛 Troubleshooting

```bash
# Servicios no levantan
docker-compose down
docker-compose up -d

# Puerto en uso
lsof -i :3000        # Ver qué usa el puerto
kill -9 <PID>        # Matar proceso

# Problemas con Prisma
npm run prisma:generate
npm run prisma:migrate

# Problemas con node_modules
rm -rf node_modules package-lock.json
npm install

# Ver logs de error
docker-compose logs localstack
docker-compose logs postgres
docker-compose logs redis

# Recrear todo desde cero (⚠️ BORRA TODO)
docker-compose down -v
docker-compose up -d
npm run prisma:migrate
```

---

## 📚 URLs Importantes

```
API:              http://localhost:3000
Health:           http://localhost:3000/health
Adminer:          http://localhost:8080
Prisma Studio:    http://localhost:5555 (npm run prisma:studio)
LocalStack:       http://localhost:4567
LocalStack Health: http://localhost:4567/_localstack/health
```

---

## 🎯 Variables de Entorno Clave

```bash
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://authuser:authpass@localhost:5432/auth_service_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Event Bus
EVENT_BUS_TYPE=sqs  # o 'sns', 'noop'
AWS_ENDPOINT=http://localhost:4567
SQS_QUEUE_URL=http://localhost:4567/000000000000/auth-events-queue
```

---

## 💡 Tips

- Usa `api.http` para testing manual (VS Code REST Client)
- Revisa `npm run events:view` después de cada request
- `docker-compose logs -f` es tu amigo
- Prisma Studio es genial para ver datos: `npm run prisma:studio`
- LocalStack tarda ~10s en estar listo, espera antes de hacer requests

---

**Última actualización**: Diciembre 2024  
**Versión**: 3.1.0
