import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@deployx/database';
import { QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { BuildProcessor } from './build.processor';
import { FrameworkDetector } from './framework-detector';
import { LocalBuilder } from './local-builder';
import { LogStreamService } from './log-stream.service';

async function bootstrap() {
  const app = Fastify({ logger: true });
  await app.register(cors);
  const prisma = new PrismaClient();

  // Setup services
  const frameworkDetector = new FrameworkDetector();
  const localBuilder = new LocalBuilder();
  const logStream = new LogStreamService();
  const buildProcessor = new BuildProcessor(frameworkDetector, localBuilder, logStream);

  // If Redis is enabled, start the BullMQ worker
  if (process.env.REDIS_ENABLED !== 'false') {
    const connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    const worker = new Worker(
      'build',
      async (job) => buildProcessor.process(job),
      { connection }
    );

    console.log('BullMQ build worker started');
  }

  const port = process.env.PORT || 3005;
  await app.listen({ port: Number(port), host: '0.0.0.0' });
  console.log(`DeployX Builder Service running on port ${port}`);
}

bootstrap().catch(console.error);
