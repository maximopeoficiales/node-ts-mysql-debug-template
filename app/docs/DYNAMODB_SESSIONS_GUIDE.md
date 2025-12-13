# Guía de Uso - Sistema de Sesiones con DynamoDB

## 🎯 Descripción

Sistema de autenticación con tokens JWT almacenados en **DynamoDB** para gestión de sesiones activas.

## 🏗️ Arquitectura

- **MySQL**: Usuarios (datos maestros)
- **DynamoDB (LocalStack)**: Sesiones activas (tokens JWT)
- **TTL automático**: Las sesiones expiran automáticamente

## 🚀 Inicio Rápido

### 1. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
# DynamoDB con LocalStack
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:4566
DYNAMODB_SESSIONS_TABLE=auth-sessions
```

### 2. Iniciar servicios con Docker

```bash
docker-compose up -d
```

Esto levantará:

- MySQL en puerto 3306
- **LocalStack en puerto 4566** (DynamoDB y otros servicios AWS)

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar el servidor

```bash
npm run dev
```

## 📋 Endpoints

### 1. Registrar Usuario (Público)

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123!"
  }'
```

**Respuesta:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "createdAt": "2025-11-28T10:00:00.000Z"
  }
}
```

### 2. Login (Público)

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "Password123!"
  }'
```

**Respuesta:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez"
  }
}
```

**Nota:** El token se guarda automáticamente en DynamoDB con:

- IP del cliente
- User-Agent
- TTL (expiración automática)

### 3. Obtener Usuario (Protegido)

```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**

```json
{
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "createdAt": "2025-11-28T10:00:00.000Z"
  }
}
```

### 4. Logout (Protegido)

```bash
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**

```json
{
  "message": "Logout successful"
}
```

**Nota:** El token se elimina de DynamoDB, invalidando la sesión.

### 5. Verificar sesión en DynamoDB

```bash
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4567 \
  --region us-east-1
```

**Respuesta esperada:**

```json
{
  "Items": [
    {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "userId": 1,
      "email": "test@example.com",
      "createdAt": "2025-11-29T05:00:00.000Z",
      "ipAddress": "::1",
      "userAgent": "curl/8.7.1",
      "TTL": 1732867200
    }
  ],
  "Count": 1,
  "ScannedCount": 1
}
```

### 6. Verificar que la sesión fue eliminada después del logout

```bash
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4567 \
  --region us-east-1
```

**Respuesta esperada:**

```json
{
  "Items": [],
  "Count": 0,
  "ScannedCount": 0
}
```

### 7. Intentar acceder con token invalidado

```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta esperada:**

```json
{
  "error": "Session expired or invalid"
}
```

## 🧪 Ejemplo de Flujo Completo

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}'

# 2. Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 3. Ver sesión en DynamoDB
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4567 \
  --region us-east-1

# 4. Acceder a ruta protegida
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"

# 5. Logout
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer $TOKEN"

# 6. Verificar que la sesión fue eliminada
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4567 \
  --region us-east-1

# 7. Intentar usar el token (debe fallar)
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Sistema de Autenticación

### Flujo de Login

1. Usuario envía credenciales
2. Sistema valida usuario en MySQL
3. Genera token JWT
4. **Guarda sesión en DynamoDB** con:
   ```json
   {
     "token": "eyJhbGciOi...",
     "userId": 1,
     "email": "juan@example.com",
     "createdAt": "2025-11-28T10:00:00Z",
     "ipAddress": "192.168.1.1",
     "userAgent": "Mozilla/5.0...",
     "TTL": 1732883600
   }
   ```
5. Devuelve token al cliente

### Flujo de Autenticación

1. Cliente envía token en header `Authorization: Bearer <token>`
2. Middleware verifica:
   - ✅ JWT válido y no expirado
   - ✅ Sesión existe en DynamoDB
3. Si todo OK, permite acceso
4. Si falla, retorna 401

### Flujo de Logout

1. Cliente envía token
2. Sistema elimina sesión de DynamoDB
3. Token queda invalidado (aunque JWT técnicamente sea válido)

## 🗄️ Estructura de DynamoDB

### Tabla: `auth-sessions`

| Campo       | Tipo        | Descripción                 |
| ----------- | ----------- | --------------------------- |
| `token`     | String (PK) | Token JWT único             |
| `userId`    | Number      | ID del usuario              |
| `email`     | String      | Email del usuario           |
| `createdAt` | String      | Timestamp ISO               |
| `ipAddress` | String      | IP del cliente              |
| `userAgent` | String      | Navegador/app               |
| `TTL`       | Number      | Unix timestamp (expiración) |

### TTL (Time To Live)

DynamoDB elimina automáticamente las sesiones expiradas:

- No requiere proceso manual
- Sin costo adicional
- Limpieza automática

## 🛠️ Comandos Útiles

### Ver logs de LocalStack

```bash
docker logs auth-service-localstack
```

### Verificar estado de LocalStack

```bash
curl http://localhost:4566/_localstack/health
```

### Listar tablas en DynamoDB

```bash
aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

### Ver items en la tabla

```bash
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

### Eliminar tabla (desarrollo)

```bash
aws dynamodb delete-table \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

## 🔧 Configuración para Producción (AWS Real)

### 1. Actualizar `.env`

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DYNAMODB_SESSIONS_TABLE=auth-sessions-prod
# Comentar o eliminar DYNAMODB_ENDPOINT
```

### 2. Crear tabla en AWS

```bash
aws dynamodb create-table \
  --table-name auth-sessions-prod \
  --attribute-definitions AttributeName=token,AttributeType=S \
  --key-schema AttributeName=token,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 3. Habilitar TTL

```bash
aws dynamodb update-time-to-live \
  --table-name auth-sessions-prod \
  --time-to-live-specification "Enabled=true, AttributeName=TTL" \
  --region us-east-1
```

## 📊 Ventajas de esta Arquitectura

### ✅ Seguridad

- ✅ Control total sobre sesiones activas
- ✅ Logout real (invalida tokens)
- ✅ Auditoría de accesos (IP, User-Agent)
- ✅ No hay tokens "zombies"

### ⚡ Rendimiento

- ⚡ Lecturas rápidas (~10ms)
- ⚡ Escalabilidad automática
- ⚡ Sin mantenimiento de índices

### 💰 Costos

- 💰 TTL automático sin costo
- 💰 Pay-per-request (solo pagas lo que usas)
- 💰 Sin servidor dedicado

### 🔄 Escalabilidad

- 🔄 Millones de sesiones sin problema
- 🔄 Auto-scaling incluido
- 🔄 Multi-región disponible

## 🐛 Troubleshooting

### Error: "Cannot connect to DynamoDB"

Verificar que LocalStack esté corriendo:

```bash
docker ps | grep localstack
```

Verificar estado:

```bash
curl http://localhost:4566/_localstack/health
```

### Error: "Table does not exist"

La tabla se crea automáticamente al primer login. Si hay problemas:

```bash
npm run dev
# Hacer login una vez
```

### Sesión no se invalida en logout

Verificar que `DYNAMODB_ENDPOINT` esté configurado:

```bash
echo $DYNAMODB_ENDPOINT
# Debe ser: http://localhost:4566
```

## 📚 Próximos Pasos

- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting
- [ ] Logs de auditoría completos
- [ ] Múltiples sesiones por usuario
- [ ] Revocar todas las sesiones de un usuario

## 🔗 Recursos

- [AWS DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
