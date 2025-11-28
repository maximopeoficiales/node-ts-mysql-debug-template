# Auth Service Project - Clean Architecture

Proyecto Node.js con TypeScript, MySQL y Clean Architecture.

## 🏗️ Arquitectura

Este proyecto sigue los principios de Clean Architecture:

```
src/
├── domain/              # Entidades y lógica de negocio
├── application/         # Casos de uso
├── infrastructure/      # Implementaciones (DB, frameworks)
└── interfaces/          # Controllers y rutas
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18
- MySQL >= 8.0
- npm o yarn

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. Crear la base de datos:
```sql
CREATE DATABASE auth_service_db;
```

5. Ejecutar el script de inicialización:
```bash
npm run dev
```

## 🐛 Debug

Para debuggear en VS Code:
1. Presiona F5 o ve a Run > Start Debugging
2. Selecciona "Debug TypeScript"
3. Coloca breakpoints en el código

## 📝 Scripts

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada
- `npm test` - Ejecutar tests

## 📚 Estructura Clean Architecture

- **Domain**: Entidades del negocio (User, etc.)
- **Application**: Casos de uso (CreateUser, Login, etc.)
- **Infrastructure**: Implementación de repositorios, base de datos
- **Interfaces**: Controllers HTTP, rutas Express

## 🔒 Endpoints

- `POST /api/users/register` - Registrar usuario
- `POST /api/users/login` - Login
- `GET /api/users/:id` - Obtener usuario
