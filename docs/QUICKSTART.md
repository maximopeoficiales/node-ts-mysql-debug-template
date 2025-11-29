# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a poner en marcha el proyecto en 5 minutos.

## ✅ Prerrequisitos

- Node.js >= 18.x
- MySQL >= 8.0 (o Docker)
- npm o yarn

## 📦 Paso 1: Instalación

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
npm install
```

## 🗄️ Paso 2: Configurar MySQL

### Opción A: Usar Docker (Recomendado)

```bash
# Iniciar MySQL con Docker Compose
docker-compose up -d

# Verificar que está corriendo
docker ps
```

### Opción B: MySQL Local

Si tienes MySQL instalado localmente:

```bash
# Conectar a MySQL
mysql -u root -p

# Crear la base de datos
CREATE DATABASE auth_service_db;
```

## ⚙️ Paso 3: Configurar Variables de Entorno

El archivo `.env` ya está creado con valores por defecto. Ajusta si es necesario:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=auth_service_db
JWT_SECRET=my-super-secret-key-2024
```

## 🏃 Paso 4: Ejecutar el Proyecto

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

Verás algo como:

```
✅ Database connected successfully
✅ Database tables initialized
🚀 Server running on port 3000
📍 URL: http://localhost:3000
```

### Compilar y Ejecutar en Producción

```bash
npm run build
npm start
```

## 🧪 Paso 5: Probar la API

### Opción 1: Con curl

```bash
# Health check
curl http://localhost:3000/api/health

# Registrar usuario
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Obtener usuario
curl http://localhost:3000/api/users/1
```

### Opción 2: Abrir en el navegador

- http://localhost:3000 - Información de la API
- http://localhost:3000/api/health - Health check

### Opción 3: Usar Postman

Importa los ejemplos de `API_EXAMPLES.md`

## 🐛 Debugging en VS Code

1. **Abre VS Code** en el directorio del proyecto
2. **Presiona F5** o ve a "Run and Debug" (Ctrl+Shift+D)
3. **Selecciona** "Debug TypeScript"
4. **Coloca breakpoints** donde necesites
5. **Inicia el debug** y la aplicación se detendrá en tus breakpoints

### Atajos de Debug

- `F5` - Iniciar/Continuar
- `F10` - Step Over
- `F11` - Step Into
- `Shift+F11` - Step Out
- `Shift+F5` - Detener

## 📁 Estructura Rápida

```
src/
├── domain/          # Entidades y contratos
├── application/     # Casos de uso (lógica de negocio)
├── infrastructure/  # Implementaciones (DB, servidor)
└── interfaces/      # Controllers y rutas HTTP
```

## 🔍 Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar tests
npm test

# Linter
npm run lint

# Formatear código
npm run format
```

## ❓ Solución de Problemas

### "Database connection failed"

- Verifica que MySQL esté corriendo
- Revisa las credenciales en `.env`
- Si usas Docker: `docker-compose up -d`

### "Port 3000 already in use"

Cambia el puerto en `.env`:

```env
PORT=4000
```

### Error de TypeScript

```bash
npm run build
```

## 📚 Próximos Pasos

1. **Lee** `ARCHITECTURE.md` para entender la estructura
2. **Revisa** `API_EXAMPLES.md` para ver más ejemplos
3. **Consulta** `DATABASE_SETUP.md` para configuración avanzada
4. **Agrega** tus propios casos de uso

## 🎯 Endpoints Disponibles

| Método | Endpoint              | Descripción       |
| ------ | --------------------- | ----------------- |
| GET    | `/api/health`         | Health check      |
| POST   | `/api/users/register` | Registrar usuario |
| POST   | `/api/users/login`    | Login             |
| GET    | `/api/users/:id`      | Obtener usuario   |

## 🎉 ¡Listo!

Tu aplicación debería estar corriendo en http://localhost:3000

Para más información, consulta el `README.md` principal.
