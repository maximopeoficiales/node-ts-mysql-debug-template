import {
  UserRepository,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/UserRepository';
import { User, CreateUserDTO } from '@domain/entities/User';
import { PrismaConnection } from '../database/PrismaConnection';

/**
 * Implementación de UserRepository usando Prisma ORM
 */
export class PrismaUserRepository implements UserRepository {
  private prisma = PrismaConnection.getInstance();

  /**
   * Crear un nuevo usuario
   */
  async create(userData: CreateUserDTO): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    return this.mapPrismaUserToUser(user);
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapPrismaUserToUser(user) : null;
  }

  /**
   * Actualizar usuario
   */
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(userData.email && { email: userData.email }),
          ...(userData.password && { password: userData.password }),
          ...(userData.name && { name: userData.name }),
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error: any) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error: any) {
      // Prisma error code P2025 = Record not found
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.mapPrismaUserToUser(user));
  }

  /**
   * Obtener usuarios con paginación
   */
  async findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { limit, offset } = options;

    // Ejecutar queries en paralelo
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((user) => this.mapPrismaUserToUser(user)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Mapea el modelo de Prisma al modelo de dominio
   */
  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
