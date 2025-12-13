import express, { Application, Request, Response, NextFunction } from 'express';
import { PrismaConnection } from './database/PrismaConnection';
import { DynamoDBConnection } from './database/DynamoDBConnection';
import { RedisConnection } from './database/RedisConnection';
import { PerformanceMonitor } from './middleware/PerformanceMonitor';
import { errorHandler } from './middleware/ErrorHandler';
import { NotFoundError } from '../domain/errors/AppError';
import { logger } from './logger/Logger';
import { config, validateConfig } from '../config/environment';
import routes from '../interfaces/routes';

export class App {
  private app: Application;
  private port: number;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    validateConfig();
    this.app = express();
    this.port = config.server.port;
    this.performanceMonitor = new PerformanceMonitor(1000); // 1 segundo threshold
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Performance monitoring middleware (debe ir primero)
    this.app.use(this.performanceMonitor.middleware());

    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint con métricas de rendimiento
    this.app.get('/health', this.performanceMonitor.healthCheckEndpoint());

    this.app.use('/api', routes);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Auth Service API - Clean Architecture + Prisma + PostgreSQL',
        version: '3.0.0',
        stack: {
          database: 'PostgreSQL 16',
          orm: 'Prisma',
          cache: 'Redis 7',
          sessions: 'DynamoDB (LocalStack)',
        },
        features: [
          'Prisma ORM with PostgreSQL',
          'Redis Caching (Decorator Pattern)',
          'Rate Limiting',
          'DynamoDB Sessions',
          'Performance Monitoring',
          'Type Safety',
          'Centralized Configuration',
        ],
        endpoints: {
          health: '/health',
          register: 'POST /api/users/register',
          login: 'POST /api/users/login',
          logout: 'POST /api/users/logout (protected)',
          getUser: 'GET /api/users/:id (protected)',
          listUsers: 'GET /api/users?limit=10&offset=0 (protected)',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new NotFoundError('Route not found'));
    });

    // Error handler centralizado
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test PostgreSQL connection (Prisma)
      await PrismaConnection.testConnection();

      // Test DynamoDB connection
      const dynamoDB = DynamoDBConnection.getInstance();
      await dynamoDB.testConnection();

      // Test Redis connection
      const redis = RedisConnection.getInstance();
      await redis.connect();
      const redisHealthy = await redis.ping();
      if (!redisHealthy) {
        throw new Error('Redis connection failed');
      }

      // Start server
      this.app.listen(this.port, () => {
        console.log(`\n🚀 Server running on port ${this.port}`);
        console.log(`📍 URL: http://localhost:${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api`);
        console.log(`🐘 PostgreSQL: Connected (Prisma ORM)`);
        console.log(`🔴 Redis: Connected`);
        console.log(`🔶 DynamoDB: Connected`);
        console.log(`⚡ Optimizations: Enabled`);
        console.log('\n✨ Ready to accept requests\n');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
