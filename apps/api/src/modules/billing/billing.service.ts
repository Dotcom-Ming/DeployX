import Stripe from 'stripe';
import { prisma } from '@deployx/database';
import { SubscriptionStatus, Plan } from '@deployx/shared';

const TRIAL_DAYS = 14;

export class BillingService {
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async createCheckoutSession(orgId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { orgId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log(`Checkout session created for org ${orgId}: ${session.id}`);

    return { url: session.url, sessionId: session.id };
  }

  async createCheckoutSessionWithTrial(orgId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new Error('Organization not found');

    let customerId = await this.getOrCreateStripeCustomer(orgId, org.name);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { orgId },
      },
      metadata: { orgId, trial: 'true' },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log(`Checkout session with trial created for org ${orgId}: ${session.id}`);

    return { url: session.url, sessionId: session.id };
  }

  async startTrial(orgId: string): Promise<{ trialEndsAt: Date; message: string }> {
    const existingSub = await prisma.subscription.findFirst({
      where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (existingSub) {
      throw new Error('Organization already has an active subscription or trial');
    }

    const usedTrial = await prisma.subscription.findFirst({
      where: {
        orgId,
        status: { in: ['CANCELED', 'PAST_DUE'] },
        currentPeriodStart: { not: null },
      },
    });

    if (usedTrial) {
      throw new Error('Organization has already used a trial period');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.subscription.create({
      data: {
        orgId,
        plan: Plan.PRO,
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
      },
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: Plan.PRO },
    });

    console.log(`Trial started for org ${orgId}, ends at ${trialEnd.toISOString()}`);

    return {
      trialEndsAt: trialEnd,
      message: `${TRIAL_DAYS}-day Pro trial started. Ends at ${trialEnd.toISOString()}`,
    };
  }

  async endTrial(orgId: string): Promise<void> {
    const trialSub = await prisma.subscription.findFirst({
      where: { orgId, status: SubscriptionStatus.TRIALING },
    });

    if (!trialSub) return;

    await prisma.subscription.update({
      where: { id: trialSub.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: Plan.HOBBY },
    });

    console.log(`Trial ended for org ${orgId}, downgraded to Hobby`);
  }

  async checkAndExpireTrials(): Promise<number> {
    const now = new Date();

    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const trial of expiredTrials) {
      await this.endTrial(trial.orgId);
    }

    if (expiredTrials.length > 0) {
      console.log(`${expiredTrials.length} trial(s) expired`);
    }

    return expiredTrials.length;
  }

  async getTrialInfo(orgId: string): Promise<{ isTrialing: boolean; trialEndsAt: Date | null; daysRemaining: number }> {
    const trialSub = await prisma.subscription.findFirst({
      where: { orgId, status: SubscriptionStatus.TRIALING },
    });

    if (!trialSub || !trialSub.currentPeriodEnd) {
      return { isTrialing: false, trialEndsAt: null, daysRemaining: 0 };
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialSub.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      isTrialing: true,
      trialEndsAt: trialSub.currentPeriodEnd,
      daysRemaining,
    };
  }

  async createBillingPortalSession(orgId: string, returnUrl: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const configuration = await this.getOrCreatePortalConfiguration();

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
      configuration,
    });

    console.log(`Billing portal session created for org ${orgId}`);

    return { url: session.url };
  }

  private async getOrCreatePortalConfiguration(): Promise<string> {
    const configId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;

    if (configId) return configId;

    const configurations = await this.stripe.billingPortal.configurations.list({
      limit: 1,
      active: true,
    });

    if (configurations.data.length > 0) {
      return configurations.data[0].id;
    }

    const prices = await this.stripe.prices.list({
      active: true,
      limit: 10,
      type: 'recurring',
    });

    const proPrice = prices.data.find((p) =>
      p.recurring?.interval === 'month' && p.unit_amount === 2000,
    );

    const config = await this.stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'DeployX - Manage your subscription',
      },
      features: {
        payment_method_update: { enabled: true },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'phone', 'name', 'tax_id'],
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ],
          },
        },
        invoice_history: { enabled: true },
        ...(proPrice ? {
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            products: [{ prices: [{ id: proPrice.id }] }],
          } as any,
        } : {}),
      },
    });

    console.log(`Created Stripe billing portal configuration: ${config.id}`);

    return config.id;
  }

  private async getOrCreateStripeCustomer(orgId: string, orgName: string): Promise<string> {
    const existing = await prisma.subscription.findFirst({
      where: { orgId, stripeCustomerId: { not: null } },
      select: { stripeCustomerId: true },
    });

    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      name: orgName,
      metadata: { orgId },
    });

    return customer.id;
  }

  async getSubscription(orgId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { organization: { select: { name: true, slug: true } } },
    });

    if (!subscription) {
      return { hasSubscription: false };
    }

    return {
      hasSubscription: true,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  async getInvoices(orgId: string, limit = 10) {
    const invoices = await prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      currency: inv.currency || 'usd',
      status: inv.status,
      paid: inv.status === 'PAID',
      createdAt: inv.createdAt,
      pdfUrl: inv.pdfUrl,
    }));
  }

  async getUsage(orgId: string, metric: string, period: 'current' | 'previous' = 'current') {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const now = new Date();
    const startOfPeriod = period === 'current'
      ? (subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1))
      : (subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd.getTime() - (30 * 24 * 60 * 60 * 1000))
        : new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const endOfPeriod = period === 'current'
      ? (subscription.currentPeriodEnd || now)
      : (subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1));

    const usage = await prisma.usageRecord.aggregate({
      where: {
        orgId,
        metric,
        timestamp: { gte: startOfPeriod, lte: endOfPeriod },
      },
      _sum: { quantity: true },
    });

    const limit = this.getMetricLimit(metric);

    return {
      metric,
      period,
      used: usage._sum.quantity || 0,
      limit,
      percentage: limit > 0 ? Math.round(((usage._sum.quantity || 0) / limit) * 100) : 0,
    };
  }

  private getMetricLimit(metric: string): number {
    const limits: Record<string, number> = {
      BANDWIDTH: 100_000_000_000,
      BUILD_MINUTES: 2000,
      INVOCATIONS: 100_000,
      STORAGE: 1_000_000_000,
    };
    return limits[metric] || 0;
  }
}
