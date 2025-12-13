#!/bin/bash

# ========================================
# Script para Ver Eventos en SQS
# ========================================
# Este script consulta la cola SQS de LocalStack y muestra
# los eventos emitidos por la aplicación de forma legible
#
# Uso:
#   ./scripts/view-events.sh
#
# Requisitos:
#   - AWS CLI instalado
#   - LocalStack corriendo (docker-compose up)
#   - Cola SQS creada (./scripts/setup-localstack-events.sh)
# ========================================

echo "🔍 Consultando eventos en SQS..."
echo ""

# Configuración de AWS y SQS
LOCALSTACK_ENDPOINT="http://localhost:4567"
AWS_REGION="us-east-1"
QUEUE_URL="http://localhost:4567/000000000000/auth-events-queue"

# Consultar mensajes de la cola SQS
# --max-number-of-messages 10: Obtener hasta 10 mensajes
# --message-attribute-names All: Incluir todos los atributos del mensaje (eventType, timestamp, etc.)
# --output json: Devolver resultado en formato JSON
aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sqs receive-message \
    --queue-url $QUEUE_URL \
    --max-number-of-messages 10 \
    --message-attribute-names All \
    --output json | python3 -c "
import json
import sys
from datetime import datetime

# Leer el resultado JSON de AWS CLI desde stdin
data = json.load(sys.stdin)

# Verificar si hay mensajes en la cola
if 'Messages' in data and len(data['Messages']) > 0:
    print(f'📊 Total de eventos encontrados: {len(data[\"Messages\"])}')
    print('')
    
    # Iterar sobre cada mensaje en la cola
    for idx, msg in enumerate(data['Messages'], 1):
        # Parsear el cuerpo del mensaje (que es JSON stringificado)
        body = json.loads(msg['Body'])
        
        # Separador visual entre eventos
        print(f\"\n{'='*60}\")
        print(f\"Evento #{idx}\")
        print('='*60)
        
        # Tipo de evento (ej: user.registered, user.login.success)
        print(f\"📨 Tipo: {body['type']}\")
        
        # ID único del evento (para tracking)
        print(f\"🆔 Event ID: {body.get('eventId', 'N/A')}\")
        
        # Timestamp de cuándo se generó el evento
        timestamp = body['timestamp']
        print(f\"⏰ Timestamp: {timestamp}\")
        
        # Datos específicos del evento (userId, email, etc.)
        print(f\"\\n📦 Datos del Evento:\")
        print(json.dumps(body['data'], indent=2))
        
        # Metadata adicional (IP, user-agent, etc.) si existe
        if body.get('metadata'):
            print(f\"\\n🏷️  Metadata:\")
            print(json.dumps(body['metadata'], indent=2))
        
        # Atributos del mensaje SQS (si existen)
        if msg.get('MessageAttributes'):
            print(f\"\\n🔖 Atributos SQS:\")
            attrs = msg['MessageAttributes']
            for key, value in attrs.items():
                print(f\"  {key}: {value.get('StringValue', 'N/A')}\")
    
    print(f\"\n{'='*60}\")
    print(f\"✅ Se mostraron {len(data['Messages'])} evento(s)\")
    print('')
    print('💡 Nota: Los mensajes permanecen en la cola hasta que un worker los procese.')
    print('   Para eliminarlos, un consumer debe llamar a DeleteMessage.')
    
else:
    # No hay mensajes en la cola
    print('❌ No hay eventos en la cola')
    print('')
    print('💡 Sugerencias:')
    print('   1. Verifica que la aplicación esté corriendo (npm run dev)')
    print('   2. Verifica que EVENT_BUS_TYPE=sqs en tu .env')
    print('   3. Haz alguna acción (registrar usuario, login, etc.)')
    print('   4. Ejecuta este script nuevamente')
"

echo ""
echo "🔗 Comandos útiles:"
echo "  - Ver cantidad de mensajes: aws --endpoint-url=$LOCALSTACK_ENDPOINT sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names ApproximateNumberOfMessages"
echo "  - Purgar cola (eliminar todos): aws --endpoint-url=$LOCALSTACK_ENDPOINT sqs purge-queue --queue-url $QUEUE_URL"
echo ""
