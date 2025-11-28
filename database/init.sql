-- Script para inicializar la base de datos MySQL
-- Ejecutar este script en tu servidor MySQL

CREATE DATABASE IF NOT EXISTS auth_service_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

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

-- Verificar la tabla creada
DESCRIBE users;

-- Ejemplo de inserción (opcional - para pruebas)
-- INSERT INTO users (email, password, name) VALUES ('test@example.com', 'hashedpassword', 'Test User');
