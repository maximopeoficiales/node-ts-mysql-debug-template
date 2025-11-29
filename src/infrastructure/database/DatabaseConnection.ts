import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'auth_service_db',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
      // Configuraciones adicionales para optimización
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async initializeDatabase(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.pool.execute(createTableQuery);
      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
