import { FastifyInstance } from 'fastify';
import { prisma } from '@deployx/database';
import { BillingService } from './billing.service';
import { jwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export async function billingRoutes(app: FastifyInstance) {
  const billingService = new BillingService();

  app.register(async function (scope) {
    scope.addHook('preHandler', jwtAuthGuard);

    scope.post('/orgs/:slug/billing/checkout', {
      preHandler: [app.requirePermission('billing:create')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const body = request.body as { priceId: string; successUrl: string; cancelUrl: string; withTrial?: boolean };
        const org = await findOrg(slug);
        await request.auditLog('billing.checkout', `org:${org.id}`, { priceId: body.priceId });

        if (body.withTrial) {
          return billingService.createCheckoutSessionWithTrial(org.id, body.priceId, body.successUrl, body.cancelUrl);
        }
        return billingService.createCheckoutSession(org.id, body.priceId, body.successUrl, body.cancelUrl);
      },
    });

    scope.post('/orgs/:slug/billing/portal', {
      preHandler: [app.requirePermission('billing:manage')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const body = request.body as { returnUrl: string };
        const org = await findOrg(slug);
        return billingService.createBillingPortalSession(org.id, body.returnUrl);
      },
    });

    scope.post('/orgs/:slug/billing/start-trial', {
      preHandler: [app.requirePermission('billing:manage')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const org = await findOrg(slug);
        await request.auditLog('billing.start_trial', `org:${org.id}`);
        return billingService.startTrial(org.id);
      },
    });

    scope.get('/orgs/:slug/billing/trial', {
      preHandler: [app.requirePermission('billing:view')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const org = await findOrg(slug);
        return billingService.getTrialInfo(org.id);
      },
    });

    scope.get('/orgs/:slug/billing/subscription', {
      preHandler: [app.requirePermission('billing:view')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const org = await findOrg(slug);
        return billingService.getSubscription(org.id);
      },
    });

    scope.get('/orgs/:slug/billing/invoices', {
      preHandler: [app.requirePermission('billing:view')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const { limit } = request.query as any;
        const org = await findOrg(slug);
        return billingService.getInvoices(org.id, parseInt(limit || '10', 10));
      },
    });

    scope.get('/orgs/:slug/billing/usage', {
      preHandler: [app.requirePermission('billing:view')],
      handler: async (request) => {
        const { slug } = request.params as any;
        const { metric, period } = request.query as any;
        const org = await findOrg(slug);
        return billingService.getUsage(org.id, metric, period || 'current');
      },
    });
  });
}

async function findOrg(slug: string) {
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) throw new Error('Organization not found');
  return org;
}
