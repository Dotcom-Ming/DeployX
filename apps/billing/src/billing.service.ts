import { PrismaClient } from '@deployx/database';
import { StripeService } from './stripe.service';
import { Plan, SubscriptionStatus } from '@deployx/shared';

export class BillingService {
  private readonly prisma = new PrismaClient();

  constructor(private readonly stripeService: StripeService) {}

  async createSubscription(orgId: string, plan: Plan): Promise<any> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Check if subscription already exists
    const existing = await this.prisma.subscription.findFirst({
      where: { orgId, status: SubscriptionStatus.ACTIVE },
    });

    if (existing) {
      throw new Error(`Active subscription already exists for organization ${orgId}`);
    }

    // Create Stripe customer
    const customer = await this.stripeService.createCustomer(
      org.name,
      org.slug,
    );

    // Create Stripe subscription
    const priceId = this.getPriceIdForPlan(plan);
    const stripeSubscription = await this.stripeService.createSubscription(
      customer.id,
      priceId,
    );

    // Create local subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        orgId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    // Update org plan
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { plan },
    });

    console.log(`Created subscription for org ${orgId} on plan ${plan}`);
    return subscription;
  }

  async getSubscription(orgId: string): Promise<any> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new Error(`No subscription found for organization ${orgId}`);
    }

    return subscription;
  }

  async updateSubscription(orgId: string, newPlan: Plan): Promise<any> {
    const subscription = await this.getSubscription(orgId);

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    const newPriceId = this.getPriceIdForPlan(newPlan);

    const stripeSubscription = await this.stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      newPriceId,
    );

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: newPlan,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update org plan
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { plan: newPlan },
    });

    console.log(`Updated subscription for org ${orgId} to plan ${newPlan}`);
    return updated;
  }

  async cancelSubscription(orgId: string): Promise<any> {
    const subscription = await this.getSubscription(orgId);

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    console.log(`Canceled subscription for org ${orgId} (at period end)`);
    return updated;
  }

  async getSubscriptionStatus(orgId: string): Promise<{ active: boolean; status: string; plan: string }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return { active: false, status: 'none', plan: 'HOBBY' };
    }

    return {
      active: subscription.status === SubscriptionStatus.ACTIVE,
      status: subscription.status,
      plan: subscription.plan,
    };
  }

  private getPriceIdForPlan(plan: Plan): string {
    const priceMap: Record<string, string> = {
      [Plan.HOBBY]: process.env.STRIPE_HOBBY_PRICE_ID || 'price_hobby',
      [Plan.PRO]: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
      [Plan.ENTERPRISE]: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    };
    return priceMap[plan] || 'price_hobby';
  }
}
