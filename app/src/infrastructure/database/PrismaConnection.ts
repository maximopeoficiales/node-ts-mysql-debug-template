import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '../../config/environment';

/**
 * Singleton para gestionar la conexión con Prisma
 */
export class PrismaConnection {
  private static instance: PrismaClient;
  private static pool: Pool;

  private constructor() {}

  /**
   * Obtiene la instancia única de PrismaClient
   */
  public static getInstance(): PrismaClient {
    if (!PrismaConnection.instance) {
      // Crear pool de PostgreSQL
      PrismaConnection.pool = new Pool({
        connectionString: config.database.url,
      });

      // Crear adapter de Prisma
      const adapter = new PrismaPg(PrismaConnection.pool);

      // Crear PrismaClient con adapter
      PrismaConnection.instance = new PrismaClient({
        adapter,
        log: config.server.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
      });

      console.log('✅ Prisma Client initialized');
    }
    return PrismaConnection.instance;
  }

  /**
   * Desconectar Prisma Client
   */
  public static async disconnect(): Promise<void> {
    if (PrismaConnection.instance) {
      await PrismaConnection.instance.$disconnect();
      console.log('🔌 Prisma disconnected');
    }
    if (PrismaConnection.pool) {
      await PrismaConnection.pool.end();
      console.log('🔌 PostgreSQL pool closed');
    }
  }

  /**
   * Probar la conexión a la base de datos
   */
  public static async testConnection(): Promise<void> {
    try {
      const client = PrismaConnection.getInstance();
      await client.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL connected successfully (Prisma)');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }
}
