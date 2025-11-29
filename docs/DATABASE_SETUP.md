# Configuración de MySQL

## Opción 1: Instalación Local (macOS)

### Instalar MySQL con Homebrew

```bash
# Instalar MySQL
brew install mysql

# Iniciar el servicio MySQL
brew services start mysql

# Asegurar la instalación (configurar contraseña root)
mysql_secure_installation
```

### Conectar a MySQL

```bash
mysql -u root -p
```

### Crear la base de datos

```sql
CREATE DATABASE auth_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auth_service_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar
SHOW TABLES;
DESCRIBE users;
```

---

## Opción 2: Docker (Recomendado para desarrollo)

### Crear un contenedor MySQL

```bash
docker run --name mysql-auth-service \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=auth_service_db \
  -p 3306:3306 \
  -d mysql:8.0
```

### Verificar que el contenedor está corriendo

```bash
docker ps
```

### Conectar al contenedor

```bash
docker exec -it mysql-auth-service mysql -u root -p
```

### Detener el contenedor

```bash
docker stop mysql-auth-service
```

### Iniciar el contenedor

```bash
docker start mysql-auth-service
```

### Eliminar el contenedor

```bash
docker rm -f mysql-auth-service
```

---

## Opción 3: Docker Compose

Crea un archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: auth-service-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: auth_service_db
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  mysql_data:
```

Luego ejecuta:

```bash
docker-compose up -d
```

---

## Configurar Variables de Entorno

Edita el archivo `.env` con tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root  # Cambia esto según tu configuración
DB_NAME=auth_service_db
```

---

## Verificar Conexión

Ejecuta el servidor del proyecto:

```bash
npm run dev
```

Si todo está configurado correctamente, verás:

```
✅ Database connected successfully
✅ Database tables initialized
🚀 Server running on port 3000
```

---

## Solución de Problemas

### Error: "Access denied for user"

- Verifica que el usuario y contraseña en `.env` sean correctos
- Asegúrate de que MySQL esté corriendo

### Error: "Unknown database"

- Crea la base de datos manualmente:
  ```sql
  CREATE DATABASE auth_service_db;
  ```

### Error: "connect ECONNREFUSED"

- Verifica que MySQL esté corriendo:
  ```bash
  brew services list  # macOS
  docker ps           # Docker
  ```

### Cambiar contraseña de root en MySQL

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password';
FLUSH PRIVILEGES;
```

---

## Cliente MySQL Recomendado (opcional)

Para gestionar la base de datos visualmente:

- **MySQL Workbench**: https://www.mysql.com/products/workbench/
- **DBeaver**: https://dbeaver.io/
- **TablePlus**: https://tableplus.com/ (macOS)
- **VS Code Extension**: MySQL (formulahendry.mysql)
