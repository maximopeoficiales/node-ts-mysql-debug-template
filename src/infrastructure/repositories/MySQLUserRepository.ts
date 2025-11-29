import {
  UserRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/UserRepository';
import { User, CreateUserDTO } from '../../domain/entities/User';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class MySQLUserRepository implements UserRepository {
  private db = DatabaseConnection.getInstance().getPool();

  async create(userData: CreateUserDTO): Promise<User> {
    const query = `
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `;

    const [result] = await this.db.execute<ResultSetHeader>(query, [
      userData.email,
      userData.password,
      userData.name,
    ]);

    const insertId = result.insertId;
    const createdUser = await this.findById(insertId);

    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return createdUser;
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await this.db.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await this.db.execute<RowDataPacket[]>(query, [email]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password !== undefined) {
      fields.push('password = ?');
      values.push(userData.password);
    }
    if (userData.name !== undefined) {
      fields.push('name = ?');
      values.push(userData.name);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    await this.db.execute(query, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await this.db.execute<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const [rows] = await this.db.execute<RowDataPacket[]>(query);
    return rows.map((row) => this.mapRowToUser(row));
  }

  async findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { limit, offset } = options;

    // Query para obtener el total de usuarios
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const [countRows] = await this.db.execute<RowDataPacket[]>(countQuery);
    const total = countRows[0].total;

    // Query paginado
    const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await this.db.execute<RowDataPacket[]>(query, [limit, offset]);
    const data = rows.map((row) => this.mapRowToUser(row));

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  private mapRowToUser(row: RowDataPacket): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
