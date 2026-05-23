import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get port(): number {
    return parseInt(process.env.PORT || '3001', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || 'postgresql://deployx:deployx@localhost:5432/deployx?schema=public';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'default-jwt-secret';
  }

  get jwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || 'localhost';
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || '6379', 10);
  }

  get githubClientId(): string {
    return process.env.GITHUB_CLIENT_ID || '';
  }

  get githubClientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET || '';
  }

  get githubCallbackUrl(): string {
    return process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/oauth/github/callback';
  }

  get gitlabClientId(): string {
    return process.env.GITLAB_CLIENT_ID || '';
  }

  get gitlabClientSecret(): string {
    return process.env.GITLAB_CLIENT_SECRET || '';
  }

  get gitlabCallbackUrl(): string {
    return process.env.GITLAB_CALLBACK_URL || 'http://localhost:3001/auth/oauth/gitlab/callback';
  }

  get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  get googleCallbackUrl(): string {
    return process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/oauth/google/callback';
  }

  get encryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'default-32-byte-encryption-key!!';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
