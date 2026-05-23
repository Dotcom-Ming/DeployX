import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { prisma } from '@deployx/database';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async createCheckoutSession(
    orgId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          owner: true,
        },
      });

      if (!org) {
        throw new Error('Organization not found');
      }

      const customer = await this.stripe.customers.create({
        name: org.name,
        email: org.owner.email || undefined,
        metadata: {
          orgId,
          platform: 'deployx',
        },
      });

      customerId = customer.id;

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            orgId,
            stripeCustomerId: customerId,
          },
        });
      }
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orgId,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async createBillingPortalSession(
    orgId: string,
    returnUrl: string,
  ) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this organization');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async getSubscription(orgId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
    });

    if (!subscription) {
      return null;
    }

    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSub = await this.stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );

        return {
          ...subscription,
          stripeStatus: stripeSub.status,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        };
      } catch {
        return subscription;
      }
    }

    return subscription;
  }

  async getInvoices(orgId: string, limit = 10) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
    });

    if (!subscription?.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status,
      createdAt: new Date(invoice.created * 1000),
      pdfUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    }));
  }

  async getUsage(orgId: string, metric: string, period: 'current' | 'previous' = 'current') {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
    });

    if (!subscription?.currentPeriodStart || !subscription?.currentPeriodEnd) {
      return { quantity: 0, periodStart: null, periodEnd: null };
    }

    const start = period === 'current'
      ? subscription.currentPeriodStart
      : new Date(subscription.currentPeriodStart.getTime() - (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()));

    const end = period === 'current'
      ? subscription.currentPeriodEnd
      : subscription.currentPeriodStart;

    const records = await prisma.usageRecord.aggregate({
      where: {
        orgId,
        metric,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    return {
      quantity: records._sum.quantity || 0,
      periodStart: start,
      periodEnd: end,
    };
  }
}
