# Guía de Uso - LocalStack con DynamoDB

## 🎯 ¿Qué es LocalStack?

**LocalStack** es un emulador completo de servicios AWS que corre localmente. A diferencia de DynamoDB Local (que solo simula DynamoDB), LocalStack puede simular:

- DynamoDB
- S3
- Lambda
- SQS
- SNS
- Y más de 80 servicios AWS

## 🆚 LocalStack vs DynamoDB Local

| Característica     | DynamoDB Local          | LocalStack                        |
| ------------------ | ----------------------- | --------------------------------- |
| **Servicios**      | Solo DynamoDB           | 80+ servicios AWS                 |
| **Tamaño**         | ~60MB                   | ~500MB                            |
| **Velocidad**      | Más rápido              | Un poco más lento                 |
| **Uso de memoria** | Bajo                    | Moderado                          |
| **Caso de uso**    | Solo necesitas DynamoDB | Necesitas múltiples servicios AWS |
| **Configuración**  | Más simple              | Más completa                      |

## 🚀 Configuración con LocalStack

### Opción 1: Usando docker-compose.localstack.yml

```bash
# Levantar servicios con LocalStack
docker-compose -f docker-compose.localstack.yml up -d

# Ver logs
docker-compose -f docker-compose.localstack.yml logs -f localstack

# Detener
docker-compose -f docker-compose.localstack.yml down
```

### Opción 2: Modificar docker-compose.yml principal

En tu `docker-compose.yml`, comenta `dynamodb-local` y descomenta la sección de `localstack`.

### Configurar variables de entorno

Edita tu `.env`:

```env
# Cambiar el endpoint de DynamoDB
DYNAMODB_ENDPOINT=http://localhost:4566

# El resto permanece igual
AWS_REGION=us-east-1
DYNAMODB_SESSIONS_TABLE=auth-sessions
```

## 📋 Comandos útiles con LocalStack

### 1. Verificar estado de LocalStack

```bash
# Verificar health
curl http://localhost:4566/_localstack/health

# Verificar servicios activos
curl http://localhost:4566/_localstack/health | jq '.services'
```

### 2. Usar AWS CLI con LocalStack

Todos los comandos de AWS CLI funcionan agregando `--endpoint-url`:

```bash
# Listar tablas
aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# Crear tabla manualmente (opcional, la app la crea automáticamente)
aws dynamodb create-table \
  --table-name auth-sessions \
  --attribute-definitions AttributeName=token,AttributeType=S \
  --key-schema AttributeName=token,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# Escanear items
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4566 \
  --region us-east-1

# Describir tabla
aws dynamodb describe-table \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

### 3. Ver datos persistidos

LocalStack guarda datos en `/tmp/localstack/data` (dentro del contenedor):

```bash
# Ejecutar shell en el contenedor
docker exec -it auth-service-localstack sh

# Ver archivos
ls -la /tmp/localstack/data
```

## 🔧 Configuración Avanzada

### Habilitar persistencia completa

En `docker-compose.localstack.yml`:

```yaml
environment:
  - PERSISTENCE=1 # Ya está habilitado
  - SNAPSHOT_SAVE_STRATEGY=ON_SHUTDOWN # Guardar al apagar
  - SNAPSHOT_LOAD_STRATEGY=ON_STARTUP # Cargar al iniciar
```

### Habilitar más servicios AWS

```yaml
environment:
  - SERVICES=dynamodb,s3,sqs,sns,lambda
```

### Usar LocalStack Pro (opcional, de pago)

```yaml
environment:
  - LOCALSTACK_API_KEY=tu-api-key
  - SERVICES=dynamodb,cognito,rds,etc # Más servicios disponibles
```

## 🧪 Probar la aplicación con LocalStack

### 1. Iniciar LocalStack

```bash
docker-compose -f docker-compose.localstack.yml up -d
```

### 2. Verificar que LocalStack esté listo

```bash
# Esperar a que esté healthy
docker ps

# Ver logs
docker logs auth-service-localstack
```

### 3. Configurar y ejecutar la app

```bash
# Asegúrate de que .env tenga:
# DYNAMODB_ENDPOINT=http://localhost:4566

npm run dev
```

### 4. Probar endpoints

```bash
# Login (crea sesión en DynamoDB de LocalStack)
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'

# Verificar en DynamoDB
aws dynamodb scan \
  --table-name auth-sessions \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

## 🐛 Troubleshooting

### Error: "Cannot connect to LocalStack"

```bash
# Verificar que LocalStack esté corriendo
docker ps | grep localstack

# Ver logs
docker logs auth-service-localstack

# Verificar puerto 4566
curl http://localhost:4566/_localstack/health
```

### Error: "Table not found"

LocalStack no persiste datos entre reinicios por defecto. Solución:

```bash
# Opción 1: La app crea la tabla automáticamente al primer uso

# Opción 2: Crear tabla manualmente
aws dynamodb create-table \
  --table-name auth-sessions \
  --attribute-definitions AttributeName=token,AttributeType=S \
  --key-schema AttributeName=token,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

### LocalStack muy lento

```bash
# Reducir servicios habilitados
SERVICES=dynamodb  # Solo el necesario

# Aumentar memoria en Docker Desktop
# Settings > Resources > Memory > 4GB o más
```

## 📊 Comparación de Endpoints

| Servicio       | Puerto | Endpoint              | Uso                     |
| -------------- | ------ | --------------------- | ----------------------- |
| DynamoDB Local | 8000   | http://localhost:8000 | Solo DynamoDB           |
| LocalStack     | 4566   | http://localhost:4566 | Todos los servicios AWS |

## 🎯 ¿Cuándo usar cada opción?

### Usa **DynamoDB Local** si:

- ✅ Solo necesitas DynamoDB
- ✅ Quieres algo ligero y rápido
- ✅ Recursos limitados
- ✅ Proyecto simple

### Usa **LocalStack** si:

- ✅ Necesitas múltiples servicios AWS (S3, SQS, etc.)
- ✅ Quieres simular un entorno AWS completo
- ✅ Planeas expandir a otros servicios
- ✅ Quieres practicar con AWS localmente

## 🔄 Migrar de DynamoDB Local a LocalStack

### Paso 1: Cambiar docker-compose

```bash
# Usar archivo de LocalStack
docker-compose -f docker-compose.localstack.yml up -d
```

### Paso 2: Actualizar .env

```env
# Antes
DYNAMODB_ENDPOINT=http://localhost:8000

# Después
DYNAMODB_ENDPOINT=http://localhost:4566
```

### Paso 3: Reiniciar la app

```bash
npm run dev
```

¡Listo! No necesitas cambiar código, solo la configuración.

## 📚 Recursos

- [LocalStack Docs](https://docs.localstack.cloud/)
- [LocalStack GitHub](https://github.com/localstack/localstack)
- [AWS CLI Docs](https://docs.aws.amazon.com/cli/)

## 💡 Tips

1. **Usa DynamoDB Local** para desarrollo diario (más rápido)
2. **Usa LocalStack** para testing de integración completo
3. **Usa AWS real** solo en staging/producción
4. Mantén ambos `docker-compose.yml` disponibles para flexibilidad
