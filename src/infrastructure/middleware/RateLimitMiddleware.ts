import { Request, Response, NextFunction } from 'express';
import { RedisCache } from '../cache/RedisCache';

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo de requests permitidos en la ventana
  message?: string; // Mensaje personalizado cuando se excede el límite
  skipSuccessfulRequests?: boolean; // Si es true, solo cuenta requests con error
  keyGenerator?: (req: Request) => string; // Función para generar la clave única
}

export class RateLimitMiddleware {
  private cache: RedisCache;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.cache = new RedisCache();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Demasiadas peticiones, intenta de nuevo más tarde.',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
    };
  }

  /**
   * Generador de clave por defecto: usa la IP del cliente
   */
  private defaultKeyGenerator(req: Request): string {
    const ip =
      req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    return `ratelimit:${ip}`;
  }

  /**
   * Middleware de rate limiting
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = this.config.keyGenerator(req);
        const windowSeconds = Math.ceil(this.config.windowMs / 1000);

        // Obtener el contador actual
        const currentCount = await this.cache.increment(key, windowSeconds);

        // Headers informativos para el cliente
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
        res.setHeader(
          'X-RateLimit-Remaining',
          Math.max(0, this.config.maxRequests - currentCount).toString()
        );

        // Verificar si se excedió el límite
        if (currentCount > this.config.maxRequests) {
          const ttl = await this.cache.getTTL(key);
          res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
          res.setHeader('Retry-After', ttl.toString());

          res.status(429).json({
            error: this.config.message,
            retryAfter: ttl,
          });
          return;
        }

        // Si la configuración indica omitir requests exitosos,
        // guardamos el estado original para poder decrementar si es exitoso
        if (this.config.skipSuccessfulRequests) {
          const cache = this.cache; // Capturar referencia al cache
          const originalSend = res.send.bind(res);
          res.send = function (body: any): Response {
            // Si la respuesta es exitosa (2xx), decrementar el contador
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // Decrementar de forma asíncrona sin bloquear
              (async () => {
                try {
                  const client = cache.redisConnection.getClient();
                  await client.decr(key);
                } catch (error) {
                  console.error('Error al decrementar rate limit:', error);
                }
              })();
            }
            return originalSend(body);
          };
        }
        next();
      } catch (error) {
        console.error('Error en rate limiting middleware:', error);
        // En caso de error con Redis, permitir la petición
        next();
      }
    };
  }
}

/**
 * Factory function para crear rate limiters comunes
 */
export class RateLimitFactory {
  /**
   * Rate limiter estricto: 100 requests cada 15 minutos
   */
  static strict(): RateLimitMiddleware {
    return new RateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100,
      message: 'Has excedido el límite de peticiones. Intenta de nuevo en 15 minutos.',
    });
  }

  /**
   * Rate limiter moderado: 300 requests cada 15 minutos
   */
  static moderate(): RateLimitMiddleware {
    return new RateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 300,
      message: 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.',
    });
  }

  /**
   * Rate limiter para login: 5 intentos cada 15 minutos por IP
   */
  static login(): RateLimitMiddleware {
    return new RateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,
      message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
      skipSuccessfulRequests: true, // Solo contar logins fallidos
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return `ratelimit:login:${ip}`;
      },
    });
  }

  /**
   * Rate limiter para registro: 3 registros por hora por IP
   */
  static register(): RateLimitMiddleware {
    return new RateLimitMiddleware({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3,
      message: 'Has excedido el límite de registros. Intenta de nuevo en 1 hora.',
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return `ratelimit:register:${ip}`;
      },
    });
  }

  /**
   * Rate limiter por usuario autenticado (usa el ID del usuario)
   */
  static authenticated(): RateLimitMiddleware {
    return new RateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 200,
      message: 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.',
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id || 'anonymous';
        return `ratelimit:user:${userId}`;
      },
    });
  }
}
