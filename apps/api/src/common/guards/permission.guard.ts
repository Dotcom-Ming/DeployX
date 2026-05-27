import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CasbinEnforcer } from '@deployx/auth';
import { prisma } from '@deployx/database';
import { AbacService } from './abac.service';

async function permissionGuardPlugin(app: FastifyInstance) {
  const enforcer = new CasbinEnforcer();
  await enforcer.init();

  const abacService = new AbacService();

  app.decorate('requirePermission', function (permission: string) {
    const [obj, act] = permission.split(':') as [string, string];

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as { sub: string; orgId?: string; role?: string } | undefined;

      if (!user) {
        reply.status(401).send({ success: false, message: 'Authentication required', statusCode: 401 });
        return;
      }

      let role = user.role?.toLowerCase();
      let orgId = user.orgId;

      const slug = (request.params as any)?.slug;
      if (slug && slug !== orgId) {
        const org = await prisma.organization.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (org) {
          orgId = org.id;
          const membership = await prisma.membership.findUnique({
            where: { userId_orgId: { userId: user.sub, orgId } },
            select: { role: true },
          });
          if (membership) {
            role = membership.role.toLowerCase();
          } else {
            reply.status(403).send({ success: false, message: 'You do not have access to this organization', statusCode: 403 });
            return;
          }
        }
      }

      if (!role || !orgId) {
        reply.status(403).send({ success: false, message: 'Insufficient permissions', statusCode: 403 });
        return;
      }

      const allowed = await enforcer.enforce(role, orgId, obj, act);
      if (!allowed) {
        reply.status(403).send({ success: false, message: `Permission denied: ${permission}`, statusCode: 403 });
        return;
      }

      const resourceId = (request.params as any)?.id || (request.params as any)?.did;
      if (resourceId && role !== 'owner' && role !== 'admin') {
        const resourceAccess = await abacService.enforceResourceAccess(
          user.sub,
          orgId,
          obj,
          act,
          resourceId,
        );
        if (!resourceAccess) {
          reply.status(403).send({ success: false, message: `Resource access denied: ${permission}`, statusCode: 403 });
          return;
        }
      }
    };
  });
}

export default fp(permissionGuardPlugin, {
  name: 'permission-guard',
  fastify: '5.x',
});

declare module 'fastify' {
  interface FastifyInstance {
    requirePermission(permission: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
