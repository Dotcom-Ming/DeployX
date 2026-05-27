import Redis from 'ioredis';

export class OAuthStateService {
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
        });
      } catch {
        console.warn('Redis connection failed, OAuth state will not persist');
      }
    }
  }

  async storeState(state: string, metadata: Record<string, unknown> = {}): Promise<void> {
    if (!this.redis) return;
    const key = `deployx:oauth:state:${state}`;
    await this.redis.set(key, JSON.stringify(metadata), 'EX', 600);
  }

  async consumeState(state: string): Promise<Record<string, unknown> | null> {
    if (!this.redis) return {};
    const key = `deployx:oauth:state:${state}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    await this.redis.del(key);
    return JSON.parse(data);
  }
}
