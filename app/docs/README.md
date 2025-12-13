# 📚 Documentación - Auth Service Project

Bienvenido a la documentación completa del proyecto Auth Service. Esta carpeta contiene **20 archivos** con todas las guías y referencias necesarias para trabajar con el proyecto.

## 📑 Índice de Documentación

### 🚀 Inicio Rápido

- **[QUICKSTART.md](QUICKSTART.md)** - Guía rápida para poner en marcha el proyecto
- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Sistema de configuración centralizada

### 📨 Sistema de Eventos (Nuevo)

- **[EVENT_BUS_GUIDE.md](EVENT_BUS_GUIDE.md)** - Guía completa del sistema de eventos
- **[EVENT_BUS_IMPLEMENTATION.md](EVENT_BUS_IMPLEMENTATION.md)** - Resumen de implementación
- **[LOCALSTACK_EVENT_BUS_GUIDE.md](LOCALSTACK_EVENT_BUS_GUIDE.md)** - LocalStack con SQS/SNS
- **[STATUS.md](STATUS.md)** - Estado actual del proyecto
- **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - Resumen ejecutivo
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Referencia rápida

### 🏗️ Arquitectura

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura Clean detallada y patrones de diseño
- **[POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md)** - Guía de migración MySQL → PostgreSQL

### ⚡ Optimización y Performance

- **[OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md)** - Redis cache, Rate Limiting y optimizaciones
- **[RATE_LIMIT_TESTING.md](RATE_LIMIT_TESTING.md)** - Testing y configuración de rate limiting

### 🗄️ Base de Datos

- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Configuración de base de datos
- **[DYNAMODB_SESSIONS_GUIDE.md](DYNAMODB_SESSIONS_GUIDE.md)** - Gestión de sesiones con DynamoDB

### 🔧 Desarrollo

- **[DEBUG_GUIDE.md](DEBUG_GUIDE.md)** - Debugging en VS Code
- **[VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)** - Validación de datos con class-validator
- **[LOCALSTACK_GUIDE.md](LOCALSTACK_GUIDE.md)** - Configuración de LocalStack para DynamoDB

### 📡 API

- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Ejemplos de uso del API REST

### 🛠️ Configuración Implementada

- **[CONFIG_IMPLEMENTATION_SUMMARY.md](CONFIG_IMPLEMENTATION_SUMMARY.md)** - Resumen de la implementación del sistema de configuración

## 🎯 Rutas Rápidas por Tarea

### Quiero empezar a desarrollar

1. [QUICKSTART.md](QUICKSTART.md) - Primeros pasos
2. [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) - Configurar variables de entorno
3. [API_EXAMPLES.md](API_EXAMPLES.md) - Ver ejemplos de API
4. [EVENT_BUS_GUIDE.md](EVENT_BUS_GUIDE.md) - Sistema de eventos asíncronos

### Quiero trabajar con eventos

1. [EVENT_BUS_GUIDE.md](EVENT_BUS_GUIDE.md) - Guía completa
2. [LOCALSTACK_EVENT_BUS_GUIDE.md](LOCALSTACK_EVENT_BUS_GUIDE.md) - Configurar LocalStack
3. [EVENT_BUS_IMPLEMENTATION.md](EVENT_BUS_IMPLEMENTATION.md) - Implementación técnica
4. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Comandos rápidos

### Quiero entender la arquitectura

1. [ARCHITECTURE.md](ARCHITECTURE.md) - Visión general
2. [OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md) - Patrones de optimización
3. [DATABASE_SETUP.md](DATABASE_SETUP.md) - Estructura de datos

### Quiero hacer debugging

1. [DEBUG_GUIDE.md](DEBUG_GUIDE.md) - Configurar VS Code
2. [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) - Validar errores comunes

### Quiero optimizar performance

1. [OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md) - Estrategias de caché
2. [RATE_LIMIT_TESTING.md](RATE_LIMIT_TESTING.md) - Protección anti-spam

### Migré desde MySQL

1. [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) - Detalles de la migración
2. [DATABASE_SETUP.md](DATABASE_SETUP.md) - Nueva configuración

## 📦 Stack Tecnológico Documentado

- **Backend**: Node.js 18 + TypeScript 5 + Express.js
- **Database**: PostgreSQL 16 Alpine + Prisma 7
- **Cache**: Redis 7
- **Sessions**: DynamoDB (LocalStack)
- **Event Bus**: AWS SQS/SNS (LocalStack)
- **Architecture**: Clean Architecture + SOLID
- **Patterns**: Repository, Decorator, Factory, Singleton, Dependency Inversion

## 🤝 Contribuir a la Documentación

Si encuentras algo que mejorar en la documentación:

1. Edita el archivo correspondiente
2. Mantén el formato Markdown consistente
3. Actualiza este índice si añades nuevos documentos
4. Verifica los enlaces relativos

## 📞 Soporte

Si tienes dudas que no están cubiertas en la documentación:

1. Revisa el [README.md](../README.md) principal
2. Consulta los ejemplos en [API_EXAMPLES.md](API_EXAMPLES.md)
3. Revisa la arquitectura en [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Última actualización**: Diciembre 2024  
**Versión del proyecto**: 3.1.1 (Documentación reorganizada)  
**Total de documentos**: 20 archivos en docs/
