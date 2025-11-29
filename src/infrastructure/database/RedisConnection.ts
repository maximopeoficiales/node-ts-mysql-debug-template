import { createClient, RedisClientType } from 'redis';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log('Redis: Ya está conectado');
      return;
    }

    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);

      this.client = createClient({
        socket: {
          host,
          port,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis: Conectando...');
      });

      this.client.on('ready', () => {
        console.log('Redis: Conexión exitosa');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis: Conexión cerrada');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Error al conectar con Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Redis: Desconectado correctamente');
    }
  }

  public getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis no está conectado. Llama a connect() primero.');
    }
    return this.client;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Error en ping de Redis:', error);
      return false;
    }
  }
}
