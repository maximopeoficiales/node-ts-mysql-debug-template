export interface SessionData {
  userId: number;
  email: string;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionRepository {
  save(token: string, data: SessionData, expiresIn: number): Promise<void>;
  get(token: string): Promise<SessionData | null>;
  delete(token: string): Promise<boolean>;
  exists(token: string): Promise<boolean>;
}
