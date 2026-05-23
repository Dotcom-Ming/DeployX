import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class LogStreamService {
  private readonly logger = new Logger(LogStreamService.name);
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
        this.logger.warn('Redis connection failed, log streaming disabled');
      }
    }
  }

  async emitLog(
    deploymentId: string,
    line: string,
    level: 'info' | 'warn' | 'error' = 'info',
  ): Promise<void> {
    if (!this.redis) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      deploymentId,
      level,
      line,
    };

    const key = `deployx:logs:${deploymentId}`;

    try {
      await this.redis.rpush(key, JSON.stringify(logEntry));
      await this.redis.expire(key, 86400 * 7); // 7 days TTL

      // Also publish for real-time streaming
      await this.redis.publish(
        `deployx:logs:stream:${deploymentId}`,
        JSON.stringify(logEntry),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit log for ${deploymentId}: ${(error as Error).message}`,
      );
    }
  }

  async getLogs(
    deploymentId: string,
    start = 0,
    end = -1,
  ): Promise<Array<{ timestamp: string; deploymentId: string; level: string; line: string }>> {
    if (!this.redis) return [];
    const key = `deployx:logs:${deploymentId}`;
    const logs = await this.redis.lrange(key, start, end);
    return logs.map((log) => JSON.parse(log));
  }

  async getLogCount(deploymentId: string): Promise<number> {
    if (!this.redis) return 0;
    const key = `deployx:logs:${deploymentId}`;
    return this.redis.llen(key);
  }
}
