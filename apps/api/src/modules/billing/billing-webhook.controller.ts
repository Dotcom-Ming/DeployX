import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { prisma } from '@deployx/database';
import { Plan } from '@deployx/shared';

@Controller('billing')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = req.body;

    let event: any;

    try {
      const stripe = await this.getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoiceSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoiceFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error processing webhook: ${message}`);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handleCheckoutCompleted(session: any) {
    const { orgId } = session.metadata;
    const subscriptionId = session.subscription;

    if (!orgId || !subscriptionId) {
      throw new Error('Missing orgId or subscriptionId in session metadata');
    }

    const stripe = await this.getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const planItem = subscription.items.data[0];
    const priceId = planItem.price.id;

    const plan = this.mapPriceIdToPlan(priceId);

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscriptionId },
      update: {
        plan,
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        orgId,
        plan,
        status: subscription.status,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: { plan },
    });

    this.logger.log(`Subscription created for org ${orgId}, plan: ${plan}`);
  }

  private async handleInvoiceSucceeded(invoice: any) {
    const customerId = invoice.customer;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) {
      this.logger.warn(`No subscription found for customer ${customerId}`);
      return;
    }

    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: {
        status: 'paid',
        amount: invoice.amount_paid / 100,
        pdfUrl: invoice.invoice_pdf,
      },
      create: {
        id: invoice.id,
        orgId: subscription.orgId,
        amount: invoice.amount_paid / 100,
        status: 'paid',
        items: invoice.lines?.data || [],
        pdfUrl: invoice.invoice_pdf,
        createdAt: new Date(invoice.created * 1000),
      },
    });

    this.logger.log(`Invoice ${invoice.id} paid for org ${subscription.orgId}`);
  }

  private async handleInvoiceFailed(invoice: any) {
    const customerId = invoice.customer;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) return;

    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: { status: 'open' },
      create: {
        id: invoice.id,
        orgId: subscription.orgId,
        amount: invoice.amount_due / 100,
        status: 'open',
        items: invoice.lines?.data || [],
        createdAt: new Date(invoice.created * 1000),
      },
    });

    this.logger.warn(`Invoice ${invoice.id} failed for org ${subscription.orgId}`);
  }

  private async handleSubscriptionUpdated(subscription: any) {
    const customerId = subscription.customer;

    const sub = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!sub) return;

    const planItem = subscription.items.data[0];
    const priceId = planItem.price.id;
    const plan = this.mapPriceIdToPlan(priceId);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.organization.update({
      where: { id: sub.orgId },
      data: { plan },
    });

    this.logger.log(`Subscription updated for org ${sub.orgId}, plan: ${plan}, status: ${subscription.status}`);
  }

  private async handleSubscriptionDeleted(subscription: any) {
    const customerId = subscription.customer;

    const sub = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!sub) return;

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan: Plan.HOBBY,
        status: 'canceled',
        stripeSubscriptionId: null,
      },
    });

    await prisma.organization.update({
      where: { id: sub.orgId },
      data: { plan: Plan.HOBBY },
    });

    this.logger.log(`Subscription canceled for org ${sub.orgId}, downgraded to Hobby`);
  }

  private mapPriceIdToPlan(priceId: string): Plan {
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID || '';
    const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID || '';

    if (priceId === proPriceId) return Plan.PRO;
    if (priceId === enterprisePriceId) return Plan.ENTERPRISE;
    return Plan.HOBBY;
  }

  private async getStripe() {
    const Stripe = (await import('stripe')).default;
    return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-04-10' as any,
    });
  }
}
