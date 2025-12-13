import { LogoutUserUseCase } from '../LogoutUserUseCase';
import { SessionRepository } from '@domain/repositories/SessionRepository';

describe('LogoutUserUseCase', () => {
  let logoutUserUseCase: LogoutUserUseCase;
  let mockSessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    // Mock del SessionRepository
    mockSessionRepository = {
      save: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as jest.Mocked<SessionRepository>;

    logoutUserUseCase = new LogoutUserUseCase(mockSessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete session successfully', async () => {
      // Arrange
      const token = 'valid_token_123';
      mockSessionRepository.delete.mockResolvedValue(true);

      // Act
      await logoutUserUseCase.execute(token);

      // Assert
      expect(mockSessionRepository.delete).toHaveBeenCalledWith(token);
    });

    it('should handle session deletion even if session does not exist', async () => {
      // Arrange
      const token = 'nonexistent_token';
      mockSessionRepository.delete.mockResolvedValue(false);

      // Act & Assert
      await expect(logoutUserUseCase.execute(token)).rejects.toThrow('Session not found or already expired');
      expect(mockSessionRepository.delete).toHaveBeenCalledWith(token);
    });
  });
});
