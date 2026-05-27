import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';
import { PrismaClient } from '@deployx/database';
import { ConfigService } from './config/config.service';
import { adminRoutes } from './modules/admin/admin.routes';
import { usersRoutes } from './modules/users/users.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { apiTokensRoutes } from './modules/api-tokens/api-tokens.routes';
import { envVariablesRoutes } from './modules/env-variables/env-variables.routes';
import { gitReposRoutes } from './modules/git-repos/git-repos.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { domainsRoutes } from './modules/domains/domains.routes';
import { organizationsRoutes } from './modules/organizations/organizations.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { gitWebhooksRoutes } from './modules/git-webhooks/git-webhooks.routes';
import { deploymentsRoutes } from './modules/deployments/deployments.routes';
import { logsRoutes } from './modules/deployments/logs.routes';
import { UsageAggregationService } from './modules/billing/usage-aggregation.service';
import permissionGuardPlugin from './common/guards/permission.guard';
import auditPlugin from './modules/audit/audit.plugin';

async function bootstrap() {
  const app = Fastify({ logger: true });
  const config = new ConfigService();

  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') || true });
  await app.register(fastifyJwt, { secret: config.jwtSecret });
  await app.register(fastifyMultipart);
  await app.register(fastifyWebsocket);

  if (config.isDevelopment) {
    await app.register(fastifySwagger, { openapi: { info: { title: 'DeployX API', version: '1.0' } } });
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
  }

  // Decorate with prisma
  const prisma = new PrismaClient();
  app.decorate('prisma', prisma);

  // Register permission guard and audit plugin
  await app.register(permissionGuardPlugin);
  await app.register(auditPlugin);

  // All API routes under /api prefix
  await app.register(async function (apiScope) {
    await apiScope.register(adminRoutes);
    await apiScope.register(usersRoutes);
    await apiScope.register(analyticsRoutes);
    await apiScope.register(apiTokensRoutes);
    await apiScope.register(envVariablesRoutes);
    await apiScope.register(gitReposRoutes);
    await apiScope.register(notificationsRoutes);
    await apiScope.register(domainsRoutes);
    await apiScope.register(organizationsRoutes);
    await apiScope.register(projectsRoutes);
    await apiScope.register(authRoutes);
    await apiScope.register(billingRoutes);
    await apiScope.register(gitWebhooksRoutes);
    await apiScope.register(deploymentsRoutes);
    await apiScope.register(logsRoutes);
  }, { prefix: '/api' });

  // Start background jobs
  new UsageAggregationService().start();

  // Error handler
  app.setErrorHandler((error: any, req, reply) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      message: error.message || 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  });

  const port = config.port;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`DeployX API Service running on port ${port}`);
}

bootstrap().catch(console.error);
