# 🐛 Guía de Debugging en VS Code

Este proyecto está completamente configurado para debugging en Visual Studio Code.

## 🎯 Configuración de Debug

El archivo `.vscode/launch.json` incluye dos configuraciones:

### 1. Debug TypeScript (Principal)

Ejecuta el servidor completo en modo debug.

### 2. Debug Current File

Ejecuta solo el archivo TypeScript actual.

## 🚀 Cómo Hacer Debug

### Método 1: F5 (Recomendado)

1. **Abre VS Code** en el proyecto
2. **Presiona F5**
3. Selecciona "Debug TypeScript" si aparece el menú
4. El servidor iniciará en modo debug

### Método 2: Panel de Debug

1. Haz clic en el icono de debug (🐛) en la barra lateral
2. Selecciona "Debug TypeScript" en el dropdown
3. Presiona el botón play verde ▶️

### Método 3: Menú

- Ve a **Run > Start Debugging** (F5)

## 🔴 Colocar Breakpoints

1. **Abre un archivo** TypeScript (ej: `UserController.ts`)
2. **Haz clic** en el margen izquierdo junto al número de línea
3. Aparecerá un **punto rojo** 🔴
4. Cuando el código llegue a esa línea, **se detendrá**

### Ejemplo: Debug de Registro de Usuario

```typescript
// src/interfaces/controllers/UserController.ts

async register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;  // 🔴 Breakpoint aquí

    if (!email || !password || !name) {         // 🔴 O aquí
      res.status(400).json({ error: 'Email, password and name are required' });
      return;
    }

    const user = await this.createUserUseCase.execute({ email, password, name });  // 🔴 O aquí

    const { password: _, ...userResponse } = user;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
    });
  } catch (error) {
    // ...
  }
}
```

## 🎮 Controles de Debug

| Acción        | Atajo           | Descripción                                     |
| ------------- | --------------- | ----------------------------------------------- |
| **Continue**  | `F5`            | Continuar hasta el siguiente breakpoint         |
| **Step Over** | `F10`           | Ejecutar la línea actual y pasar a la siguiente |
| **Step Into** | `F11`           | Entrar en la función/método                     |
| **Step Out**  | `Shift+F11`     | Salir de la función actual                      |
| **Restart**   | `Ctrl+Shift+F5` | Reiniciar el debug                              |
| **Stop**      | `Shift+F5`      | Detener el debugging                            |

## 📊 Paneles de Debug

### 1. Variables

Muestra todas las variables en el scope actual:

- Locales
- Globales
- Closure

### 2. Watch

Agrega expresiones para monitorear:

```
user.email
req.body
process.env.PORT
```

### 3. Call Stack

Muestra la pila de llamadas:

```
register (UserController.ts:23)
  ↑
express router
  ↑
main (server.ts:5)
```

### 4. Breakpoints

Lista todos los breakpoints activos.

## 💡 Técnicas Avanzadas

### Conditional Breakpoints

Haz clic derecho en un breakpoint → "Edit Breakpoint" → "Expression"

```javascript
email === 'test@example.com';
userId > 10;
req.method === 'POST';
```

### Logpoints

En lugar de detener, imprime en consola:

```javascript
User: {email}
Request from {req.ip}
```

### Debug Console

Evalúa expresiones mientras está pausado:

```javascript
> user
> email.includes('@')
> JSON.stringify(req.body)
```

## 🧪 Debug de Casos de Uso

### Ejemplo: Debug CreateUserUseCase

```typescript
// src/application/use-cases/CreateUserUseCase.ts

async execute(userData: CreateUserDTO): Promise<User> {
  const existingUser = await this.userRepository.findByEmail(userData.email);  // 🔴

  if (existingUser) {  // 🔴 Inspecciona existingUser
    throw new Error('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);  // 🔴

  const user = await this.userRepository.create({  // 🔴
    ...userData,
    password: hashedPassword,
  });

  return user;  // 🔴 Verifica el resultado
}
```

## 🔍 Debugging de Base de Datos

### Ver Queries SQL

Agrega breakpoints en:

```typescript
// src/infrastructure/repositories/MySQLUserRepository.ts

async create(userData: CreateUserDTO): Promise<User> {
  const query = `INSERT INTO users ...`;  // 🔴 Inspecciona la query

  const [result] = await this.db.execute<ResultSetHeader>(  // 🔴 Ve el resultado
    query,
    [userData.email, userData.password, userData.name]
  );

  return createdUser;
}
```

### Inspeccionar Datos

En el Debug Console:

```javascript
> query
> userData
> result.insertId
```

## 🌐 Debug de Requests HTTP

### 1. Coloca breakpoint en el controller

### 2. Envía request con curl o Postman

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"debug@test.com","password":"test123","name":"Debug User"}'
```

### 3. Inspecciona en VS Code:

- `req.body` - Datos enviados
- `req.headers` - Headers HTTP
- `req.method` - Método HTTP
- `req.path` - Ruta

## 📝 Tips y Trucos

### 1. Debug múltiples archivos

Coloca breakpoints en varios archivos para seguir el flujo:

```
Controller → Use Case → Repository → Database
```

### 2. Usa console.log estratégicamente

```typescript
console.log('🔍 Debugging:', { email, name });
console.log('📊 Data:', JSON.stringify(data, null, 2));
```

### 3. Restart en cambios

Si cambias el código, presiona `Ctrl+Shift+F5` para reiniciar con los cambios.

### 4. Skip Node internals

La configuración `skipFiles` ya está configurada para saltar código interno de Node.js.

## ⚠️ Problemas Comunes

### Breakpoints no funcionan (grises)

**Solución:**

1. Asegúrate de que `sourceMap: true` esté en `tsconfig.json` ✅
2. Reinicia VS Code
3. Verifica que estés en modo debug (F5)

### "Cannot find module"

**Solución:**

1. Ejecuta `npm install`
2. Reinicia VS Code
3. Verifica que `node_modules` exista

### Puerto ocupado

**Solución:**

1. Cambia el puerto en `.env`
2. O detén el proceso que usa el puerto 3000

### Variables no visibles

**Solución:**

- Espera a que la ejecución se pause
- Verifica que estés en el stack frame correcto

## 🎓 Recursos

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [TypeScript Debugging](https://code.visualstudio.com/docs/typescript/typescript-debugging)

## 🎯 Ejercicios de Práctica

### Ejercicio 1: Debug de Registro

1. Coloca breakpoint en `UserController.register`
2. Envía request POST de registro
3. Inspecciona `req.body`
4. Sigue el flujo hasta la DB

### Ejercicio 2: Debug de Error

1. Intenta registrar un email duplicado
2. Coloca breakpoint en el `catch`
3. Inspecciona el `error` object

### Ejercicio 3: Debug de Login

1. Breakpoint en `LoginUserUseCase.execute`
2. Verifica el hash de password
3. Inspecciona el token JWT generado

## ✨ ¡Happy Debugging!

El debugging es una habilidad esencial. Practica regularmente para mejorar tu productividad.
