import { GetUserUseCase } from '../GetUserUseCase';
import { UserRepository } from '@domain/repositories/UserRepository';
import { User } from '@domain/entities/User';

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Mock del UserRepository
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findAllPaginated: jest.fn(),
    } as jest.Mocked<UserRepository>;

    getUserUseCase = new GetUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const userId = 1;
      const expectedUser: User = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await getUserUseCase.execute(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      const userId = 999;
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getUserUseCase.execute(userId)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return user with all properties', async () => {
      // Arrange
      const userId = 1;
      const expectedUser: User = {
        id: userId,
        email: 'detailed@example.com',
        password: 'hashed_password_123',
        name: 'Detailed User',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await getUserUseCase.execute(userId);

      // Assert
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('email', 'detailed@example.com');
      expect(result).toHaveProperty('name', 'Detailed User');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
