# Arquitectura del Proyecto - Clean Architecture

## 📐 Estructura del Proyecto

```
auth-service-project/
├── src/
│   ├── domain/                 # Capa de Dominio
│   │   ├── entities/          # Entidades de negocio
│   │   │   └── User.ts
│   │   └── repositories/      # Interfaces de repositorios
│   │       └── UserRepository.ts
│   │
│   ├── application/            # Capa de Aplicación
│   │   └── use-cases/         # Casos de uso
│   │       ├── CreateUserUseCase.ts
│   │       ├── LoginUserUseCase.ts
│   │       └── GetUserUseCase.ts
│   │
│   ├── infrastructure/         # Capa de Infraestructura
│   │   ├── database/          # Configuración de BD
│   │   │   └── DatabaseConnection.ts
│   │   ├── repositories/      # Implementación de repositorios
│   │   │   └── MySQLUserRepository.ts
│   │   ├── App.ts             # Configuración de Express
│   │   └── server.ts          # Punto de entrada
│   │
│   └── interfaces/             # Capa de Interfaces
│       ├── controllers/       # Controladores HTTP
│       │   └── UserController.ts
│       └── routes/            # Definición de rutas
│           ├── userRoutes.ts
│           └── index.ts
│
├── .vscode/
│   ├── launch.json            # Configuración de debug
│   ├── settings.json
│   └── extensions.json
├── database/
│   └── init.sql               # Script de inicialización
├── .env                        # Variables de entorno
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── API_EXAMPLES.md
├── DATABASE_SETUP.md
└── ARCHITECTURE.md
```

---

## 🏗️ Diagrama de Capas - Clean Architecture

```mermaid
graph TB
    subgraph "Interfaces Layer"
        A[UserController]
        B[Routes]
    end

    subgraph "Application Layer"
        C[CreateUserUseCase]
        D[LoginUserUseCase]
        E[GetUserUseCase]
    end

    subgraph "Domain Layer"
        F[User Entity]
        G[UserRepository Interface]
    end

    subgraph "Infrastructure Layer"
        H[MySQLUserRepository]
        I[DatabaseConnection]
        J[Express App]
    end

    A --> C
    A --> D
    A --> E
    B --> A
    C --> G
    D --> G
    E --> G
    G -.implements.-> H
    H --> I
    C --> F
    D --> F
    E --> F
    J --> B

    style F fill:#e1f5ff
    style G fill:#e1f5ff
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#fff4e1
    style A fill:#f0e1ff
    style B fill:#f0e1ff
    style H fill:#e1ffe1
    style I fill:#e1ffe1
    style J fill:#e1ffe1
```

---

## 🔄 Diagrama de Flujo - Registro de Usuario

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant Controller
    participant UseCase
    participant Repository
    participant Database

    Client->>Router: POST /api/users/register
    Router->>Controller: register(req, res)

    Controller->>Controller: Validar entrada
    Controller->>UseCase: execute(userData)

    UseCase->>Repository: findByEmail(email)
    Repository->>Database: SELECT * FROM users WHERE email = ?
    Database-->>Repository: null (no existe)
    Repository-->>UseCase: null

    UseCase->>UseCase: Hashear contraseña
    UseCase->>Repository: create(userData)
    Repository->>Database: INSERT INTO users
    Database-->>Repository: User creado
    Repository-->>UseCase: User

    UseCase-->>Controller: User
    Controller->>Controller: Formatear respuesta
    Controller-->>Router: JSON response
    Router-->>Client: 201 Created
```

---

## 🎯 Diagrama de Componentes

```mermaid
graph LR
    subgraph External
        A[Cliente HTTP]
        B[MySQL Database]
    end

    subgraph Application
        C[Express Server]
        D[Routes]
        E[Controllers]
        F[Use Cases]
        G[Repositories]
        H[Entities]
    end

    A -->|HTTP Request| C
    C --> D
    D --> E
    E --> F
    F --> H
    F --> G
    G -->|SQL Queries| B

    style A fill:#ffcccc
    style B fill:#ccffcc
    style C fill:#cce5ff
    style F fill:#fff4cc
    style H fill:#e6ccff
```

---

## 📊 Diagrama de Dependencias

```mermaid
graph TD
    A[Interfaces Layer] --> B[Application Layer]
    B --> C[Domain Layer]
    D[Infrastructure Layer] --> C
    A --> D

    style C fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style A fill:#9C27B0,color:#fff
    style D fill:#FF9800,color:#fff
```

**Regla de Dependencia:** Las flechas apuntan hacia adentro (hacia el dominio)

---

## 🔀 Diagrama de Casos de Uso

```mermaid
graph TB
    User((Usuario))

    subgraph "Sistema Auth Service"
        UC1[Registrar Usuario]
        UC2[Iniciar Sesión]
        UC3[Obtener Usuario]
    end

    User --> UC1
    User --> UC2
    User --> UC3

    UC1 --> DB[(MySQL)]
    UC2 --> DB
    UC3 --> DB

    style User fill:#ff6b6b
    style UC1 fill:#4ecdc4
    style UC2 fill:#4ecdc4
    style UC3 fill:#4ecdc4
    style DB fill:#ffe66d
```

---

## 🏛️ Principios de Clean Architecture

### 1. **Capa de Dominio (Domain Layer)**

**Responsabilidad:** Lógica de negocio pura, independiente de frameworks y tecnologías.

**Contenido:**

- **Entidades** (`entities/`): Modelos de datos del negocio
  - `User.ts`: Define la entidad User y sus DTOs
- **Interfaces de Repositorios** (`repositories/`): Contratos para acceso a datos
  - `UserRepository.ts`: Define operaciones CRUD sin implementación

**Características:**

- ✅ No tiene dependencias externas
- ✅ No conoce detalles de implementación
- ✅ Código reutilizable y testeable
- ✅ Reglas de negocio centralizadas

---

### 2. **Capa de Aplicación (Application Layer)**

**Responsabilidad:** Casos de uso y orquestación de la lógica de negocio.

**Contenido:**

- **Casos de Uso** (`use-cases/`): Flujos específicos de la aplicación
  - `CreateUserUseCase.ts`: Crear usuario con validaciones
  - `LoginUserUseCase.ts`: Autenticación y generación de JWT
  - `GetUserUseCase.ts`: Obtener información de usuario

**Características:**

- ✅ Orquesta entidades del dominio
- ✅ Implementa reglas de negocio específicas
- ✅ Depende solo de la capa de dominio
- ✅ Independiente de frameworks

**Ejemplo de flujo:**

```typescript
// CreateUserUseCase coordina:
1. Validar email único (UserRepository)
2. Hashear contraseña (bcrypt)
3. Crear usuario (UserRepository)
4. Retornar usuario creado
```

---

### 3. **Capa de Infraestructura (Infrastructure Layer)**

**Responsabilidad:** Implementaciones concretas de tecnologías y frameworks.

**Contenido:**

- **Database** (`database/`): Conexión y configuración de MySQL
  - `DatabaseConnection.ts`: Singleton para pool de conexiones
- **Repositories** (`repositories/`): Implementación de interfaces del dominio
  - `MySQLUserRepository.ts`: Implementa UserRepository con MySQL
- **App** (`App.ts`): Configuración de Express, middlewares, rutas
- **Server** (`server.ts`): Punto de entrada de la aplicación

**Características:**

- ✅ Implementa interfaces del dominio
- ✅ Maneja detalles técnicos (DB, HTTP, etc.)
- ✅ Puede ser reemplazada sin afectar el negocio
- ✅ Contiene configuración específica

**Ejemplo:**

```typescript
// MySQLUserRepository implementa UserRepository
class MySQLUserRepository implements UserRepository {
  async create(userData: CreateUserDTO): Promise<User> {
    // Implementación específica con MySQL
  }
}
```

---

### 4. **Capa de Interfaces (Interfaces Layer)**

**Responsabilidad:** Entrada/salida del sistema (HTTP, CLI, WebSockets, etc.).

**Contenido:**

- **Controllers** (`controllers/`): Manejan requests HTTP
  - `UserController.ts`: Endpoints de usuarios
- **Routes** (`routes/`): Definición de rutas Express
  - `userRoutes.ts`: Rutas de `/api/users/*`
  - `index.ts`: Agrupación de todas las rutas

**Características:**

- ✅ Adapta requests externos a casos de uso
- ✅ Maneja validación de entrada
- ✅ Formatea respuestas
- ✅ Gestiona códigos HTTP

**Flujo de una petición:**

```
HTTP Request → Route → Controller → Use Case → Repository → Database
                  ↓
              Response
```

---

## 🔄 Flujo de Datos

### Ejemplo: Registro de Usuario

```mermaid
flowchart TD
    A[Cliente: POST /api/users/register] --> B[Express Router]
    B --> C[UserController.register]
    C --> D{Validar entrada}
    D -->|Válido| E[CreateUserUseCase.execute]
    D -->|Inválido| F[400 Bad Request]
    E --> G[Verificar email único]
    G --> H{Email existe?}
    H -->|Sí| I[409 Conflict]
    H -->|No| J[Hashear contraseña]
    J --> K[UserRepository.create]
    K --> L[(MySQL INSERT)]
    L --> M[Retornar User]
    M --> N[Formatear respuesta]
    N --> O[201 Created]

    style A fill:#e3f2fd
    style E fill:#fff9c4
    style K fill:#c8e6c9
    style L fill:#ffccbc
    style O fill:#c5e1a5
```

---

## 🎯 Ventajas de esta Arquitectura

### 1. **Separación de Responsabilidades**

Cada capa tiene una responsabilidad clara y única.

### 2. **Testabilidad**

- Casos de uso pueden testearse sin base de datos
- Repositories pueden mockearse fácilmente
- Lógica de negocio aislada

### 3. **Mantenibilidad**

- Cambios en una capa no afectan otras
- Fácil de entender y navegar
- Código organizado por conceptos

### 4. **Escalabilidad**

- Fácil agregar nuevos casos de uso
- Fácil cambiar de tecnologías
- Fácil agregar nuevas interfaces (GraphQL, CLI, etc.)

### 5. **Independencia de Frameworks**

- La lógica de negocio no depende de Express
- Fácil migrar a otro framework
- Testeable sin servidor HTTP

---

## 🔀 Dependency Injection

```mermaid
graph LR
    A[userRoutes.ts] -->|crea| B[MySQLUserRepository]
    A -->|inyecta| C[CreateUserUseCase]
    B -->|inyectado en| C
    A -->|inyecta| D[UserController]
    C -->|inyectado en| D

    style A fill:#bbdefb
    style B fill:#c8e6c9
    style C fill:#fff9c4
    style D fill:#f8bbd0
```

El proyecto usa inyección de dependencias manual:

```typescript
// En userRoutes.ts
const userRepository = new MySQLUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const userController = new UserController(createUserUseCase, ...);
```

**Ventajas:**

- Los casos de uso reciben dependencias como parámetros
- Fácil sustituir implementaciones
- Facilita testing con mocks

---

## 🧪 Testing Strategy

```mermaid
graph TB
    subgraph Tests
        A[CreateUserUseCase.test.ts]
        B[Mock UserRepository]
    end

    subgraph Production
        C[CreateUserUseCase]
        D[MySQLUserRepository]
    end

    A -.usa.-> B
    A -.prueba.-> C
    C -.usa en prod.-> D

    style A fill:#e1bee7
    style B fill:#ffccbc
    style C fill:#fff9c4
    style D fill:#c8e6c9
```

```typescript
// Test de CreateUserUseCase
const mockRepository: UserRepository = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  // ...
};

const useCase = new CreateUserUseCase(mockRepository);
// Testear sin base de datos real
```

---

## 🚀 Extender la Arquitectura

### Agregar un nuevo caso de uso:

```mermaid
flowchart LR
    A[1. Crear UseCase] --> B[2. Actualizar Controller]
    B --> C[3. Agregar Route]
    C --> D{Necesita nuevo<br/>método en repo?}
    D -->|Sí| E[4. Actualizar Repository]
    D -->|No| F[Listo!]
    E --> F

    style A fill:#fff9c4
    style B fill:#f8bbd0
    style C fill:#b2dfdb
    style E fill:#c8e6c9
    style F fill:#c5e1a5
```

### Cambiar de MySQL a PostgreSQL:

```mermaid
flowchart TD
    A[1. Crear PostgreSQLUserRepository] --> B[2. Implementar UserRepository interface]
    B --> C[3. Actualizar inyección en routes]
    C --> D[UseCases no cambian!]

    style A fill:#b2dfdb
    style B fill:#c8e6c9
    style C fill:#a5d6a7
    style D fill:#81c784
```

1. Crear `PostgreSQLUserRepository.ts` en `infrastructure/repositories/`
2. Implementar la interfaz `UserRepository`
3. Actualizar la inyección en `userRoutes.ts`
4. ¡Listo! Los casos de uso no cambian

---

## 📊 Diagrama de Clases

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string password
        +string name
        +Date createdAt
        +Date updatedAt
    }

    class UserRepository {
        <<interface>>
        +create(userData) User
        +findById(id) User|null
        +findByEmail(email) User|null
        +update(id, userData) User|null
        +delete(id) boolean
        +findAll() User[]
    }

    class MySQLUserRepository {
        -Pool db
        +create(userData) User
        +findById(id) User|null
        +findByEmail(email) User|null
        +update(id, userData) User|null
        +delete(id) boolean
        +findAll() User[]
        -mapRowToUser(row) User
    }

    class CreateUserUseCase {
        -UserRepository repository
        +execute(userData) User
    }

    class UserController {
        -CreateUserUseCase createUserUseCase
        -LoginUserUseCase loginUserUseCase
        -GetUserUseCase getUserUseCase
        +register(req, res) void
        +login(req, res) void
        +getUser(req, res) void
    }

    UserRepository <|.. MySQLUserRepository : implements
    CreateUserUseCase --> UserRepository : uses
    UserController --> CreateUserUseCase : uses
    MySQLUserRepository ..> User : creates
    CreateUserUseCase ..> User : returns
```

---

## 📚 Recursos Adicionales

- **Clean Architecture** by Robert C. Martin
- **Domain-Driven Design** by Eric Evans
- **SOLID Principles**
- **Dependency Inversion Principle**

---

## 🎓 Conceptos Clave

| Concepto                  | Descripción                       |
| ------------------------- | --------------------------------- |
| **Entity**                | Objeto con identidad única (User) |
| **Use Case**              | Acción específica del sistema     |
| **Repository**            | Abstracción para acceso a datos   |
| **DTO**                   | Data Transfer Object              |
| **Dependency Injection**  | Proveer dependencias externamente |
| **Interface Segregation** | Interfaces específicas y pequeñas |
