import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { AuditService } from './audit.service';
import { PrismaClient } from '@deployx/database';

async function auditPlugin(app: FastifyInstance) {
  const prisma = (app as any).prisma || new PrismaClient();
  const auditService = new AuditService(prisma);

  app.decorateRequest('auditLog', function (this: FastifyRequest, action: string, resource: string, metadata?: Record<string, unknown>) {
    const user = (this as any).user as { sub: string; orgId?: string } | undefined;

    return auditService.logAction({
      orgId: user?.orgId || '',
      userId: user?.sub || 'anonymous',
      action,
      resource,
      metadata,
      ip: this.ip,
    });
  });
}

export default fp(auditPlugin, {
  name: 'audit-log',
  fastify: '5.x',
  dependencies: ['@fastify/jwt'],
});

declare module 'fastify' {
  interface FastifyRequest {
    auditLog(action: string, resource: string, metadata?: Record<string, unknown>): Promise<any>;
  }
}
