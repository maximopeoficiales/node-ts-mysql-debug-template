import {
  UserRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/UserRepository';
import { User, CreateUserDTO } from '../../domain/entities/User';
import { RedisCache } from '../cache/RedisCache';

/**
 * Decorator que agrega caching con Redis al UserRepository
 * Sigue el patrón Decorator para envolver cualquier implementación de UserRepository
 */
export class CachedUserRepository implements UserRepository {
  private cache: RedisCache;
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_TTL: number;

  constructor(
    private baseRepository: UserRepository,
    cacheTTL: number = 3600 // 1 hora por defecto
  ) {
    this.cache = new RedisCache(cacheTTL);
    this.CACHE_TTL = cacheTTL;
  }

  /**
   * Crear usuario - Invalida caché de listados
   */
  async create(userData: CreateUserDTO): Promise<User> {
    const user = await this.baseRepository.create(userData);

    // Guardar en caché el usuario recién creado
    await this.cache.set(`${this.CACHE_PREFIX}id:${user.id}`, user, this.CACHE_TTL);
    await this.cache.set(`${this.CACHE_PREFIX}email:${user.email}`, user, this.CACHE_TTL);

    // Invalidar caché de listados
    await this.cache.del(`${this.CACHE_PREFIX}all`);

    return user;
  }

  /**
   * Buscar por ID - Usa caché con patrón cache-aside
   */
  async findById(id: number): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;

    // Intentar obtener del caché
    const cachedUser = await this.cache.get<User>(cacheKey);
    if (cachedUser) {
      console.log(`✓ Cache hit: user:${id}`);
      return cachedUser;
    }

    console.log(`✗ Cache miss: user:${id}`);

    // Si no está en caché, buscar en BD
    const user = await this.baseRepository.findById(id);

    // Guardar en caché si se encontró
    if (user) {
      await this.cache.set(cacheKey, user, this.CACHE_TTL);
      // También cachear por email para búsquedas futuras
      await this.cache.set(`${this.CACHE_PREFIX}email:${user.email}`, user, this.CACHE_TTL);
    }

    return user;
  }

  /**
   * Buscar por email - Usa caché con patrón cache-aside
   */
  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}email:${email}`;

    // Intentar obtener del caché
    const cachedUser = await this.cache.get<User>(cacheKey);
    if (cachedUser) {
      console.log(`✓ Cache hit: user email:${email}`);
      return cachedUser;
    }

    console.log(`✗ Cache miss: user email:${email}`);

    // Si no está en caché, buscar en BD
    const user = await this.baseRepository.findByEmail(email);

    // Guardar en caché si se encontró
    if (user) {
      await this.cache.set(cacheKey, user, this.CACHE_TTL);
      // También cachear por ID
      await this.cache.set(`${this.CACHE_PREFIX}id:${user.id}`, user, this.CACHE_TTL);
    }

    return user;
  }

  /**
   * Actualizar usuario - Invalida caché del usuario
   */
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    // Obtener usuario actual para invalidar cache por email
    const currentUser = await this.baseRepository.findById(id);

    const updatedUser = await this.baseRepository.update(id, userData);

    if (updatedUser) {
      // Invalidar cache del usuario por ID
      await this.cache.del(`${this.CACHE_PREFIX}id:${id}`);

      // Invalidar cache por email antiguo
      if (currentUser) {
        await this.cache.del(`${this.CACHE_PREFIX}email:${currentUser.email}`);
      }

      // Invalidar cache por email nuevo si cambió
      if (userData.email) {
        await this.cache.del(`${this.CACHE_PREFIX}email:${userData.email}`);
      }

      // Guardar nueva versión en caché
      await this.cache.set(`${this.CACHE_PREFIX}id:${updatedUser.id}`, updatedUser, this.CACHE_TTL);
      await this.cache.set(
        `${this.CACHE_PREFIX}email:${updatedUser.email}`,
        updatedUser,
        this.CACHE_TTL
      );

      // Invalidar listados
      await this.cache.del(`${this.CACHE_PREFIX}all`);
    }

    return updatedUser;
  }

  /**
   * Eliminar usuario - Invalida todo el caché relacionado
   */
  async delete(id: number): Promise<boolean> {
    // Obtener usuario antes de eliminar para invalidar cache por email
    const user = await this.baseRepository.findById(id);

    const deleted = await this.baseRepository.delete(id);

    if (deleted && user) {
      // Invalidar todos los caches relacionados
      await this.cache.del(`${this.CACHE_PREFIX}id:${id}`);
      await this.cache.del(`${this.CACHE_PREFIX}email:${user.email}`);
      await this.cache.del(`${this.CACHE_PREFIX}all`);
    }

    return deleted;
  }

  /**
   * Listar todos los usuarios - Caché de listado completo
   */
  async findAll(): Promise<User[]> {
    const cacheKey = `${this.CACHE_PREFIX}all`;

    // Intentar obtener del caché
    const cachedUsers = await this.cache.get<User[]>(cacheKey);
    if (cachedUsers) {
      console.log('✓ Cache hit: all users');
      return cachedUsers;
    }

    console.log('✗ Cache miss: all users');

    // Si no está en caché, buscar en BD
    const users = await this.baseRepository.findAll();

    // Guardar en caché
    await this.cache.set(cacheKey, users, this.CACHE_TTL);

    return users;
  }

  /**
   * Listar usuarios con paginación - Caché por página
   */
  async findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { limit, offset } = options;
    const cacheKey = `${this.CACHE_PREFIX}paginated:${limit}:${offset}`;

    // Intentar obtener del caché
    const cachedResult = await this.cache.get<PaginatedResult<User>>(cacheKey);
    if (cachedResult) {
      console.log(`✓ Cache hit: users page (limit:${limit}, offset:${offset})`);
      return cachedResult;
    }

    console.log(`✗ Cache miss: users page (limit:${limit}, offset:${offset})`);

    // Si no está en caché, buscar en BD
    const result = await this.baseRepository.findAllPaginated(options);

    // Guardar en caché (TTL más corto para datos paginados: 5 minutos)
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Método auxiliar para limpiar todo el caché de usuarios
   */
  async clearCache(): Promise<void> {
    await this.cache.deletePattern(`${this.CACHE_PREFIX}*`);
    console.log('✓ Cache de usuarios limpiado completamente');
  }
}
