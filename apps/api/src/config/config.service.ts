export class ConfigService {
  get port() { return parseInt(process.env.PORT || '3006', 10); }
  get nodeEnv() { return process.env.NODE_ENV || 'development'; }
  get databaseUrl() { return process.env.DATABASE_URL || ''; }
  get jwtSecret() { return process.env.JWT_SECRET || 'default-jwt-secret'; }
  get jwtRefreshSecret() { return process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'; }
  get redisHost() { return process.env.REDIS_HOST || 'localhost'; }
  get redisPort() { return parseInt(process.env.REDIS_PORT || '6379', 10); }
  get githubClientId() { return process.env.GITHUB_CLIENT_ID || ''; }
  get githubClientSecret() { return process.env.GITHUB_CLIENT_SECRET || ''; }
  get githubCallbackUrl() { return process.env.GITHUB_CALLBACK_URL || ''; }
  get gitlabClientId() { return process.env.GITLAB_CLIENT_ID || ''; }
  get gitlabClientSecret() { return process.env.GITLAB_CLIENT_SECRET || ''; }
  get gitlabCallbackUrl() { return process.env.GITLAB_CALLBACK_URL || ''; }
  get googleClientId() { return process.env.GOOGLE_CLIENT_ID || ''; }
  get googleClientSecret() { return process.env.GOOGLE_CLIENT_SECRET || ''; }
  get googleCallbackUrl() { return process.env.GOOGLE_CALLBACK_URL || ''; }
  get encryptionKey() { return process.env.ENCRYPTION_KEY || ''; }
  get isDevelopment() { return this.nodeEnv === 'development'; }
  get isProduction() { return this.nodeEnv === 'production'; }
}
