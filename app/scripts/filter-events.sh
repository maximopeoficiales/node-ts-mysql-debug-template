#!/bin/bash

# ========================================
# Script para Filtrar Eventos por Tipo
# ========================================
# Este script filtra eventos de SQS según su tipo
# (user.registered, user.login.success, etc.)
#
# Uso:
#   ./scripts/filter-events.sh user.registered
#   ./scripts/filter-events.sh user.login.success
#   ./scripts/filter-events.sh user.logout
# ========================================

# Verificar que se pasó un argumento
if [ -z "$1" ]; then
    echo "❌ Error: Debes especificar el tipo de evento a filtrar"
    echo ""
    echo "Uso: $0 <tipo-de-evento>"
    echo ""
    echo "Tipos de eventos disponibles:"
    echo "  - user.registered          (Usuario se registra)"
    echo "  - user.login.success       (Login exitoso)"
    echo "  - user.login.failed        (Login fallido)"
    echo "  - user.logout              (Usuario cierra sesión)"
    echo ""
    echo "Ejemplo:"
    echo "  $0 user.registered"
    exit 1
fi

# Tipo de evento a filtrar (del primer argumento)
EVENT_TYPE="$1"

echo "🔍 Filtrando eventos de tipo: $EVENT_TYPE"
echo ""

# Configuración de AWS y SQS
LOCALSTACK_ENDPOINT="http://localhost:4567"
AWS_REGION="us-east-1"
QUEUE_URL="http://localhost:4567/000000000000/auth-events-queue"

# Consultar mensajes y filtrar por tipo en Python
aws --endpoint-url=$LOCALSTACK_ENDPOINT \
    --region=$AWS_REGION \
    sqs receive-message \
    --queue-url $QUEUE_URL \
    --max-number-of-messages 10 \
    --message-attribute-names All \
    --output json | python3 -c "
import json
import sys

# Leer el tipo de evento del argumento
event_type_filter = '$EVENT_TYPE'

# Leer el resultado JSON de AWS CLI
data = json.load(sys.stdin)

# Contador de eventos que coinciden con el filtro
filtered_count = 0

if 'Messages' in data and len(data['Messages']) > 0:
    # Iterar sobre cada mensaje
    for msg in data['Messages']:
        body = json.loads(msg['Body'])
        
        # Verificar si el tipo de evento coincide con el filtro
        if body['type'] == event_type_filter:
            filtered_count += 1
            
            # Mostrar el evento
            print(f\"\n{'='*60}\")
            print(f\"📨 Evento: {body['type']}\")
            print(f\"🆔 Event ID: {body.get('eventId', 'N/A')}\")
            print(f\"⏰ Timestamp: {body['timestamp']}\")
            print(f\"\\n📦 Datos:\")
            print(json.dumps(body['data'], indent=2))
            
            if body.get('metadata'):
                print(f\"\\n🏷️  Metadata:\")
                print(json.dumps(body['metadata'], indent=2))
    
    # Resumen
    print(f\"\n{'='*60}\")
    if filtered_count > 0:
        print(f\"✅ Se encontraron {filtered_count} evento(s) de tipo '{event_type_filter}'\")
    else:
        print(f\"❌ No se encontraron eventos de tipo '{event_type_filter}'")
        print(f\"\\n💡 Total de eventos en la cola: {len(data['Messages'])}\")
        print('   Usa ./scripts/view-events.sh para ver todos los eventos')
else:
    print('❌ No hay eventos en la cola')
    print('')
    print('💡 Ejecuta algunas acciones en la app para generar eventos')
"

echo ""
