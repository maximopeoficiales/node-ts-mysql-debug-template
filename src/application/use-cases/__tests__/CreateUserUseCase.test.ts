import { CreateUserUseCase } from '../CreateUserUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User, CreateUserDTO } from '../../../domain/entities/User';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Mock del repositorio
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    createUserUseCase = new CreateUserUseCase(mockUserRepository);
  });

  it('should create a new user successfully', async () => {
    // Arrange
    const userData: CreateUserDTO = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const expectedUser: User = {
      id: 1,
      email: userData.email,
      password: 'hashedPassword',
      name: userData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(expectedUser);

    // Act
    const result = await createUserUseCase.execute(userData);

    // Assert
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.email).toBe(userData.email);
  });

  it('should throw error if email already exists', async () => {
    // Arrange
    const userData: CreateUserDTO = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const existingUser: User = {
      id: 1,
      email: userData.email,
      password: 'hashedPassword',
      name: 'Existing User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(createUserUseCase.execute(userData)).rejects.toThrow('Email already exists');
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});
