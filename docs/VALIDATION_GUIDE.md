# 🎯 Guía de Validación con class-validator

## Implementación

El proyecto ahora usa `class-validator` para validaciones de esquemas de forma sostenible y declarativa.

## 📝 DTOs con Validación

### CreateUserDTO

```typescript
export class CreateUserDTO {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;
}
```

### LoginDTO

```typescript
export class LoginDTO {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
```

## 🛡️ Middleware de Validación

El middleware `ValidationMiddleware` se encarga de:

1. Transformar el body del request a una instancia de la clase DTO
2. Ejecutar las validaciones definidas con decoradores
3. Formatear los errores de forma legible
4. Retornar 400 Bad Request si hay errores
5. Continuar con el siguiente middleware si todo está OK

```typescript
export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const dtoInstance = plainToClass(dtoClass, req.body);
      const errors: ValidationError[] = await validate(dtoInstance);

      if (errors.length > 0) {
        const formattedErrors = this.formatErrors(errors);
        res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
        return;
      }

      req.body = dtoInstance;
      next();
    };
  }
}
```

## 🚀 Uso en Rutas

Las rutas ahora incluyen el middleware de validación:

```typescript
router.post('/register', ValidationMiddleware.validate(CreateUserDTO), (req, res) =>
  userController.register(req, res)
);

router.post('/login', ValidationMiddleware.validate(LoginDTO), (req, res) =>
  userController.login(req, res)
);
```

## 📊 Ejemplos de Respuestas

### Request Válido

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Respuesta (201):**

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Request Inválido

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "name": "A"
  }'
```

**Respuesta (400):**

```json
{
  "error": "Validation failed",
  "details": {
    "email": ["Email must be a valid email address"],
    "password": ["Password must be at least 6 characters long"],
    "name": ["Name must be at least 2 characters long"]
  }
}
```

### Request con Campos Faltantes

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Respuesta (400):**

```json
{
  "error": "Validation failed",
  "details": {
    "password": ["Password is required", "Password must be a string"],
    "name": ["Name is required", "Name must be a string"]
  }
}
```

## 🎨 Decoradores Disponibles

### Validadores Comunes

```typescript
@IsString()              // Verifica que sea string
@IsNumber()              // Verifica que sea número
@IsBoolean()             // Verifica que sea boolean
@IsEmail()               // Valida formato de email
@IsNotEmpty()            // No puede estar vacío
@MinLength(n)            // Longitud mínima
@MaxLength(n)            // Longitud máxima
@Min(n)                  // Valor mínimo numérico
@Max(n)                  // Valor máximo numérico
@IsOptional()            // Campo opcional
@IsEnum(enumType)        // Debe ser valor del enum
@IsDate()                // Valida fecha
@IsUrl()                 // Valida URL
@Matches(regex)          // Valida con regex
```

### Ejemplo Avanzado

```typescript
export class UpdateUserDTO {
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}
```

## ✅ Ventajas

1. **Declarativo**: Las reglas están en el DTO, fácil de leer
2. **Reutilizable**: El mismo DTO se usa en múltiples lugares
3. **Type-safe**: TypeScript verifica los tipos
4. **Mensajes personalizados**: Control total sobre errores
5. **Fácil de testear**: DTOs independientes del framework
6. **Clean Architecture**: Validación en la capa correcta
7. **Mantenible**: Agregar validaciones es trivial

## 🧪 Testing

```typescript
import { validate } from 'class-validator';
import { CreateUserDTO } from '../domain/entities/User';

describe('CreateUserDTO Validation', () => {
  it('should validate correct data', async () => {
    const dto = Object.assign(new CreateUserDTO(), {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid email', async () => {
    const dto = Object.assign(new CreateUserDTO(), {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
```

## 🔄 Extender Validaciones

Para agregar nuevas validaciones, simplemente agrega decoradores:

```typescript
export class CreateUserDTO {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255) // ← Nueva validación
  email!: string;

  @IsString()
  @MinLength(8) // ← Cambiado de 6 a 8
  @MaxLength(50) // ← Nueva validación
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  }) // ← Validación con regex
  password!: string;
}
```

## 📚 Recursos

- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [Decorators Reference](https://github.com/typestack/class-validator#validation-decorators)
