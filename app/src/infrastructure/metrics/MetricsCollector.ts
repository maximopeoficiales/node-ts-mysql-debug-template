import { Counter, Histogram, Gauge, register } from 'prom-client';

/**
 * Collector de métricas usando Prometheus
 * Permite monitorear el rendimiento y estado de la aplicación
 */
export class MetricsCollector {
  private static instance: MetricsCollector;

  // Contador de requests HTTP
  private httpRequestCounter: Counter<string>;

  // Histograma de duración de requests
  private httpRequestDuration: Histogram<string>;

  // Contador de errores
  private errorCounter: Counter<string>;

  // Gauge para usuarios activos (sessions)
  private activeSessions: Gauge<string>;

  // Contador de cache hits/misses
  private cacheHitCounter: Counter<string>;
  private cacheMissCounter: Counter<string>;

  // Gauge para uso de memoria
  private memoryUsage: Gauge<string>;

  private constructor() {
    // Inicializar métricas por defecto de Node.js
    register.setDefaultLabels({
      app: 'auth-service',
    });

    // HTTP Requests
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    // HTTP Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in milliseconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000], // buckets en ms
    });

    // Errors
    this.errorCounter = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'path'],
    });

    // Active Sessions
    this.activeSessions = new Gauge({
      name: 'active_sessions_total',
      help: 'Number of active user sessions',
    });

    // Cache Hits
    this.cacheHitCounter = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['operation'],
    });

    // Cache Misses
    this.cacheMissCounter = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['operation'],
    });

    // Memory Usage
    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
    });

    // Actualizar métricas de memoria periódicamente
    this.startMemoryCollection();
  }

  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector();
    }
    return this.instance;
  }

  /**
   * Registra una petición HTTP
   */
  recordRequest(method: string, path: string, status: number, duration: number): void {
    // Normalizar path para evitar cardinalidad alta
    const normalizedPath = this.normalizePath(path);

    this.httpRequestCounter.inc({
      method,
      path: normalizedPath,
      status: status.toString(),
    });

    this.httpRequestDuration.observe(
      { method, path: normalizedPath, status: status.toString() },
      duration
    );
  }

  /**
   * Registra un error
   */
  recordError(type: string, path: string): void {
    this.errorCounter.inc({ type, path: this.normalizePath(path) });
  }

  /**
   * Actualiza el número de sesiones activas
   */
  setActiveSessions(count: number): void {
    this.activeSessions.set(count);
  }

  /**
   * Registra un cache hit
   */
  recordCacheHit(operation: string): void {
    this.cacheHitCounter.inc({ operation });
  }

  /**
   * Registra un cache miss
   */
  recordCacheMiss(operation: string): void {
    this.cacheMissCounter.inc({ operation });
  }

  /**
   * Obtiene las métricas en formato Prometheus
   */
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Normaliza el path para evitar cardinalidad alta
   * Ejemplo: /users/123 -> /users/:id
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id') // Reemplazar números por :id
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid'); // UUIDs
  }

  /**
   * Inicia la recolección periódica de métricas de memoria
   */
  private startMemoryCollection(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      this.memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
      this.memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
      this.memoryUsage.set({ type: 'rss' }, usage.rss);
      this.memoryUsage.set({ type: 'external' }, usage.external);
    }, 10000); // Cada 10 segundos
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();
