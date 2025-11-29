import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/LogoutUserUseCase';
import { MySQLUserRepository } from '../../infrastructure/repositories/MySQLUserRepository';
import { DynamoDBSessionRepository } from '../../infrastructure/repositories/DynamoDBSessionRepository';
import { ValidationMiddleware } from '../../infrastructure/middleware/ValidationMiddleware';
import { AuthMiddleware } from '../../infrastructure/middleware/AuthMiddleware';
import { CreateUserDTO, LoginDTO } from '../../domain/entities/User';

const router = Router();

// Inicializar repositorios
const userRepository = new MySQLUserRepository();
const sessionRepository = new DynamoDBSessionRepository();

// Inicializar casos de uso
const createUserUseCase = new CreateUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository, sessionRepository);
const getUserUseCase = new GetUserUseCase(userRepository);
const logoutUserUseCase = new LogoutUserUseCase(sessionRepository);

// Inicializar controlador
const userController = new UserController(
  createUserUseCase,
  loginUserUseCase,
  getUserUseCase,
  logoutUserUseCase
);

// Inicializar middleware de autenticación
const authMiddleware = new AuthMiddleware(sessionRepository);

// Rutas públicas
router.post('/register', ValidationMiddleware.validate(CreateUserDTO), (req, res) =>
  userController.register(req, res)
);

router.post('/login', ValidationMiddleware.validate(LoginDTO), (req, res) =>
  userController.login(req, res)
);

// Rutas protegidas
router.post('/logout', authMiddleware.authenticate, (req, res) => userController.logout(req, res));

router.get('/:id', authMiddleware.authenticate, (req, res) => userController.getUser(req, res));

export default router;
