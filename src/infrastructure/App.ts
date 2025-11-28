import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { DatabaseConnection } from './database/DatabaseConnection';
import routes from '../interfaces/routes';

dotenv.config();

export class App {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

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
    this.app.use('/api', routes);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Auth Service API - Clean Architecture',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          register: 'POST /api/users/register',
          login: 'POST /api/users/login',
          getUser: 'GET /api/users/:id',
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
      // Test database connection
      const db = DatabaseConnection.getInstance();
      await db.testConnection();
      await db.initializeDatabase();

      // Start server
      this.app.listen(this.port, () => {
        console.log(`\n🚀 Server running on port ${this.port}`);
        console.log(`📍 URL: http://localhost:${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api`);
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
