import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Colores para output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Tipos
interface TestResult {
  success: number;
  rateLimited: number;
  unauthorized?: number;
  errors: number;
}

interface HealthResponse {
  status: string;
  uptime: string;
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  performance: {
    totalRequests: number;
    averageDuration: string;
    slowRequests: number;
    slowThreshold: string;
    byStatus?: Record<string, number>;
    topPaths?: Array<{
      path: string;
      count: number;
      avgDuration: string;
    }>;
  };
}

// Utilidades
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const log = (message: string, color: keyof typeof COLORS = 'reset'): void => {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
};

const logHeader = (title: string): void => {
  console.log('\n' + '═'.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('═'.repeat(60));
};

const logSection = (title: string): void => {
  console.log('\n' + '─'.repeat(60));
  log(title, 'cyan');
  console.log('─'.repeat(60));
};

const logSuccess = (message: string): void => log(`✓ ${message}`, 'green');
const logError = (message: string): void => log(`✗ ${message}`, 'red');
const logWarning = (message: string): void => log(`⚠ ${message}`, 'yellow');
const logInfo = (message: string): void => log(`ℹ ${message}`, 'blue');

/**
 * Test 1: Rate Limit en Registro (3/hora)
 */
async function testRegisterRateLimit(): Promise<TestResult> {
  logSection('Test 1: Rate Limit en Registro (3 requests/hora)');

  const results: TestResult = {
    success: 0,
    rateLimited: 0,
    errors: 0,
  };

  for (let i = 1; i <= 5; i++) {
    const startTime = Date.now();
    try {
      const response = await axios.post(`${BASE_URL}/api/users/register`, {
        email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
        password: 'Password123!',
        name: `Rate Limit Test ${i}`,
      });

      const duration = Date.now() - startTime;
      results.success++;

      logSuccess(`Intento ${i}: ${response.status} Created (${duration}ms)`);
      logInfo(`  X-RateLimit-Limit: ${response.headers['x-ratelimit-limit']}`);
      logInfo(`  X-RateLimit-Remaining: ${response.headers['x-ratelimit-remaining']}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError<{ error: string; retryAfter?: number }>;

      if (axiosError.response?.status === 429) {
        results.rateLimited++;
        logError(`Intento ${i}: 429 Too Many Requests (${duration}ms)`);
        logWarning(`  Error: ${axiosError.response.data.error}`);
        if (axiosError.response.data.retryAfter) {
          logWarning(`  Retry After: ${axiosError.response.data.retryAfter}s`);
        }
      } else if (axiosError.response) {
        results.errors++;
        logWarning(
          `Intento ${i}: ${axiosError.response.status} - ${axiosError.response.data.error}`
        );
      } else {
        results.errors++;
        logError(`Intento ${i}: Error de conexión - ${axiosError.message}`);
      }
    }

    await sleep(500);
  }

  console.log('\nResumen Test 1:');
  log(`  Exitosos: ${results.success}`, 'green');
  log(`  Rate Limited: ${results.rateLimited}`, 'red');
  log(`  Errores: ${results.errors}`, 'yellow');

  return results;
}

/**
 * Test 2: Rate Limit en Login Fallido (5/15min)
 */
async function testLoginRateLimit(): Promise<TestResult> {
  logSection('Test 2: Rate Limit en Login Fallido (5 fallos/15min)');

  const results: TestResult = {
    success: 0,
    unauthorized: 0,
    rateLimited: 0,
    errors: 0,
  };

  for (let i = 1; i <= 7; i++) {
    const startTime = Date.now();
    try {
      await axios.post(`${BASE_URL}/api/users/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword123',
      });

      logWarning(`Intento ${i}: Login exitoso (inesperado)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError<{ error: string; retryAfter?: number }>;

      if (axiosError.response?.status === 401) {
        results.unauthorized!++;
        log(`○ Intento ${i}: 401 Unauthorized (${duration}ms)`, 'yellow');
        logInfo(`  X-RateLimit-Limit: ${axiosError.response.headers['x-ratelimit-limit']}`);
        logInfo(`  X-RateLimit-Remaining: ${axiosError.response.headers['x-ratelimit-remaining']}`);
      } else if (axiosError.response?.status === 429) {
        results.rateLimited++;
        logError(`Intento ${i}: 429 Too Many Requests (${duration}ms)`);
        logWarning(`  Error: ${axiosError.response.data.error}`);
        if (axiosError.response.data.retryAfter) {
          logWarning(`  Retry After: ${axiosError.response.data.retryAfter}s`);
        }
      } else if (axiosError.response) {
        results.errors++;
        logWarning(
          `Intento ${i}: ${axiosError.response.status} - ${axiosError.response.data.error}`
        );
      } else {
        results.errors++;
        logError(`Intento ${i}: Error de conexión - ${axiosError.message}`);
      }
    }

    await sleep(500);
  }

  console.log('\nResumen Test 2:');
  log(`  Unauthorized (401): ${results.unauthorized}`, 'yellow');
  log(`  Rate Limited (429): ${results.rateLimited}`, 'red');
  log(`  Errores: ${results.errors}`, 'yellow');

  return results;
}

/**
 * Test 3: Progresión de Headers
 */
async function testHeadersProgression(): Promise<void> {
  logSection('Test 3: Progresión de Headers de Rate Limit');

  for (let i = 1; i <= 5; i++) {
    try {
      await axios.post(`${BASE_URL}/api/users/login`, {
        email: 'test@example.com',
        password: 'wrongpass',
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const headers = axiosError.response.headers;
        const limit = headers['x-ratelimit-limit'];
        const remaining = headers['x-ratelimit-remaining'];

        console.log(`\nRequest ${i}:`);
        log(`  Limit: ${limit}`, 'blue');
        log(`  Remaining: ${remaining}`, parseInt(remaining as string) > 1 ? 'green' : 'red');

        if (parseInt(remaining as string) <= 1) {
          logWarning('  ⚠️  ¡Cerca del límite!');
        }
      }
    }

    await sleep(300);
  }
}

/**
 * Test 4: Requests Concurrentes
 */
async function testConcurrentRequests(): Promise<void> {
  logSection('Test 4: Requests Concurrentes (10 simultáneas)');

  const promises: Promise<{ index: number; status: number; error?: boolean }>[] = [];
  const startTime = Date.now();

  for (let i = 0; i < 10; i++) {
    promises.push(
      axios
        .post(`${BASE_URL}/api/users/login`, {
          email: 'concurrent@test.com',
          password: 'wrongpass',
        })
        .then(() => ({ index: i, status: 200 }))
        .catch((error: AxiosError) => ({
          index: i,
          status: error.response?.status || 0,
          error: true,
        }))
    );
  }

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const summary = {
    success: 0,
    unauthorized: 0,
    rateLimited: 0,
    errors: 0,
  };

  results.forEach((result) => {
    if (result.error) {
      if (result.status === 401) {
        summary.unauthorized++;
        log(`Request ${result.index + 1}: 401 Unauthorized`, 'yellow');
      } else if (result.status === 429) {
        summary.rateLimited++;
        logError(`Request ${result.index + 1}: 429 Rate Limited`);
      } else {
        summary.errors++;
        logWarning(`Request ${result.index + 1}: Error ${result.status}`);
      }
    } else {
      summary.success++;
      logSuccess(`Request ${result.index + 1}: Success`);
    }
  });

  console.log(`\nTiempo total: ${totalTime}ms`);
  console.log('Resumen:');
  log(`  Unauthorized: ${summary.unauthorized}`, 'yellow');
  log(`  Rate Limited: ${summary.rateLimited}`, 'red');
  log(`  Errores: ${summary.errors}`, 'yellow');
}

/**
 * Test 5: Performance Monitor
 */
async function testPerformanceMonitoring(): Promise<void> {
  logSection('Test 5: Performance Monitoring (Health Check)');

  try {
    const startTime = Date.now();
    const response = await axios.get<HealthResponse>(`${BASE_URL}/health`);
    const duration = Date.now() - startTime;

    logSuccess(`Health check exitoso (${duration}ms)`);

    const data = response.data;
    console.log('\nEstado del Sistema:');
    log(`  Status: ${data.status}`, 'green');
    log(`  Uptime: ${data.uptime}`, 'blue');

    console.log('\nMemoria:');
    log(`  Heap Used: ${data.memory.heapUsed}`, 'cyan');
    log(`  Heap Total: ${data.memory.heapTotal}`, 'cyan');
    log(`  RSS: ${data.memory.rss}`, 'cyan');

    console.log('\nPerformance:');
    log(`  Total Requests: ${data.performance.totalRequests}`, 'blue');
    log(`  Avg Duration: ${data.performance.averageDuration}`, 'blue');
    log(`  Slow Requests: ${data.performance.slowRequests}`, 'yellow');
    log(`  Slow Threshold: ${data.performance.slowThreshold}`, 'yellow');

    if (data.performance.byStatus) {
      console.log('\nPor Status Code:');
      Object.entries(data.performance.byStatus).forEach(([status, count]) => {
        const color = status.startsWith('2') ? 'green' : status.startsWith('4') ? 'yellow' : 'red';
        log(`  ${status}: ${count}`, color);
      });
    }

    if (data.performance.topPaths && data.performance.topPaths.length > 0) {
      console.log('\nTop Endpoints:');
      data.performance.topPaths.slice(0, 5).forEach((path, index) => {
        console.log(`  ${index + 1}. ${path.path}`);
        log(`     Count: ${path.count}, Avg: ${path.avgDuration}`, 'cyan');
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    logError(`Error al obtener health check: ${axiosError.message}`);
  }
}

/**
 * Test 6: Cache Performance
 */
async function testCachePerformance(): Promise<void> {
  logSection('Test 6: Performance de Caché');

  let testUserId: number | null = null;
  let token: string | null = null;

  // Crear usuario de prueba
  try {
    const email = `cache-test-${Date.now()}@example.com`;
    const password = 'Password123!';

    const createResponse = await axios.post(`${BASE_URL}/api/users/register`, {
      email,
      password,
      name: 'Cache Test User',
    });

    testUserId = createResponse.data.user.id;
    logSuccess(`Usuario de prueba creado: ID ${testUserId}`);

    // Login para obtener token
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email,
      password,
    });
    token = loginResponse.data.token;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      logError('Rate limit alcanzado, saltando test de caché');
      return;
    }
    logWarning('No se pudo crear usuario de prueba, usando ID 1');
    testUserId = 1;
  }

  if (!token) {
    logWarning('No hay token disponible, saltando test de caché');
    return;
  }

  // Hacer múltiples requests al mismo usuario
  const iterations = 5;
  const times: number[] = [];

  console.log(`\nHaciendo ${iterations} requests al usuario ID ${testUserId}:`);

  for (let i = 1; i <= iterations; i++) {
    try {
      const startTime = Date.now();
      await axios.get(`${BASE_URL}/api/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const duration = Date.now() - startTime;
      times.push(duration);

      const cacheStatus = i === 1 ? 'Cache Miss (probable)' : 'Cache Hit (probable)';
      log(`  Request ${i}: ${duration}ms - ${cacheStatus}`, i === 1 ? 'yellow' : 'green');
    } catch (error) {
      const axiosError = error as AxiosError;
      logError(`  Request ${i}: Error - ${axiosError.message}`);
    }

    await sleep(100);
  }

  if (times.length > 1) {
    const firstRequest = times[0];
    const avgCached = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);
    const improvement = ((firstRequest - avgCached) / firstRequest) * 100;

    console.log('\nAnálisis:');
    log(`  Primera request (sin caché): ${firstRequest}ms`, 'yellow');
    log(`  Promedio con caché: ${avgCached.toFixed(1)}ms`, 'green');
    log(`  Mejora: ${improvement.toFixed(1)}% más rápido`, 'cyan');
  }
}

/**
 * Test 7: Paginación
 */
async function testPagination(): Promise<void> {
  logSection('Test 7: Endpoint de Paginación');

  let token: string | null = null;

  // Obtener token
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });
    token = loginResponse.data.token;
  } catch {
    try {
      await axios.post(`${BASE_URL}/api/users/register`, {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
      });
      const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
        email: 'admin@example.com',
        password: 'admin123',
      });
      token = loginResponse.data.token;
    } catch (error) {
      logError('No se pudo obtener token, saltando test de paginación');
      return;
    }
  }

  const tests = [
    { limit: 5, offset: 0, description: 'Primera página (5 items)' },
    { limit: 10, offset: 0, description: 'Primera página (10 items)' },
    { limit: 5, offset: 5, description: 'Segunda página (5 items)' },
  ];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/users`, {
        params: { limit: test.limit, offset: test.offset },
        headers: { Authorization: `Bearer ${token}` },
      });
      const duration = Date.now() - startTime;

      logSuccess(`${test.description}: ${duration}ms`);
      logInfo(`  Total: ${response.data.pagination.total}`);
      logInfo(`  Returned: ${response.data.users.length}`);
      logInfo(`  Has More: ${response.data.pagination.hasMore}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      logError(
        `${test.description}: Error - ${axiosError.response?.data?.error || axiosError.message}`
      );
    }

    await sleep(200);
  }
}

/**
 * Main
 */
async function main(): Promise<void> {
  logHeader('🧪 TEST SUITE: RATE LIMITING Y PERFORMANCE');

  log('\nAPI Base URL: ' + BASE_URL, 'blue');
  log('Fecha: ' + new Date().toLocaleString(), 'blue');

  try {
    // Verificar que el servidor esté corriendo
    try {
      await axios.get(`${BASE_URL}/health`);
      logSuccess('✓ Servidor disponible\n');
    } catch (error) {
      logError('✗ Servidor no disponible en ' + BASE_URL);
      logWarning('Asegúrate de que el servidor esté corriendo con: npm run dev');
      process.exit(1);
    }

    // Ejecutar tests
    await testRegisterRateLimit();
    await sleep(1000);

    await testLoginRateLimit();
    await sleep(1000);

    await testHeadersProgression();
    await sleep(1000);

    await testConcurrentRequests();
    await sleep(1000);

    await testPerformanceMonitoring();
    await sleep(1000);

    await testCachePerformance();
    await sleep(1000);

    await testPagination();

    logHeader('✅ TESTS COMPLETADOS');
    log('\nPara limpiar los contadores de rate limit:', 'yellow');
    log('docker-compose exec redis redis-cli FLUSHALL', 'cyan');
  } catch (error) {
    logError('\n❌ Error fatal durante los tests:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main().catch(console.error);
