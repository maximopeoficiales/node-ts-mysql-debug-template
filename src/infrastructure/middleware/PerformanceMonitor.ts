import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/environment';

interface PerformanceMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export class PerformanceMonitor {
  private slowThreshold: number;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory: number;

  constructor(slowThreshold?: number, maxMetricsHistory: number = 100) {
    this.slowThreshold = slowThreshold || config.performance.slowRequestThreshold;
    this.maxMetricsHistory = maxMetricsHistory;
  }

  /**
   * Middleware para monitorear el rendimiento de las peticiones
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const startUsage = process.cpuUsage();
      const startMemory = process.memoryUsage();

      // Capturar el método original send para interceptar la respuesta
      const originalSend = res.send.bind(res);

      res.send = (body: any): Response => {
        const duration = Date.now() - startTime;
        const endUsage = process.cpuUsage(startUsage);
        const endMemory = process.memoryUsage();

        const metrics: PerformanceMetrics = {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        };

        // Guardar métricas en historial
        this.addMetric(metrics);

        // Log básico para todas las peticiones
        this.logRequest(metrics);

        // Log detallado para peticiones lentas
        if (duration > this.slowThreshold) {
          this.logSlowRequest(metrics, {
            cpuUser: endUsage.user / 1000, // Convertir a ms
            cpuSystem: endUsage.system / 1000,
            memoryDelta: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
          });
        }

        return originalSend(body);
      };

      next();
    };
  }

  /**
   * Agregar métrica al historial (mantiene solo las últimas N)
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }
  }

  /**
   * Log básico de la petición
   */
  private logRequest(metrics: PerformanceMetrics): void {
    const color = this.getColorByStatus(metrics.statusCode);
    const emoji = this.getEmojiByDuration(metrics.duration);

    console.log(
      `${emoji} ${color}${metrics.method}${this.resetColor()} ${metrics.path} - ${metrics.statusCode} - ${metrics.duration}ms`
    );
  }

  /**
   * Log detallado para peticiones lentas
   */
  private logSlowRequest(
    metrics: PerformanceMetrics,
    resources: { cpuUser: number; cpuSystem: number; memoryDelta: number }
  ): void {
    console.warn('\n⚠️  SLOW REQUEST DETECTED ⚠️');
    console.warn('━'.repeat(50));
    console.warn(`Path:        ${metrics.method} ${metrics.path}`);
    console.warn(`Duration:    ${metrics.duration}ms (threshold: ${this.slowThreshold}ms)`);
    console.warn(`Status:      ${metrics.statusCode}`);
    console.warn(`Timestamp:   ${metrics.timestamp.toISOString()}`);
    console.warn(`IP:          ${metrics.ip || 'unknown'}`);
    console.warn(`User Agent:  ${metrics.userAgent?.substring(0, 50) || 'unknown'}`);
    console.warn('Resources:');
    console.warn(`  CPU User:   ${resources.cpuUser.toFixed(2)}ms`);
    console.warn(`  CPU System: ${resources.cpuSystem.toFixed(2)}ms`);
    console.warn(`  Memory Δ:   ${resources.memoryDelta.toFixed(2)}MB`);
    console.warn('━'.repeat(50) + '\n');
  }

  /**
   * Obtener estadísticas de las métricas recientes
   */
  public getStats(): {
    totalRequests: number;
    averageDuration: number;
    slowRequests: number;
    byStatus: Record<number, number>;
    byPath: Record<string, { count: number; avgDuration: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageDuration: 0,
        slowRequests: 0,
        byStatus: {},
        byPath: {},
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const slowRequests = this.metrics.filter((m) => m.duration > this.slowThreshold).length;

    // Agrupar por status code
    const byStatus: Record<number, number> = {};
    this.metrics.forEach((m) => {
      byStatus[m.statusCode] = (byStatus[m.statusCode] || 0) + 1;
    });

    // Agrupar por path
    const byPath: Record<string, { count: number; avgDuration: number }> = {};
    this.metrics.forEach((m) => {
      const key = `${m.method} ${m.path}`;
      if (!byPath[key]) {
        byPath[key] = { count: 0, avgDuration: 0 };
      }
      byPath[key].count++;
      byPath[key].avgDuration += m.duration;
    });

    // Calcular promedio de duración por path
    Object.keys(byPath).forEach((key) => {
      byPath[key].avgDuration = byPath[key].avgDuration / byPath[key].count;
    });

    return {
      totalRequests: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      slowRequests,
      byStatus,
      byPath,
    };
  }

  /**
   * Limpiar historial de métricas
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Obtener color según el status code
   */
  private getColorByStatus(status: number): string {
    if (status >= 500) return '\x1b[31m'; // Rojo
    if (status >= 400) return '\x1b[33m'; // Amarillo
    if (status >= 300) return '\x1b[36m'; // Cyan
    if (status >= 200) return '\x1b[32m'; // Verde
    return '\x1b[37m'; // Blanco
  }

  /**
   * Resetear color de consola
   */
  private resetColor(): string {
    return '\x1b[0m';
  }

  /**
   * Obtener emoji según la duración
   */
  private getEmojiByDuration(duration: number): string {
    if (duration < 100) return '⚡'; // Muy rápido
    if (duration < 500) return '✓'; // Normal
    if (duration < 1000) return '⏱️'; // Un poco lento
    return '🐌'; // Muy lento
  }

  /**
   * Middleware para endpoint de health check con métricas
   */
  public healthCheckEndpoint() {
    return (req: Request, res: Response): void => {
      const stats = this.getStats();
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      res.json({
        status: 'healthy',
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
        },
        performance: {
          totalRequests: stats.totalRequests,
          averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
          slowRequests: stats.slowRequests,
          slowThreshold: `${this.slowThreshold}ms`,
          byStatus: stats.byStatus,
          topPaths: Object.entries(stats.byPath)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([path, data]) => ({
              path,
              count: data.count,
              avgDuration: `${data.avgDuration.toFixed(2)}ms`,
            })),
        },
      });
    };
  }
}
