import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { MySQLUserRepository } from '../../infrastructure/repositories/MySQLUserRepository';

const router = Router();

// Inicializar repositorio y casos de uso
const userRepository = new MySQLUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository);
const getUserUseCase = new GetUserUseCase(userRepository);

// Inicializar controlador
const userController = new UserController(
  createUserUseCase,
  loginUserUseCase,
  getUserUseCase
);

// Definir rutas
router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));
router.get('/:id', (req, res) => userController.getUser(req, res));

export default router;
