import { FastifyInstance } from 'fastify';
import { ProjectsService } from './projects.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function projectsRoutes(app: FastifyInstance) {
  const projectsService = new ProjectsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/projects', {
      preHandler: [app.requirePermission('project:view')],
      handler: async (request) => {
        const { slug } = request.params as any;
        return projectsService.list(slug);
      },
    });

    scope.post('/orgs/:slug/projects', {
      preHandler: [app.requirePermission('project:create')],
      handler: async (request) => {
        const user = request.user as { sub: string };
        const { slug } = request.params as any;
        const body = request.body as any;
        const dto = body as {
          name: string;
          framework?: string;
          gitProvider?: string;
          repositoryUrl: string;
          branch: string;
          rootDirectory?: string;
          buildCommand?: string;
          outputDirectory?: string;
          installCommand?: string;
        };
        const result = await projectsService.create(slug, user.sub, dto);
        await request.auditLog('project.create', `project:${result.id}`, { name: dto.name, slug: result.slug });
        return result;
      },
    });

    scope.get('/orgs/:slug/projects/:id', {
      preHandler: [app.requirePermission('project:view')],
      handler: async (request) => {
        const { slug, id } = request.params as any;
        return projectsService.get(slug, id);
      },
    });

    scope.patch('/orgs/:slug/projects/:id', {
      preHandler: [app.requirePermission('project:edit')],
      handler: async (request) => {
        const { slug, id } = request.params as any;
        const body = request.body as {
          name?: string;
          branch?: string;
          rootDirectory?: string;
          buildCommand?: string;
          outputDirectory?: string;
          installCommand?: string;
        };
        const result = await projectsService.update(slug, id, body);
        await request.auditLog('project.update', `project:${id}`, body);
        return result;
      },
    });

    scope.delete('/orgs/:slug/projects/:id', {
      preHandler: [app.requirePermission('project:delete')],
      handler: async (request) => {
        const { slug, id } = request.params as any;
        await request.auditLog('project.delete', `project:${id}`);
        return projectsService.delete(slug, id);
      },
    });
  });
}
