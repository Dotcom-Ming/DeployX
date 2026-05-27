import { FastifyInstance } from 'fastify';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import Redis from 'ioredis';

export async function logsRoutes(app: FastifyInstance) {
  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/projects/:id/deployments/:did/logs/stream', { websocket: true }, async (socket, request) => {
      const { did } = request.params as any;
      const user = request.user as { sub: string; orgId?: string };

      if (!did) {
        socket.close(4001, 'Missing deployment ID');
        return;
      }

      if (process.env.REDIS_ENABLED === 'false') {
        socket.close(1011, 'Log streaming requires Redis');
        return;
      }

      let subscriber: Redis | null = null;

      try {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD || undefined;

        subscriber = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });

        await subscriber.connect();

        const channel = `deployx:logs:stream:${did}`;

        await subscriber.subscribe(channel);
        subscriber.on('message', (_ch: string, message: string) => {
          if (socket.readyState === 1) {
            socket.send(message);
          }
        });

        const historicalRedis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });

        await historicalRedis.connect();
        const key = `deployx:logs:${did}`;
        const historicalLogs = await historicalRedis.lrange(key, 0, -1);
        await historicalRedis.quit();

        for (const log of historicalLogs) {
          if (socket.readyState === 1) {
            socket.send(log);
          }
        }

        socket.on('close', async () => {
          if (subscriber) {
            await subscriber.unsubscribe(channel);
            await subscriber.quit();
            subscriber = null;
          }
        });

        socket.on('error', async () => {
          if (subscriber) {
            await subscriber.unsubscribe(channel);
            await subscriber.quit();
            subscriber = null;
          }
        });
      } catch (error) {
        console.error(`WebSocket log stream error for deployment ${did}:`, error);
        if (subscriber) {
          await subscriber.quit().catch(() => {});
        }
        if (socket.readyState === 1) {
          socket.close(1011, 'Internal server error');
        }
      }
    });

    scope.get('/orgs/:slug/projects/:id/deployments/:did/logs', async (request, reply) => {
      if (process.env.REDIS_ENABLED === 'false') {
        return reply.status(503).send({ success: false, message: 'Log retrieval requires Redis' });
      }

      const { did } = request.params as any;
      const { start, end } = request.query as any;

      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
      const redisPassword = process.env.REDIS_PASSWORD || undefined;

      const redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      try {
        await redis.connect();
        const key = `deployx:logs:${did}`;
        const startIndex = start ? parseInt(start, 10) : 0;
        const endIndex = end ? parseInt(end, 10) : -1;

        const [logs, total] = await Promise.all([
          redis.lrange(key, startIndex, endIndex),
          redis.llen(key),
        ]);

        return {
          data: logs.map((log) => JSON.parse(log)),
          pagination: {
            start: startIndex,
            end: endIndex === -1 ? total - 1 : endIndex,
            total,
          },
        };
      } finally {
        await redis.quit();
      }
    });
  });
}
