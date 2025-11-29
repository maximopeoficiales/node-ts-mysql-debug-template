import { User, CreateUserDTO, UserResponse } from '../entities/User';

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UserRepository {
  create(userData: CreateUserDTO): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: number, userData: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
  findAll(): Promise<User[]>;
  findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<User>>;
}
