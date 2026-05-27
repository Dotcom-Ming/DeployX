import { FastifyInstance } from 'fastify';
import { UsersService } from './users.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function usersRoutes(app: FastifyInstance) {
  const usersService = new UsersService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/users/me', async (request) => {
      const user = request.user as { sub: string };
      return usersService.getMe(user.sub);
    });

    scope.patch('/users/me', async (request) => {
      const user = request.user as { sub: string };
      const body = request.body as { name?: string; avatarUrl?: string };
      return usersService.updateMe(user.sub, body);
    });

    scope.get('/users/me/orgs', async (request) => {
      const user = request.user as { sub: string };
      return usersService.getUserOrgs(user.sub);
    });
  });
}
