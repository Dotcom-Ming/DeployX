import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@deployx/database';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { UsageService } from './usage.service';
import { QuotaService } from './quota.service';
import { InvoiceService } from './invoice.service';

async function bootstrap() {
  const app = Fastify({ logger: true });
  await app.register(cors);

  const prisma = new PrismaClient();
  const stripeService = new StripeService();
  const billingService = new BillingService(stripeService);
  const usageService = new UsageService();
  const quotaService = new QuotaService();
  const invoiceService = new InvoiceService();

  // Register routes
  app.post('/billing/webhooks/stripe', async (req, reply) => {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      const rawBody = (req as any).rawBody || req.body;
      const event = stripeService.constructWebhookEvent(rawBody, signature);

      // Handle webhooks inline (simplified from the NestJS controller)
      console.log(`Received Stripe webhook: ${event.type}`);

      // Process webhook events
      switch (event.type) {
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const stripeCustomerId = String(subscription.customer);
          const localSubscription = await prisma.subscription.findFirst({ where: { stripeCustomerId } });
          if (localSubscription) {
            const status = subscription.status === 'active' ? 'ACTIVE' : 
                          subscription.status === 'past_due' ? 'PAST_DUE' : 
                          subscription.status === 'canceled' ? 'CANCELED' : 'ACTIVE';
            await prisma.subscription.update({
              where: { id: localSubscription.id },
              data: {
                status: status as any,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const stripeSubscriptionId = subscription.id;
          const localSubscription = await prisma.subscription.findFirst({ where: { stripeSubscriptionId } });
          if (localSubscription) {
            await prisma.subscription.update({
              where: { id: localSubscription.id },
              data: { status: 'CANCELED' as any },
            });
            await prisma.organization.update({
              where: { id: localSubscription.orgId },
              data: { plan: 'HOBBY' },
            });
          }
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object;
          const stripeCustomerId = String(invoice.customer);
          const localSubscription = await prisma.subscription.findFirst({ where: { stripeCustomerId } });
          if (localSubscription) {
            await prisma.invoice.upsert({
              where: { stripeInvoiceId: invoice.id },
              create: {
                orgId: localSubscription.orgId,
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                status: 'PAID',
                items: JSON.stringify(invoice.lines?.data || []),
                pdfUrl: invoice.invoice_pdf,
              },
              update: { status: 'PAID', amount: invoice.amount_paid / 100 },
            });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const stripeCustomerId = String(invoice.customer);
          const localSubscription = await prisma.subscription.findFirst({ where: { stripeCustomerId } });
          if (localSubscription) {
            await prisma.subscription.update({
              where: { id: localSubscription.id },
              data: { status: 'PAST_DUE' as any },
            });
          }
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error('Webhook error:', err);
      return reply.status(400).send({ error: 'Invalid signature' });
    }
  });

  const port = process.env.PORT || 3003;
  await app.listen({ port: Number(port), host: '0.0.0.0' });
  console.log(`DeployX Billing Service running on port ${port}`);
}

bootstrap().catch(console.error);
