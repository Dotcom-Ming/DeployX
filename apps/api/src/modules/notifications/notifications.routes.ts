import { FastifyInstance } from 'fastify';
import { prisma } from '@deployx/database';
import { NotificationsService } from './notifications.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function notificationsRoutes(app: FastifyInstance) {
  const notificationsService = new NotificationsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/notifications', async (request) => {
      const { slug } = request.params as any;
      const { limit } = request.query as any;
      const org = await findOrg(slug);
      return notificationsService.getNotifications(org.id, parseInt(limit || '20', 10));
    });

    scope.get('/orgs/:slug/notifications/unread-count', async (request) => {
      const { slug } = request.params as any;
      const org = await findOrg(slug);
      const count = await notificationsService.getUnreadCount(org.id);
      return { count };
    });

    scope.post('/orgs/:slug/notifications/:id/read', async (request, reply) => {
      const { slug, id } = request.params as any;
      const org = await findOrg(slug);
      reply.code(200);
      return notificationsService.markAsRead(id, org.id);
    });

    scope.post('/orgs/:slug/notifications/read-all', async (request, reply) => {
      const { slug } = request.params as any;
      const org = await findOrg(slug);
      reply.code(200);
      return notificationsService.markAllAsRead(org.id);
    });

    scope.delete('/orgs/:slug/notifications/:id', async (request, reply) => {
      const { slug, id } = request.params as any;
      const org = await findOrg(slug);
      reply.code(200);
      return notificationsService.deleteNotification(id, org.id);
    });
  });
}

async function findOrg(slug: string) {
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) throw new Error('Organization not found');
  return org;
}
