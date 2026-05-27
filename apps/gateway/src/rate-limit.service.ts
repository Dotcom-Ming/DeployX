import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  global: { windowMs: 60 * 1000, maxRequests: 300, keyPrefix: 'rl:global' },
  perDomain: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'rl:domain' },
  perIp: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'rl:ip' },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'rl:auth' },
  api: { windowMs: 60 * 1000, maxRequests: 120, keyPrefix: 'rl:api' },
};

export class RateLimitService {
  private readonly redis: Redis | null = null;

  constructor() {
    if (process.env.REDIS_ENABLED !== 'false') {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null,
        });
      } catch {
        console.warn('Redis connection failed, rate limiting disabled');
      }
    }
  }

  async checkLimit(
    identifier: string,
    configName: string = 'perIp',
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      return { allowed: true, limit: Infinity, remaining: Infinity, resetAt: Date.now() + 60000 };
    }

    const config = DEFAULT_CONFIGS[configName] || DEFAULT_CONFIGS.perIp;
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (now % config.windowMs);
    const resetAt = windowStart + config.windowMs;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.pexpire(key, config.windowMs);
      }

      const allowed = current <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - current);

      return {
        allowed,
        limit: config.maxRequests,
        remaining,
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
      };
    } catch {
      return { allowed: true, limit: config.maxRequests, remaining: config.maxRequests, resetAt };
    }
  }

  async checkSlidingWindow(
    identifier: string,
    configName: string = 'perIp',
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      return { allowed: true, limit: Infinity, remaining: Infinity, resetAt: Date.now() + 60000 };
    }

    const config = DEFAULT_CONFIGS[configName] || DEFAULT_CONFIGS.perIp;
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).slice(2, 8)}`);
      pipeline.zcard(key);
      pipeline.pexpire(key, config.windowMs * 2);
      const results = await pipeline.exec();

      const count = results?.[2]?.[1] as number || 0;
      const allowed = count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count);
      const resetAt = now + config.windowMs;

      return {
        allowed,
        limit: config.maxRequests,
        remaining,
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      };
    } catch {
      const nowFallback = Date.now();
      return { allowed: true, limit: config.maxRequests, remaining: config.maxRequests, resetAt: nowFallback + config.windowMs };
    }
  }

  async reset(identifier: string, configName: string = 'perIp'): Promise<void> {
    if (!this.redis) return;
    const config = DEFAULT_CONFIGS[configName] || DEFAULT_CONFIGS.perIp;
    const key = `${config.keyPrefix}:${identifier}`;
    await this.redis.del(key);
  }

  getHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
    };
  }
}
