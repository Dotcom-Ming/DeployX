import { FastifyInstance } from 'fastify';
import { DomainsService } from './domains.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function domainsRoutes(app: FastifyInstance) {
  const domainsService = new DomainsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/projects/:id/domains', {
      preHandler: [app.requirePermission('domain:view')],
      handler: async (request) => {
        const { id } = request.params as any;
        return domainsService.list(id);
      },
    });

    scope.post('/orgs/:slug/projects/:id/domains', {
      preHandler: [app.requirePermission('domain:create')],
      handler: async (request, reply) => {
        const { id } = request.params as any;
        const body = request.body as any;
        const data = (await import('./dto/add-domain.dto')).addDomainSchema.parse(body);
        const result = await domainsService.add(id, data.domain);
        await request.auditLog('domain.add', `project:${id}:domain:${result.id}`, { domain: data.domain });
        reply.code(201);
        return result;
      },
    });

    scope.delete('/orgs/:slug/projects/:id/domains/:domainId', {
      preHandler: [app.requirePermission('domain:delete')],
      handler: async (request, reply) => {
        const { domainId, id } = request.params as any;
        await request.auditLog('domain.remove', `project:${id}:domain:${domainId}`);
        reply.code(200);
        return domainsService.remove(domainId);
      },
    });

    scope.post('/orgs/:slug/projects/:id/domains/:domainId/verify', {
      preHandler: [app.requirePermission('domain:edit')],
      handler: async (request, reply) => {
        const { domainId, id } = request.params as any;
        const result = await domainsService.verifyDns(domainId);
        await request.auditLog('domain.verify', `project:${id}:domain:${domainId}`, { verified: result.verified });
        reply.code(200);
        return result;
      },
    });
  });
}
