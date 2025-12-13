import winston from 'winston';
import { config } from '../../config/environment';
import path from 'path';

/**
 * Logger centralizado usando Winston
 * Proporciona logging estructurado con diferentes niveles y transports
 */
export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!this.instance) {
      const logFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
          let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

          // Agregar metadata si existe
          if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
          }

          // Agregar stack trace si existe
          if (stack) {
            log += `\n${stack}`;
          }

          return log;
        })
      );

      const transports: winston.transport[] = [
        // Console transport con colores
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), logFormat),
        }),
      ];

      // En producción, agregar transports para archivos
      if (config.server.nodeEnv === 'production') {
        const logsDir = path.join(process.cwd(), 'logs');

        transports.push(
          // Errores en archivo separado
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          }),
          // Todos los logs
          new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          })
        );
      }

      this.instance = winston.createLogger({
        level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
        transports,
        // No salir en caso de error de logging
        exitOnError: false,
      });
    }

    return this.instance;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
