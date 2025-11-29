import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { DatabaseConnection } from './database/DatabaseConnection';
import { DynamoDBConnection } from './database/DynamoDBConnection';
import { RedisConnection } from './database/RedisConnection';
import { PerformanceMonitor } from './middleware/PerformanceMonitor';
import routes from '../interfaces/routes';

dotenv.config();

export class App {
  private app: Application;
  private port: number;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
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
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
        message: 'Auth Service API - Clean Architecture',
        version: '2.0.0',
        optimizations: [
          'Redis Cache',
          'Rate Limiting',
          'Pagination',
          'Connection Pool',
          'Performance Monitor',
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
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public async start(): Promise<void> {
    try {
      // Test MySQL connection
      const db = DatabaseConnection.getInstance();
      await db.testConnection();
      await db.initializeDatabase();

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
        console.log(`🔶 DynamoDB: Connected`);
        console.log(`🔴 Redis: Connected`);
        console.log(`⚡ Performance monitoring: Enabled`);
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
