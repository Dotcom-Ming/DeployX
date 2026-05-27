import { FastifyInstance } from 'fastify';
import { ApiTokensService } from './api-tokens.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function apiTokensRoutes(app: FastifyInstance) {
  const apiTokensService = new ApiTokensService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/users/me/tokens', async (request) => {
      const user = request.user as { sub: string };
      return apiTokensService.list(user.sub);
    });

    scope.post('/users/me/tokens', {
      preHandler: [app.requirePermission('token:create')],
      handler: async (request, reply) => {
        const user = request.user as { sub: string };
        const body = request.body as any;
        const data = (await import('./dto/create-token.dto')).createTokenSchema.parse(body);
        const result = await apiTokensService.create(user.sub, data.name, data.scopes, data.expiresAt);
        await request.auditLog('token.create', `token:${result.id}`, { name: data.name, scopes: data.scopes });
        reply.code(201);
        return result;
      },
    });

    scope.delete('/users/me/tokens/:id', {
      preHandler: [app.requirePermission('token:delete')],
      handler: async (request, reply) => {
        const user = request.user as { sub: string };
        const { id } = request.params as any;
        const result = await apiTokensService.revoke(id, user.sub);
        await request.auditLog('token.revoke', `token:${id}`);
        reply.code(200);
        return result;
      },
    });
  });
}
