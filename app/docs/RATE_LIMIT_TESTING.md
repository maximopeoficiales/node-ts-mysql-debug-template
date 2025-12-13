# Guía de Testing: Rate Limiting

Esta guía proporciona diferentes métodos para probar el rate limiting implementado en la aplicación.

## 🎯 Configuración de Rate Limiters

### Limitadores Actuales:

| Endpoint             | Límite           | Ventana    | Clave            |
| -------------------- | ---------------- | ---------- | ---------------- |
| `POST /api/register` | 3 requests       | 1 hora     | IP               |
| `POST /api/login`    | 5 requests       | 15 minutos | IP (solo fallos) |
| General              | 100-300 requests | 15 minutos | IP               |

## 🧪 Métodos de Prueba

### Método 1: cURL en Terminal (Manual)

#### Test 1: Rate Limit en Registro

```bash
# Intentar registrar 4 usuarios seguidos (el límite es 3/hora)
for i in {1..4}; do
  echo "Intento $i:"
  curl -X POST http://localhost:3000/api/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test$i@example.com\",
      \"password\": \"Password123!\",
      \"name\": \"Test User $i\"
    }" \
    -w "\nStatus: %{http_code}\n\n" \
    -s
  sleep 1
done
```

**Resultado esperado:**

- Intentos 1-3: Status 201 (éxito)
- Intento 4: Status 429 (rate limit excedido)

#### Test 2: Rate Limit en Login (Fallos)

```bash
# Intentar login fallido 6 veces (el límite es 5/15min)
for i in {1..6}; do
  echo "Intento de login fallido $i:"
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "wrong@example.com",
      "password": "wrongpassword"
    }' \
    -w "\nStatus: %{http_code}\n\n" \
    -i
  sleep 1
done
```

**Resultado esperado:**

- Intentos 1-5: Status 401 (credenciales inválidas)
- Intento 6: Status 429 (rate limit excedido)

### Método 2: Script Bash Automatizado

Crea un archivo `test-rate-limit.sh`:

```bash
#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
TEST_EMAIL="ratelimit-test@example.com"

echo "========================================="
echo "  RATE LIMIT TESTING"
echo "========================================="

# Test 1: Registro (límite 3/hora)
echo -e "\n${YELLOW}Test 1: Rate Limit en Registro (3/hora)${NC}"
echo "-----------------------------------------"

for i in {1..4}; do
  echo -n "Intento $i: "

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test-$RANDOM@example.com\",
      \"password\": \"Password123!\",
      \"name\": \"Test User $i\"
    }")

  STATUS=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)

  if [ "$STATUS" -eq 201 ]; then
    echo -e "${GREEN}✓ Éxito (201)${NC}"
  elif [ "$STATUS" -eq 429 ]; then
    echo -e "${RED}✗ Rate Limited (429)${NC}"
    echo "   Respuesta: $BODY"
  else
    echo -e "${YELLOW}? Otro status ($STATUS)${NC}"
  fi

  sleep 1
done

# Test 2: Login fallido (límite 5/15min)
echo -e "\n${YELLOW}Test 2: Rate Limit en Login Fallido (5/15min)${NC}"
echo "-----------------------------------------"

for i in {1..6}; do
  echo -n "Intento $i: "

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "wrong@example.com",
      "password": "wrongpassword"
    }')

  STATUS=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)

  if [ "$STATUS" -eq 401 ]; then
    echo -e "${YELLOW}○ Credenciales inválidas (401)${NC}"
  elif [ "$STATUS" -eq 429 ]; then
    echo -e "${RED}✗ Rate Limited (429)${NC}"
    echo "   Respuesta: $BODY"
  else
    echo -e "${YELLOW}? Otro status ($STATUS)${NC}"
  fi

  sleep 1
done

echo -e "\n${GREEN}=========================================${NC}"
echo "  Tests completados"
echo "========================================="
```

**Uso:**

```bash
chmod +x test-rate-limit.sh
./test-rate-limit.sh
```

### Método 3: Node.js Script

Crea un archivo `test-rate-limit.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRegisterRateLimit() {
  console.log('\n📝 Test 1: Rate Limit en Registro (3/hora)');
  console.log('─'.repeat(50));

  for (let i = 1; i <= 4; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        email: `test-${Date.now()}-${i}@example.com`,
        password: 'Password123!',
        name: `Test User ${i}`,
      });

      console.log(`${colors.green}✓ Intento ${i}: Éxito (${response.status})${colors.reset}`);
      console.log(
        `  Headers: Limit=${response.headers['x-ratelimit-limit']}, Remaining=${response.headers['x-ratelimit-remaining']}`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`${colors.red}✗ Intento ${i}: Rate Limited (429)${colors.reset}`);
        console.log(`  Error: ${error.response.data.error}`);
        console.log(`  Retry After: ${error.response.data.retryAfter}s`);
      } else {
        console.log(
          `${colors.yellow}? Intento ${i}: Error (${error.response?.status || 'unknown'})${colors.reset}`
        );
      }
    }

    await sleep(1000);
  }
}

async function testLoginRateLimit() {
  console.log('\n🔐 Test 2: Rate Limit en Login Fallido (5/15min)');
  console.log('─'.repeat(50));

  for (let i = 1; i <= 6; i++) {
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      console.log(`${colors.yellow}? Intento ${i}: Login exitoso (inesperado)${colors.reset}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`${colors.yellow}○ Intento ${i}: Credenciales inválidas (401)${colors.reset}`);
        console.log(
          `  Headers: Limit=${error.response.headers['x-ratelimit-limit']}, Remaining=${error.response.headers['x-ratelimit-remaining']}`
        );
      } else if (error.response?.status === 429) {
        console.log(`${colors.red}✗ Intento ${i}: Rate Limited (429)${colors.reset}`);
        console.log(`  Error: ${error.response.data.error}`);
        console.log(`  Retry After: ${error.response.data.retryAfter}s`);
      } else {
        console.log(
          `${colors.yellow}? Intento ${i}: Error (${error.response?.status || 'unknown'})${colors.reset}`
        );
      }
    }

    await sleep(1000);
  }
}

async function testHeadersProgression() {
  console.log('\n📊 Test 3: Progresión de Headers');
  console.log('─'.repeat(50));

  for (let i = 1; i <= 5; i++) {
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'test@example.com',
        password: 'wrongpass',
      });
    } catch (error) {
      if (error.response?.status === 401) {
        const headers = error.response.headers;
        console.log(`Request ${i}:`);
        console.log(`  X-RateLimit-Limit: ${headers['x-ratelimit-limit']}`);
        console.log(`  X-RateLimit-Remaining: ${headers['x-ratelimit-remaining']}`);

        const remaining = parseInt(headers['x-ratelimit-remaining']);
        if (remaining <= 1) {
          console.log(`  ${colors.yellow}⚠️  ¡Cerca del límite!${colors.reset}`);
        }
      }
    }

    await sleep(500);
  }
}

async function runAllTests() {
  console.log('═'.repeat(50));
  console.log('  🧪 RATE LIMIT TEST SUITE');
  console.log('═'.repeat(50));

  await testRegisterRateLimit();
  await sleep(2000);

  await testLoginRateLimit();
  await sleep(2000);

  await testHeadersProgression();

  console.log('\n' + '═'.repeat(50));
  console.log('  ✅ Tests completados');
  console.log('═'.repeat(50));
}

// Ejecutar
runAllTests().catch(console.error);
```

**Instalación y uso:**

```bash
npm install axios
node test-rate-limit.js
```

### Método 4: Python Script

Crea un archivo `test_rate_limit.py`:

```python
#!/usr/bin/env python3
import requests
import time
import json

BASE_URL = "http://localhost:3000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'

def test_register_rate_limit():
    print("\n📝 Test 1: Rate Limit en Registro (3/hora)")
    print("─" * 50)

    for i in range(1, 5):
        try:
            response = requests.post(
                f"{BASE_URL}/register",
                json={
                    "email": f"test-{int(time.time())}-{i}@example.com",
                    "password": "Password123!",
                    "name": f"Test User {i}"
                },
                timeout=5
            )

            if response.status_code == 201:
                print(f"{Colors.GREEN}✓ Intento {i}: Éxito (201){Colors.RESET}")
                print(f"  Remaining: {response.headers.get('X-RateLimit-Remaining')}")
            else:
                print(f"{Colors.YELLOW}? Intento {i}: Status {response.status_code}{Colors.RESET}")

        except requests.exceptions.RequestException as e:
            if hasattr(e.response, 'status_code') and e.response.status_code == 429:
                print(f"{Colors.RED}✗ Intento {i}: Rate Limited (429){Colors.RESET}")
                data = e.response.json()
                print(f"  Error: {data.get('error')}")
                print(f"  Retry After: {data.get('retryAfter')}s")
            else:
                print(f"{Colors.RED}✗ Intento {i}: Error - {e}{Colors.RESET}")

        time.sleep(1)

def test_login_rate_limit():
    print("\n🔐 Test 2: Rate Limit en Login Fallido (5/15min)")
    print("─" * 50)

    for i in range(1, 7):
        try:
            response = requests.post(
                f"{BASE_URL}/login",
                json={
                    "email": "wrong@example.com",
                    "password": "wrongpassword"
                },
                timeout=5
            )

            print(f"{Colors.YELLOW}? Intento {i}: Login exitoso (inesperado){Colors.RESET}")

        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                if e.response.status_code == 401:
                    print(f"{Colors.YELLOW}○ Intento {i}: Credenciales inválidas (401){Colors.RESET}")
                    print(f"  Remaining: {e.response.headers.get('X-RateLimit-Remaining')}")
                elif e.response.status_code == 429:
                    print(f"{Colors.RED}✗ Intento {i}: Rate Limited (429){Colors.RESET}")
                    data = e.response.json()
                    print(f"  Error: {data.get('error')}")
                    print(f"  Retry After: {data.get('retryAfter')}s")
            else:
                print(f"{Colors.RED}✗ Intento {i}: Error de conexión{Colors.RESET}")

        time.sleep(1)

def test_concurrent_requests():
    print("\n⚡ Test 3: Múltiples Requests Simultáneas")
    print("─" * 50)

    import concurrent.futures

    def make_request(i):
        try:
            response = requests.post(
                f"{BASE_URL}/login",
                json={"email": "test@test.com", "password": "wrong"},
                timeout=5
            )
            return (i, response.status_code, "Success")
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                return (i, e.response.status_code, "Error")
            return (i, 0, "Connection Error")

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, i) for i in range(10)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    results.sort(key=lambda x: x[0])

    for i, status, msg in results:
        if status == 429:
            print(f"{Colors.RED}Request {i+1}: Rate Limited (429){Colors.RESET}")
        elif status == 401:
            print(f"{Colors.YELLOW}Request {i+1}: Auth Failed (401){Colors.RESET}")
        else:
            print(f"Request {i+1}: Status {status}")

def main():
    print("═" * 50)
    print("  🧪 RATE LIMIT TEST SUITE")
    print("═" * 50)

    test_register_rate_limit()
    time.sleep(2)

    test_login_rate_limit()
    time.sleep(2)

    test_concurrent_requests()

    print("\n" + "═" * 50)
    print("  ✅ Tests completados")
    print("═" * 50)

if __name__ == "__main__":
    main()
```

**Uso:**

```bash
chmod +x test_rate_limit.py
python3 test_rate_limit.py
```

### Método 5: REST Client (VS Code Extension)

Crea un archivo `rate-limit-tests.http`:

```http
### Variables
@baseUrl = http://localhost:3000/api
@email = test@example.com

### Test 1: Registro - Intento 1
POST {{baseUrl}}/register
Content-Type: application/json

{
  "email": "ratelimit1@test.com",
  "password": "Password123!",
  "name": "Rate Limit Test 1"
}

### Test 1: Registro - Intento 2
POST {{baseUrl}}/register
Content-Type: application/json

{
  "email": "ratelimit2@test.com",
  "password": "Password123!",
  "name": "Rate Limit Test 2"
}

### Test 1: Registro - Intento 3
POST {{baseUrl}}/register
Content-Type: application/json

{
  "email": "ratelimit3@test.com",
  "password": "Password123!",
  "name": "Rate Limit Test 3"
}

### Test 1: Registro - Intento 4 (DEBE FALLAR con 429)
POST {{baseUrl}}/register
Content-Type: application/json

{
  "email": "ratelimit4@test.com",
  "password": "Password123!",
  "name": "Rate Limit Test 4"
}

###
### Test 2: Login Fallido - Intentos 1-5 (deben pasar)
###

### Intento 1
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}

### Intento 2
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}

### Intento 3
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}

### Intento 4
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}

### Intento 5
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}

### Intento 6 (DEBE FALLAR con 429)
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

**Uso:** Ejecuta cada request manualmente en VS Code con la extensión REST Client.

## 🔍 Verificación en Redis

### Ver contadores de rate limit en Redis:

```bash
# Conectar a Redis
docker-compose exec redis redis-cli

# Ver todas las claves de rate limit
KEYS ratelimit:*

# Ver el valor de un contador específico
GET ratelimit:login:127.0.0.1

# Ver el TTL (tiempo restante)
TTL ratelimit:login:127.0.0.1

# Limpiar un contador específico (para resetear pruebas)
DEL ratelimit:login:127.0.0.1

# Limpiar todos los rate limits
KEYS ratelimit:* | xargs redis-cli DEL
```

## 📊 Interpretación de Resultados

### Headers en la Respuesta:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1701234567
```

- `X-RateLimit-Limit`: Límite máximo permitido
- `X-RateLimit-Remaining`: Requests restantes en esta ventana
- `X-RateLimit-Reset`: Timestamp UNIX cuando se resetea el contador

### Respuesta 429 (Rate Limit Excedido):

```json
{
  "error": "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
  "retryAfter": 895
}
```

- `retryAfter`: Segundos hasta que puedas volver a intentar

## 🎓 Mejores Prácticas

1. **Limpiar contadores entre tests**: Usa `DEL` en Redis para resetear
2. **Esperar entre requests**: Agrega `sleep` para simular uso real
3. **Verificar headers**: Revisa `X-RateLimit-*` en cada respuesta
4. **Test con diferentes IPs**: Usa proxies o headers `X-Forwarded-For`
5. **Monitorear Redis**: Revisa las claves creadas y sus TTL

## 🐛 Troubleshooting

### Rate limit no se activa:

1. Verifica que Redis esté corriendo:

   ```bash
   docker-compose ps redis
   ```

2. Verifica que el middleware esté aplicado:

   ```bash
   grep -r "RateLimitFactory" src/interfaces/routes/
   ```

3. Revisa logs de Redis:
   ```bash
   docker-compose logs redis
   ```

### Contador no se resetea:

```bash
# Ver TTL de la clave
redis-cli TTL ratelimit:login:127.0.0.1

# Si es -1, no tiene expiración (error)
# Eliminar manualmente:
redis-cli DEL ratelimit:login:127.0.0.1
```

## 📚 Recursos Adicionales

- [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) - Documentación completa de optimizaciones
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Ejemplos de uso de la API
- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiter/)
