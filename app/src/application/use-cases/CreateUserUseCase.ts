import { UserRepository } from '../../domain/repositories/UserRepository';
import { CreateUserDTO, User } from '../../domain/entities/User';
import { ConflictError } from '../../domain/errors/AppError';
import { logger } from '../../infrastructure/logger/Logger';
import { IEventBus } from '../../domain/events/IEventBus';
import { IEvent } from '../../domain/events/IEvent';
import { EventType, UserRegisteredEventData } from '../dtos/EventDTOs';
import bcrypt from 'bcrypt';

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private eventBus?: IEventBus // Opcional para mantener retrocompatibilidad
  ) {}

  async execute(userData: CreateUserDTO): Promise<User> {
    // Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      logger.warn({ message: 'Attempt to register with existing email', email: userData.email });
      throw new ConflictError('Email already exists');
    }
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Crear el usuario
    const user = await this.userRepository.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    });

    // Emitir evento: Usuario registrado
    if (this.eventBus) {
      const event: IEvent = {
        type: EventType.USER_REGISTERED,
        data: {
          userId: user.id.toString(),
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        } as UserRegisteredEventData,
        timestamp: new Date(),
      };

      // No esperamos a que se publique para no bloquear la respuesta
      this.eventBus.publish(event).catch((error) => {
        logger.error({
          message: 'Failed to publish user.registered event',
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      logger.info({
        message: 'User registered event published',
        userId: user.id,
        email: user.email,
      });
    }

    return user;
  }
}
