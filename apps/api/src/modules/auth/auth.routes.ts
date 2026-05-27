import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { OAuthService } from './oauth.service';
import { OAuthStateService } from './oauth-state.service';
import { prisma } from '@deployx/database';
import { BadRequestError } from '../../common/errors';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService();
  const auditService = new AuditService(prisma);
  const oauthService = new OAuthService();
  const oauthStateService = new OAuthStateService();

  app.post('/auth/register', async (request) => {
    const body = request.body as { email: string; name: string; password: string; orgName?: string };
    const result = await authService.register(body);
    if (result.user?.orgId) {
      await auditService.logAction({
        orgId: result.user.orgId,
        userId: result.user.id || 'unknown',
        action: 'user.register',
        resource: `user:${result.user.id || 'unknown'}`,
        ip: request.ip,
      });
    }
    return result;
  });

  app.post('/auth/login', async (request, reply) => {
    reply.code(200);
    const body = request.body as { email: string; password: string };
    const result = await authService.login(body);
    if (!result.requiresMfa && result.user?.orgId) {
      await auditService.logAction({
        orgId: result.user.orgId,
        userId: result.user.id || 'unknown',
        action: 'user.login',
        resource: `user:${result.user.id || 'unknown'}`,
        ip: request.ip,
      });
    }
    return result;
  });

  app.post('/auth/refresh', async (request) => {
    const { refreshToken } = request.body as any;
    return authService.refreshToken(refreshToken);
  });

  app.post('/auth/mfa/enable', {
    preHandler: [jwtAuthGuard],
    handler: async (request) => {
      const user = request.user as { sub: string; orgId?: string };
      const result = await authService.enableMFA(user.sub);
      await request.auditLog('user.mfa_enable', `user:${user.sub}`);
      return result;
    },
  });

  app.post('/auth/mfa/verify', {
    preHandler: [jwtAuthGuard],
    handler: async (request, reply) => {
      reply.code(200);
      const user = request.user as { sub: string; orgId?: string };
      const { code } = request.body as { code: string };
      const result = await authService.verifyMFA(user.sub, code);
      await request.auditLog('user.mfa_verify', `user:${user.sub}`);
      return result;
    },
  });

  app.get('/auth/verify-email', async (request) => {
    const { token } = request.query as any;
    return authService.verifyEmail(token);
  });

  app.post('/auth/resend-verification', async (request, reply) => {
    reply.code(200);
    const { email } = request.body as any;
    return authService.resendVerificationEmail(email);
  });

  app.post('/auth/forgot-password', async (request, reply) => {
    reply.code(200);
    const { email } = request.body as any;
    return authService.forgotPassword(email);
  });

  app.post('/auth/reset-password', async (request, reply) => {
    reply.code(200);
    const { token, password } = request.body as any;
    return authService.resetPassword(token, password);
  });

  app.get('/auth/oauth/:provider', async (request, reply) => {
    const { provider } = request.params as any;
    const validProviders = ['github', 'gitlab', 'google'];
    if (!validProviders.includes(provider)) {
      throw BadRequestError(`Unsupported OAuth provider: ${provider}`);
    }

    const state = oauthService.generateState();
    await oauthStateService.storeState(state, { provider, createdAt: Date.now() });

    const authorizationUrl = oauthService.getAuthorizationUrl(provider, state);
    reply.redirect(authorizationUrl);
  });

  app.get('/auth/oauth/:provider/callback', async (request, reply) => {
    const { provider } = request.params as any;
    const { code, state, error } = request.query as any;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (error) {
      reply.redirect(`${clientUrl}/auth/login?error=oauth_denied`);
      return;
    }

    if (!code || !state) {
      reply.redirect(`${clientUrl}/auth/login?error=oauth_missing_params`);
      return;
    }

    const stateData = await oauthStateService.consumeState(state);
    if (!stateData) {
      reply.redirect(`${clientUrl}/auth/login?error=oauth_invalid_state`);
      return;
    }

    try {
      const accessToken = await oauthService.exchangeCodeForToken(provider, code);
      const profile = await oauthService.fetchUserProfile(provider, accessToken);

      const result = await authService.validateOAuthUser(provider, profile);

      if (result.user?.orgId) {
        await auditService.logAction({
          orgId: result.user.orgId,
          userId: result.user.id || 'unknown',
          action: 'user.oauth_login',
          resource: `user:${result.user.id || 'unknown'}`,
          metadata: { provider },
          ip: request.ip,
        });
      }

      const redirectUrl = `${clientUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
      reply.redirect(redirectUrl);
    } catch (err) {
      console.error(`OAuth callback error for ${provider}:`, err);
      reply.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
    }
  });

  app.post('/auth/oauth/:provider', async (request, reply) => {
    const { provider } = request.params as any;
    const validProviders = ['github', 'gitlab', 'google'];
    if (!validProviders.includes(provider)) {
      throw BadRequestError(`Unsupported OAuth provider: ${provider}`);
    }

    const state = oauthService.generateState();
    await oauthStateService.storeState(state, { provider, createdAt: Date.now() });

    const authorizationUrl = oauthService.getAuthorizationUrl(provider, state);
    return { authorizationUrl, state };
  });
}
