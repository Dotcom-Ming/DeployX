import { FastifyInstance } from 'fastify';
import { EnvVariablesService } from './env-variables.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function envVariablesRoutes(app: FastifyInstance) {
  const envVariablesService = new EnvVariablesService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/projects/:id/env', async (request) => {
      const { id } = request.params as any;
      return envVariablesService.list(id);
    });

    scope.post('/orgs/:slug/projects/:id/env', async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;
      const data = (await import('./dto/create-env.dto')).createEnvSchema.parse(body);
      reply.code(201);
      return envVariablesService.create(id, data.key, data.value, data.target);
    });

    scope.patch('/orgs/:slug/projects/:id/env/:varId', async (request) => {
      const { varId } = request.params as any;
      const body = request.body as { key?: string; value?: string; target?: string };
      return envVariablesService.update(varId, body);
    });

    scope.delete('/orgs/:slug/projects/:id/env/:varId', async (request, reply) => {
      const { varId } = request.params as any;
      reply.code(200);
      return envVariablesService.remove(varId);
    });
  });
}
