import { Controller, Post, Req, Res, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { PrismaClient } from '@deployx/database';
import { InvoiceStatus, Plan, SubscriptionStatus } from '@deployx/shared';

@Controller('billing/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly prisma = new PrismaClient();

  constructor(private readonly stripeService: StripeService) {}

  @Post('stripe')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: any;
    try {
      const rawBody = (req as any).rawBody || req.body;
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid signature' });
      return;
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(
        `Error handling webhook ${event.type}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Webhook handler failed' });
      return;
    }

    res.json({ received: true });
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const stripeCustomerId = subscription.customer as string;

    const localSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (!localSubscription) {
      this.logger.warn(`No subscription found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(
      `Updated subscription ${localSubscription.id} to status ${status}`,
    );
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const stripeSubscriptionId = subscription.id as string;

    const localSubscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!localSubscription) {
      this.logger.warn(`No subscription found for Stripe subscription ${stripeSubscriptionId}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      },
    });

    // Downgrade org to Hobby
    await this.prisma.organization.update({
      where: { id: localSubscription.orgId },
      data: { plan: Plan.HOBBY },
    });

    this.logger.log(
      `Subscription ${localSubscription.id} canceled, org downgraded to Hobby`,
    );
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    const stripeCustomerId = invoice.customer as string;

    const localSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (!localSubscription) {
      this.logger.warn(`No subscription found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    // Create or update invoice record
    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        orgId: localSubscription.orgId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Stripe amounts are in cents
        currency: invoice.currency,
        status: InvoiceStatus.PAID,
        items: JSON.stringify(invoice.lines?.data || []),
        pdfUrl: invoice.invoice_pdf,
      },
      update: {
        status: InvoiceStatus.PAID,
        amount: invoice.amount_paid / 100,
      },
    });

    // Reactivate subscription if it was past due
    if (localSubscription.status === SubscriptionStatus.PAST_DUE) {
      await this.prisma.subscription.update({
        where: { id: localSubscription.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }

    this.logger.log(`Invoice ${invoice.id} paid for org ${localSubscription.orgId}`);
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const stripeCustomerId = invoice.customer as string;

    const localSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (!localSubscription) {
      this.logger.warn(`No subscription found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: localSubscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        orgId: localSubscription.orgId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: InvoiceStatus.OPEN,
        items: JSON.stringify(invoice.lines?.data || []),
      },
      update: {
        status: InvoiceStatus.OPEN,
      },
    });

    this.logger.warn(
      `Payment failed for org ${localSubscription.orgId}, subscription marked past due`,
    );
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    this.logger.log(
      `Checkout session completed: customer=${stripeCustomerId}, subscription=${stripeSubscriptionId}`,
    );

    // Update the subscription with the Stripe IDs if they weren't set yet
    const localSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });

    if (localSubscription && !localSubscription.stripeSubscriptionId) {
      await this.prisma.subscription.update({
        where: { id: localSubscription.id },
        data: {
          stripeSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.TRIALING,
      paused: SubscriptionStatus.ACTIVE, // Map paused to active for now
    };

    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
  }
}
