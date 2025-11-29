import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Validar que una variable de entorno exista
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return value;
}

/**
 * Validar y obtener variable numérica
 */
function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return parsed;
}

/**
 * Configuración centralizada de variables de entorno
 */
export const config = {
  // Server
  server: {
    port: getEnvNumber('PORT', 3000),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
    isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
  },

  // Database (PostgreSQL con Prisma)
  database: {
    url: getEnvVar(
      'DATABASE_URL',
      'postgresql://authuser:authpass@localhost:5432/auth_service_db?schema=public'
    ),
  },

  // JWT
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'your-secret-key-change-this-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '1h'),
  },

  // Redis
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: getEnvVar('REDIS_PASSWORD', ''),
    cacheTTL: getEnvNumber('CACHE_TTL', 3600),
  },

  // DynamoDB
  dynamodb: {
    region: getEnvVar('AWS_REGION', 'us-east-1'),
    endpoint: getEnvVar('DYNAMODB_ENDPOINT', 'http://localhost:4567'),
    sessionsTable: getEnvVar('DYNAMODB_SESSIONS_TABLE', 'auth-sessions'),
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', 'test'),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', 'test'),
  },

  // Rate Limiting
  rateLimit: {
    // Registro: 3 por hora
    register: {
      points: getEnvNumber('RATE_LIMIT_REGISTER_POINTS', 3),
      duration: getEnvNumber('RATE_LIMIT_REGISTER_DURATION', 3600),
    },
    // Login fallido: 5 por 15 minutos
    login: {
      points: getEnvNumber('RATE_LIMIT_LOGIN_POINTS', 5),
      duration: getEnvNumber('RATE_LIMIT_LOGIN_DURATION', 900),
    },
    // General: 100 por hora
    general: {
      points: getEnvNumber('RATE_LIMIT_GENERAL_POINTS', 100),
      duration: getEnvNumber('RATE_LIMIT_GENERAL_DURATION', 3600),
    },
    // Moderado: 300 por 15 minutos
    moderate: {
      points: getEnvNumber('RATE_LIMIT_MODERATE_POINTS', 300),
      duration: getEnvNumber('RATE_LIMIT_MODERATE_DURATION', 900),
    },
    // Estricto: 10 por hora
    strict: {
      points: getEnvNumber('RATE_LIMIT_STRICT_POINTS', 10),
      duration: getEnvNumber('RATE_LIMIT_STRICT_DURATION', 3600),
    },
  },

  // Performance
  performance: {
    slowRequestThreshold: getEnvNumber('SLOW_REQUEST_THRESHOLD', 1000),
  },
} as const;

/**
 * Validar configuración al inicio
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Validar JWT secret en producción
  if (
    config.server.isProduction &&
    config.jwt.secret === 'your-secret-key-change-this-in-production'
  ) {
    errors.push('JWT_SECRET must be changed in production');
  }

  // Validar DATABASE_URL si es necesario
  if (!config.database.url && config.server.isProduction) {
    errors.push('DATABASE_URL is required in production');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation errors:');
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Invalid configuration');
  }

  console.log('✅ Configuration validated successfully');
}

/**
 * Mostrar configuración (sin datos sensibles)
 */
export function logConfig(): void {
  console.log('\n📋 Configuration:');
  console.log(`  Environment: ${config.server.nodeEnv}`);
  console.log(`  Port: ${config.server.port}`);
  console.log(`  Database: PostgreSQL (Prisma ORM)`);
  console.log(`  Redis: ${config.redis.host}:${config.redis.port}`);
  console.log(`  DynamoDB: ${config.dynamodb.endpoint}`);
  console.log(`  JWT Expires: ${config.jwt.expiresIn}`);
  console.log('');
}

export default config;
