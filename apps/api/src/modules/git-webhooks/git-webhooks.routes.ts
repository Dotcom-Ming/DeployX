import { FastifyInstance } from 'fastify';
import { GitWebhooksService } from './git-webhooks.service';
import { GitHubAppService } from './github-app.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function gitWebhooksRoutes(app: FastifyInstance) {
  const gitWebhooksService = new GitWebhooksService();
  const githubAppService = new GitHubAppService();

  app.post('/webhooks/github', async (request, reply) => {
    reply.code(200);
    return gitWebhooksService.handleGitHubWebhook(request.headers as Record<string, string>, request.body);
  });

  app.post('/webhooks/gitlab', async (request, reply) => {
    reply.code(200);
    return gitWebhooksService.handleGitLabWebhook(request.headers as Record<string, string>, request.body);
  });

  app.post('/webhooks/bitbucket', async (request, reply) => {
    reply.code(200);
    return gitWebhooksService.handleBitbucketWebhook(request.headers as Record<string, string>, request.body);
  });

  app.post('/webhooks/github-app', async (request, reply) => {
    const signature = (request.headers['x-hub-signature-256'] as string) || '';
    const event = (request.headers['x-github-event'] as string) || '';
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

    if (!githubAppService.verifyWebhookSignature(rawBody, signature)) {
      reply.code(401).send({ error: 'Invalid signature' });
      return;
    }

    const body = request.body as any;

    try {
      if (event === 'installation' || event === 'installation_repositories') {
        if (event === 'installation') {
          await githubAppService.handleInstallationEvent(body);
        } else {
          await githubAppService.handleInstallationRepositoriesEvent(body);
        }
      } else if (event === 'push' || event === 'pull_request') {
        await gitWebhooksService.handleGitHubWebhook(request.headers as Record<string, string>, body);
      }

      reply.code(200).send({ processed: true });
    } catch (error) {
      console.error(`GitHub App webhook error (${event}):`, error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.get('/github-app/installation-url', async (request) => {
      const { orgSlug } = request.query as any;
      return { url: githubAppService.getInstallationUrl(orgSlug) };
    });

    scope.get('/github-app/repositories', async (request) => {
      const { installationId } = request.query as any;
      if (!installationId) {
        return { data: [] };
      }
      const repos = await githubAppService.listInstallationRepositories(parseInt(installationId, 10));
      return { data: repos };
    });
  });
}
