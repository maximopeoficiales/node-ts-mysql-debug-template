import { RedisConnection } from '../database/RedisConnection';
import { config } from '../../config/environment';

export class RedisCache {
  public redisConnection: RedisConnection;
  private defaultTTL: number;

  constructor(defaultTTL?: number) {
    this.redisConnection = RedisConnection.getInstance();
    this.defaultTTL = defaultTTL || config.redis.cacheTTL;
  }

  /**
   * Guardar un valor en caché
   * @param key Clave del caché
   * @param value Valor a guardar (se serializa a JSON)
   * @param ttl Tiempo de vida en segundos (opcional, usa defaultTTL si no se especifica)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const client = this.redisConnection.getClient();
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;

      await client.setEx(key, expiration, serializedValue);
    } catch (error) {
      console.error(`Error al guardar en caché (${key}):`, error);
      throw error;
    }
  }

  /**
   * Obtener un valor del caché
   * @param key Clave del caché
   * @returns El valor deserializado o null si no existe
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.redisConnection.getClient();
      const value = await client.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error al obtener del caché (${key}):`, error);
      return null;
    }
  }

  /**
   * Eliminar una clave del caché
   * @param key Clave del caché
   */
  public async del(key: string): Promise<void> {
    try {
      const client = this.redisConnection.getClient();
      await client.del(key);
    } catch (error) {
      console.error(`Error al eliminar del caché (${key}):`, error);
      throw error;
    }
  }

  /**
   * Verificar si existe una clave en el caché
   * @param key Clave del caché
   * @returns true si existe, false si no
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const client = this.redisConnection.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error al verificar existencia en caché (${key}):`, error);
      return false;
    }
  }

  /**
   * Eliminar múltiples claves que coincidan con un patrón
   * @param pattern Patrón de búsqueda (ej: "user:*")
   */
  public async deletePattern(pattern: string): Promise<void> {
    try {
      const client = this.redisConnection.getClient();
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error(`Error al eliminar patrón del caché (${pattern}):`, error);
      throw error;
    }
  }

  /**
   * Incrementar un contador
   * @param key Clave del contador
   * @param ttl Tiempo de vida en segundos (opcional)
   * @returns El nuevo valor del contador
   */
  public async increment(key: string, ttl?: number): Promise<number> {
    try {
      const client = this.redisConnection.getClient();
      const value = await client.incr(key);

      if (ttl) {
        await client.expire(key, ttl);
      }

      return value;
    } catch (error) {
      console.error(`Error al incrementar contador (${key}):`, error);
      throw error;
    }
  }

  /**
   * Obtener el TTL restante de una clave
   * @param key Clave del caché
   * @returns TTL en segundos, -1 si no tiene expiración, -2 si no existe
   */
  public async getTTL(key: string): Promise<number> {
    try {
      const client = this.redisConnection.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(`Error al obtener TTL (${key}):`, error);
      return -2;
    }
  }
}
