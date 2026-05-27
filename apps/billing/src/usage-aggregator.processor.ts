import { Job } from 'bullmq';
import { PrismaClient } from '@deployx/database';
import { UsageMetric } from '@deployx/shared';
import Stripe from 'stripe';

export class UsageAggregatorProcessor {
  private readonly prisma = new PrismaClient();
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async process(job: Job): Promise<void> {
    console.log('Running usage aggregation job');

    // Get all active subscriptions
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { organization: true },
    });

    for (const subscription of subscriptions) {
      try {
        await this.aggregateForSubscription(subscription);
      } catch (error) {
        console.error(
          `Failed to aggregate usage for subscription ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }

    console.log('Usage aggregation completed');
  }

  private async aggregateForSubscription(subscription: any): Promise<void> {
    const { orgId, stripeSubscriptionId } = subscription;

    if (!stripeSubscriptionId) {
      return;
    }

    // Get usage for current period
    const periodStart = subscription.currentPeriodStart || new Date();
    const periodEnd = subscription.currentPeriodEnd || new Date();

    const records = await this.prisma.usageRecord.findMany({
      where: {
        orgId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Aggregate by metric
    const aggregated: Record<string, number> = {};
    for (const record of records) {
      aggregated[record.metric] = (aggregated[record.metric] || 0) + record.quantity;
    }

    // Report metered usage to Stripe for metered billing
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );

    for (const item of stripeSubscription.items.data) {
      if (item.price.recurring?.usage_type === 'metered') {
        try {
          // Report the current usage value as a metered usage record
          const metric = this.getMetricForPrice(item.price.id);
          if (metric && aggregated[metric]) {
            await this.stripe.subscriptionItems.createUsageRecord(item.id, {
              quantity: Math.round(aggregated[metric]),
              timestamp: Math.floor(Date.now() / 1000),
              action: 'set',
            });

            console.log(
              `Reported ${aggregated[metric]} ${metric} usage to Stripe for org ${orgId}`,
            );
          }
        } catch (error) {
          console.error(
            `Failed to report usage to Stripe: ${(error as Error).message}`,
          );
        }
      }
    }
  }

  private getMetricForPrice(priceId: string): UsageMetric | null {
    // Map price IDs to usage metrics
    const priceToMetric: Record<string, UsageMetric> = {
      [process.env.STRIPE_BANDWIDTH_PRICE_ID || 'price_bandwidth']: UsageMetric.BANDWIDTH,
      [process.env.STRIPE_BUILD_MINUTES_PRICE_ID || 'price_build_minutes']: UsageMetric.BUILD_MINUTES,
      [process.env.STRIPE_INVOCATIONS_PRICE_ID || 'price_invocations']: UsageMetric.INVOCATIONS,
    };

    return priceToMetric[priceId] || null;
  }
}
