import { FastifyInstance } from 'fastify';
import { DeploymentsService } from './deployments.service';
import { jwtOrApiTokenGuard } from '../../common/guards/api-token.guard';

export async function deploymentsRoutes(app: FastifyInstance) {
  const deploymentsService = new DeploymentsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtOrApiTokenGuard);

    scope.get('/orgs/:slug/projects/:id/deployments', {
      preHandler: [app.requirePermission('deployment:read')],
      handler: async (request) => {
        const { id } = request.params as any;
        const { page, pageSize } = request.query as any;
        return deploymentsService.list(id, parseInt(page || '1', 10), parseInt(pageSize || '20', 10));
      },
    });

    scope.post('/orgs/:slug/projects/:id/deployments', {
      preHandler: [app.requirePermission('deployment:create')],
      handler: async (request, reply) => {
        const user = request.user as { sub: string };
        const { id } = request.params as any;
        const body = request.body as any;
        const data = (await import('./dto/create-deployment.dto')).createDeploymentSchema.parse(body);
        const result = await deploymentsService.create(id, user.sub, data);
        await request.auditLog('deployment.trigger', `deployment:${result.id}`, { projectId: id, branch: data.branch, type: data.type });
        reply.code(201);
        return result;
      },
    });

    scope.get('/orgs/:slug/projects/:id/deployments/:did', {
      preHandler: [app.requirePermission('deployment:read')],
      handler: async (request) => {
        const { did } = request.params as any;
        return deploymentsService.get(did);
      },
    });

    scope.post('/orgs/:slug/projects/:id/deployments/:did/cancel', {
      preHandler: [app.requirePermission('deployment:cancel')],
      handler: async (request, reply) => {
        const { did } = request.params as any;
        await request.auditLog('deployment.cancel', `deployment:${did}`);
        reply.code(200);
        return deploymentsService.cancel(did);
      },
    });

    scope.post('/orgs/:slug/projects/:id/deployments/:did/redeploy', {
      preHandler: [app.requirePermission('deployment:create')],
      handler: async (request, reply) => {
        const { did } = request.params as any;
        const result = await deploymentsService.redeploy(did);
        await request.auditLog('deployment.trigger', `deployment:${result.id}`, { redeployedFrom: did });
        reply.code(201);
        return result;
      },
    });

    scope.post('/orgs/:slug/projects/:id/deployments/:did/rollback', {
      preHandler: [app.requirePermission('deployment:rollback')],
      handler: async (request, reply) => {
        const user = request.user as { sub: string };
        const { did } = request.params as any;
        const result = await deploymentsService.rollback(did, user.sub);
        await request.auditLog('deployment.rollback', `deployment:${result.id}`, { rolledBackFrom: did });
        reply.code(201);
        return result;
      },
    });

    scope.post('/orgs/:slug/projects/:id/deployments/:did/promote', {
      preHandler: [app.requirePermission('deployment:promote')],
      handler: async (request, reply) => {
        const user = request.user as { sub: string };
        const { did } = request.params as any;
        const result = await deploymentsService.promote(did, user.sub);
        await request.auditLog('deployment.promote', `deployment:${result.id}`, { promotedFrom: did });
        reply.code(201);
        return result;
      },
    });
  });
}
