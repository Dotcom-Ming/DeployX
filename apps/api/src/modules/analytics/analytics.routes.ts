import { FastifyInstance } from 'fastify';
import { AnalyticsService } from './analytics.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function analyticsRoutes(app: FastifyInstance) {
  const analyticsService = new AnalyticsService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/orgs/:slug/projects/:id/analytics', async (request) => {
      const { id, slug } = request.params as any;
      const { days } = request.query as any;
      return analyticsService.getProjectAnalytics(id, parseInt(days || '7', 10));
    });
  });
}
