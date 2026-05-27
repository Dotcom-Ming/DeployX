import { FastifyInstance } from 'fastify';
import { OrganizationsService } from './organizations.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function organizationsRoutes(app: FastifyInstance) {
  const organizationsService = new OrganizationsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.post('/orgs', {
      preHandler: [app.requirePermission('org:create')],
      handler: async (request) => {
        const user = request.user as { sub: string };
        const body = request.body as { name: string; slug?: string };
        const result = await organizationsService.create(user.sub, body);
        await request.auditLog('org.create', `org:${result.id}`, { name: body.name, slug: result.slug });
        return result;
      },
    });

    scope.get('/orgs/:slug', async (request) => {
      const { slug } = request.params as any;
      return organizationsService.getBySlug(slug);
    });

    scope.patch('/orgs/:slug', {
      preHandler: [app.requirePermission('org:edit')],
      handler: async (request) => {
        const user = request.user as { sub: string };
        const { slug } = request.params as any;
        const body = request.body as { name?: string; slug?: string; plan?: string };
        const result = await organizationsService.update(slug, user.sub, body);
        await request.auditLog('org.update', `org:${result.id}`, body);
        return result;
      },
    });

    scope.delete('/orgs/:slug', {
      preHandler: [app.requirePermission('org:delete')],
      handler: async (request) => {
        const user = request.user as { sub: string };
        const { slug } = request.params as any;
        await request.auditLog('org.delete', `org:${slug}`);
        return organizationsService.delete(slug, user.sub);
      },
    });

    scope.get('/orgs/:slug/members', async (request) => {
      const { slug } = request.params as any;
      return organizationsService.getMembers(slug);
    });

    scope.post('/orgs/:slug/members/invite', {
      preHandler: [app.requirePermission('team:create')],
      handler: async (request) => {
        const user = request.user as { sub: string };
        const { slug } = request.params as any;
        const body = request.body as { email: string; role: string };
        const result = await organizationsService.inviteMember(slug, user.sub, body.email, body.role as any);
        await request.auditLog('member.invite', `org:${slug}`, { email: body.email, role: body.role });
        return result;
      },
    });

    scope.patch('/orgs/:slug/members/:id', {
      preHandler: [app.requirePermission('team:edit')],
      handler: async (request) => {
        const { slug, id } = request.params as any;
        const body = request.body as { role: string };
        const result = await organizationsService.updateMember(slug, id, body.role as any);
        await request.auditLog('member.role_change', `org:${slug}:member:${id}`, { role: body.role });
        return result;
      },
    });

    scope.delete('/orgs/:slug/members/:id', {
      preHandler: [app.requirePermission('team:delete')],
      handler: async (request) => {
        const { slug, id } = request.params as any;
        await request.auditLog('member.remove', `org:${slug}:member:${id}`);
        return organizationsService.removeMember(slug, id);
      },
    });
  });
}
