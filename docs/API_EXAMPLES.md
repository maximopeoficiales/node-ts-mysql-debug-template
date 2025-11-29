# Ejemplos de Uso de la API

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. Health Check

Verificar que el servicio está funcionando.

**Endpoint:** `GET /api/health`

**Ejemplo con curl:**

```bash
curl http://localhost:3000/api/health
```

**Respuesta:**

```json
{
  "status": "OK",
  "message": "Service is running"
}
```

---

### 2. Registrar Usuario

Crear una nueva cuenta de usuario.

**Endpoint:** `POST /api/users/register`

**Body:**

```json
{
  "email": "usuario@example.com",
  "password": "miPassword123",
  "name": "Juan Pérez"
}
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "miPassword123",
    "name": "Juan Pérez"
  }'
```

**Respuesta exitosa (201):**

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**

- `400`: Faltan campos requeridos
- `409`: El email ya existe

---

### 3. Login

Iniciar sesión y obtener token JWT.

**Endpoint:** `POST /api/users/login`

**Body:**

```json
{
  "email": "usuario@example.com",
  "password": "miPassword123"
}
```

**Ejemplo con curl:**

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "miPassword123"
  }'
```

**Respuesta exitosa (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez"
  }
}
```

**Errores posibles:**

- `400`: Faltan campos requeridos
- `401`: Credenciales inválidas

---

### 4. Obtener Usuario

Obtener información de un usuario por ID.

**Endpoint:** `GET /api/users/:id`

**Ejemplo con curl:**

```bash
curl http://localhost:3000/api/users/1
```

**Respuesta exitosa (200):**

```json
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores posibles:**

- `400`: ID inválido
- `404`: Usuario no encontrado

---

## Testing con Postman

### Colección de Postman

Puedes importar los siguientes requests en Postman:

1. **Register User**
   - Method: POST
   - URL: `http://localhost:3000/api/users/register`
   - Body: raw JSON

   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "name": "Test User"
   }
   ```

2. **Login**
   - Method: POST
   - URL: `http://localhost:3000/api/users/login`
   - Body: raw JSON

   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Get User**
   - Method: GET
   - URL: `http://localhost:3000/api/users/1`

---

## Flujo de Trabajo Típico

1. **Registrar un nuevo usuario:**

   ```bash
   curl -X POST http://localhost:3000/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"email":"maria@example.com","password":"secure123","name":"María García"}'
   ```

2. **Iniciar sesión:**

   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"maria@example.com","password":"secure123"}'
   ```

3. **Usar el token recibido** para futuras peticiones autenticadas (próxima implementación).

---

## Variables de Entorno

Asegúrate de configurar correctamente el archivo `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tupassword
DB_NAME=auth_service_db

JWT_SECRET=tu-secreto-super-seguro
JWT_EXPIRES_IN=1h
```

---

## Notas de Seguridad

- Las contraseñas se hashean con bcrypt antes de almacenarse
- Los tokens JWT expiran según la configuración (por defecto 1 hora)
- Nunca se devuelve la contraseña en las respuestas de la API
- Cambia el `JWT_SECRET` en producción
