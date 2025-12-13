/**
 * DTOs para los diferentes tipos de eventos del sistema
 * Principio: Single Responsibility - Cada DTO tiene un propósito específico
 */

/**
 * Tipos de eventos disponibles en el sistema
 */
export enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN_SUCCESS = 'user.login.success',
  USER_LOGIN_FAILED = 'user.login.failed',
  USER_LOGOUT = 'user.logout',
  USER_PASSWORD_CHANGED = 'user.password.changed',
  USER_EMAIL_CHANGED = 'user.email.changed',
  USER_DELETED = 'user.deleted',

  // Security Events
  LOGIN_SUSPICIOUS = 'security.login.suspicious',
  LOGIN_FAILED_MULTIPLE = 'security.login.failed.multiple',
  SESSION_INVALIDATED = 'security.session.invalidated',
  SESSION_INVALIDATED_ALL = 'security.sessions.invalidated.all',

  // Verification Events
  EMAIL_VERIFICATION_REQUIRED = 'email.verification.required',
  EMAIL_VERIFIED = 'email.verified',
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',
  PASSWORD_RESET_COMPLETED = 'password.reset.completed',
}

/**
 * Metadata común para todos los eventos
 */
export interface EventMetadata {
  ip?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * Evento: Usuario registrado
 */
export interface UserRegisteredEventData {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
}

/**
 * Evento: Login exitoso
 */
export interface UserLoginSuccessEventData {
  userId: string;
  email: string;
  sessionId: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Evento: Login fallido
 */
export interface UserLoginFailedEventData {
  email: string;
  reason: 'invalid_credentials' | 'user_not_found' | 'account_locked';
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Evento: Usuario cerró sesión
 */
export interface UserLogoutEventData {
  userId: string;
  email: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * Evento: Cambio de contraseña
 */
export interface PasswordChangedEventData {
  userId: string;
  email: string;
  ip: string;
  timestamp: Date;
}

/**
 * Evento: Login sospechoso
 */
export interface LoginSuspiciousEventData {
  userId: string;
  email: string;
  ip: string;
  location?: string;
  device?: string;
  reason: 'new_ip' | 'new_location' | 'new_device' | 'unusual_time';
  timestamp: Date;
}

/**
 * Evento: Múltiples intentos fallidos de login
 */
export interface LoginFailedMultipleEventData {
  email?: string;
  userId?: string;
  ip: string;
  attempts: number;
  timeWindow: string; // ej: "5min", "1hour"
  timestamp: Date;
}

/**
 * Evento: Verificación de email requerida
 */
export interface EmailVerificationRequiredEventData {
  userId: string;
  email: string;
  verificationToken: string;
  expiresAt: Date;
}

/**
 * Evento: Email verificado
 */
export interface EmailVerifiedEventData {
  userId: string;
  email: string;
  verifiedAt: Date;
}

/**
 * Evento: Reset de contraseña solicitado
 */
export interface PasswordResetRequestedEventData {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: Date;
  requestIp: string;
}

/**
 * Evento: Reset de contraseña completado
 */
export interface PasswordResetCompletedEventData {
  userId: string;
  email: string;
  completedAt: Date;
  ip: string;
}

/**
 * Evento: Cambio de email
 */
export interface EmailChangedEventData {
  userId: string;
  oldEmail: string;
  newEmail: string;
  verificationToken: string;
  timestamp: Date;
}

/**
 * Evento: Sesión invalidada
 */
export interface SessionInvalidatedEventData {
  userId: string;
  sessionId: string;
  reason: 'logout' | 'expired' | 'security' | 'manual';
  timestamp: Date;
}

/**
 * Evento: Todas las sesiones invalidadas
 */
export interface AllSessionsInvalidatedEventData {
  userId: string;
  email: string;
  sessionCount: number;
  reason: 'user_request' | 'security' | 'password_change';
  timestamp: Date;
}

/**
 * Evento: Usuario eliminado
 */
export interface UserDeletedEventData {
  userId: string;
  email: string;
  deletedAt: Date;
  reason?: string;
}
