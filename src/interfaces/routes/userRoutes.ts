import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { LogoutUserUseCase } from '../../application/use-cases/LogoutUserUseCase';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { CachedUserRepository } from '../../infrastructure/repositories/CachedUserRepository';
import { DynamoDBSessionRepository } from '../../infrastructure/repositories/DynamoDBSessionRepository';
import { ValidationMiddleware } from '../../infrastructure/middleware/ValidationMiddleware';
import { AuthMiddleware } from '../../infrastructure/middleware/AuthMiddleware';
import { RateLimitFactory } from '../../infrastructure/middleware/RateLimitMiddleware';
import { CreateUserDTO, LoginDTO } from '../../domain/entities/User';

const router = Router();

// Inicializar repositorios
const prismaUserRepository = new PrismaUserRepository();
// Envolver con cache decorator (3600s = 1 hora)
const userRepository = new CachedUserRepository(prismaUserRepository, 3600);
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
  logoutUserUseCase,
  userRepository
);

// Inicializar middleware de autenticación
const authMiddleware = new AuthMiddleware(sessionRepository);

// Inicializar rate limiters
const registerRateLimit = RateLimitFactory.register();
const loginRateLimit = RateLimitFactory.login();
const generalRateLimit = RateLimitFactory.moderate();

// Rutas públicas con rate limiting
router.post(
  '/register',
  registerRateLimit.middleware(),
  ValidationMiddleware.validate(CreateUserDTO),
  (req, res) => userController.register(req, res)
);

router.post(
  '/login',
  loginRateLimit.middleware(),
  ValidationMiddleware.validate(LoginDTO),
  (req, res) => userController.login(req, res)
);

// Rutas protegidas con rate limiting
router.post('/logout', generalRateLimit.middleware(), authMiddleware.authenticate, (req, res) =>
  userController.logout(req, res)
);

router.get('/:id', generalRateLimit.middleware(), authMiddleware.authenticate, (req, res) =>
  userController.getUser(req, res)
);

// Nueva ruta: listado paginado de usuarios
router.get('/', generalRateLimit.middleware(), authMiddleware.authenticate, (req, res) =>
  userController.listUsers(req, res)
);

export default router;
