import { LoginUserUseCase } from '../LoginUserUseCase';
import { UserRepository } from '@domain/repositories/UserRepository';
import { SessionRepository } from '@domain/repositories/SessionRepository';
import { User } from '@domain/entities/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock de bcrypt y jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockSessionRepository: jest.Mocked<SessionRepository>;

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

    // Mock del SessionRepository
    mockSessionRepository = {
      save: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as jest.Mocked<SessionRepository>;

    loginUserUseCase = new LoginUserUseCase(mockUserRepository, mockSessionRepository);

    // Mock de bcrypt.compare
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock de jwt.sign
    (jwt.sign as jest.Mock).mockReturnValue('mocked_token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const user: User = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context = {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockSessionRepository.save.mockResolvedValue();

      // Act
      const result = await loginUserUseCase.execute(loginData, context);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, user.password);
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result.token).toBe('mocked_token');
      expect(result.user.email).toBe(user.email);
      expect(result.user.name).toBe(user.name);
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUserUseCase.execute(loginData)).rejects.toThrow('Invalid credentials');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const user: User = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(loginUserUseCase.execute(loginData)).rejects.toThrow('Invalid credentials');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, user.password);
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it('should create session with correct parameters', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const user: User = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome',
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockSessionRepository.save.mockResolvedValue();

      // Act
      await loginUserUseCase.execute(loginData, context);

      // Assert
      expect(mockSessionRepository.save).toHaveBeenCalledWith(
        'mocked_token',
        expect.objectContaining({
          userId: user.id,
          email: user.email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }),
        expect.any(Number)
      );
    });
  });
});
