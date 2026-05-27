import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@deployx/database';
import { RoutingService } from './routing.service';
import { SslService } from './ssl.service';
import { DomainVerificationService } from './domain-verification.service';
import { TraefikDynamicRoutingService } from './traefik-dynamic-routing.service';
import { RateLimitService } from './rate-limit.service';
import * as http from 'http';
import * as url from 'url';

async function bootstrap() {
  const app = Fastify({ logger: true });
  await app.register(cors);

  const prisma = new PrismaClient();
  const routingService = new RoutingService();
  const sslService = new SslService();
  const domainVerificationService = new DomainVerificationService();
  const traefikRoutingService = new TraefikDynamicRoutingService();
  const rateLimitService = new RateLimitService();

  app.addHook('onRequest', async (request, reply) => {
    const clientIp = request.ip || 'unknown';

    const globalResult = await rateLimitService.checkSlidingWindow(clientIp, 'global');
    if (!globalResult.allowed) {
      const headers = rateLimitService.getHeaders(globalResult);
      Object.entries(headers).forEach(([k, v]) => reply.header(k, v));
      reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Global rate limit exceeded. Please try again later.',
        retryAfter: globalResult.retryAfter,
      });
      return;
    }

    const domainResult = await rateLimitService.checkSlidingWindow(
      `${request.headers.host || 'unknown'}:${clientIp}`,
      'perDomain',
    );

    const rateLimitHeaders = rateLimitService.getHeaders(domainResult);
    Object.entries(rateLimitHeaders).forEach(([k, v]) => reply.header(k, v));

    if (!domainResult.allowed) {
      reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Per-domain rate limit exceeded. Please try again later.',
        retryAfter: domainResult.retryAfter,
      });
      return;
    }
  });

  // Catch-all proxy route
  app.all('/*', async (req, reply) => {
    const host = req.headers.host?.split(':')[0];
    if (!host) {
      return reply.status(400).send({ error: 'Missing Host header' });
    }

    try {
      const route = await routingService.resolveDomain(host);
      if (!route) {
        return reply.status(404).send({
          error: 'Deployment not found',
          message: `No deployment found for domain ${host}`,
        });
      }

      // Proxy request
      const parsedUrl = url.parse(route.deploymentUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      const targetPath = `${parsedUrl.pathname === '/' ? '' : parsedUrl.pathname || ''}${req.url}`;

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : (isHttps ? 443 : 80),
        path: targetPath,
        method: req.method,
        headers: {
          ...req.headers,
          host: parsedUrl.host || parsedUrl.hostname || '',
          'x-forwarded-for': req.ip,
          'x-forwarded-proto': 'https',
          'x-forwarded-host': req.headers.host || '',
          'x-deployx-deployment': 'true',
        } as unknown as Record<string, string>,
      };

      const proxyReq = http.request({ ...options, protocol: isHttps ? 'https:' : 'http:' } as any, (proxyRes) => {
        reply.raw.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(reply.raw, { end: true });
      });

      proxyReq.on('error', (err) => {
        console.error(`Proxy request error: ${err.message}`);
        reply.status(502).send({ error: 'Bad Gateway', message: 'Failed to connect to deployment' });
      });

      // Forward body
      const body = req.body;
      if (body && typeof body === 'object' && Object.keys(body).length > 0) {
        proxyReq.write(JSON.stringify(body));
      }

      req.raw.pipe(proxyReq, { end: true });
    } catch (error) {
      console.error(`Error proxying request for ${host}:`, error);
      reply.status(502).send({ error: 'Bad Gateway', message: 'Failed to connect to deployment' });
    }
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  // Start cron jobs
  domainVerificationService.startCron();

  const port = process.env.PORT || 3004;
  await app.listen({ port: Number(port), host: '0.0.0.0' });
  console.log(`DeployX Gateway Service running on port ${port}`);
}

bootstrap().catch(console.error);
