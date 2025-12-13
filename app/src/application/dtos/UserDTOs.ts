import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO para creación de usuario
 * Incluye validaciones automáticas con class-validator
 */
export class CreateUserDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;
}

/**
 * DTO para login de usuario
 */
export class LoginUserDTO {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

/**
 * DTO para actualización de usuario (si se necesita en el futuro)
 */
export class UpdateUserDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password?: string;
}
