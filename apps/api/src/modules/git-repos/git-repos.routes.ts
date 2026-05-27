import { FastifyInstance } from 'fastify';
import { GitReposService } from './git-repos.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function gitReposRoutes(app: FastifyInstance) {
  const gitReposService = new GitReposService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/git-repos/github', async (request) => {
      const { token } = request.query as any;
      const accessToken = token || process.env.GITHUB_PAT;
      if (!accessToken) {
        throw new Error('GitHub token is required');
      }
      return gitReposService.fetchGitHubRepos(accessToken);
    });

    scope.get('/git-repos/gitlab', async (request) => {
      const { token } = request.query as any;
      const accessToken = token || process.env.GITLAB_PAT;
      if (!accessToken) {
        throw new Error('GitLab token is required');
      }
      return gitReposService.fetchGitLabRepos(accessToken);
    });
  });
}
