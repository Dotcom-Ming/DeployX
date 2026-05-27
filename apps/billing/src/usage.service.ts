import { PrismaClient } from '@deployx/database';
import { UsageMetric } from '@deployx/shared';

export class UsageService {
  private readonly prisma = new PrismaClient();

  async recordUsage(
    orgId: string,
    metric: UsageMetric,
    quantity: number,
    projectId?: string,
  ): Promise<void> {
    await this.prisma.usageRecord.create({
      data: {
        orgId,
        metric,
        quantity,
        projectId: projectId || null,
        timestamp: new Date(),
      },
    });
  }

  async getUsageForPeriod(
    orgId: string,
    start: Date,
    end: Date,
  ): Promise<Record<UsageMetric, number>> {
    const records = await this.prisma.usageRecord.findMany({
      where: {
        orgId,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
    });

    const usage: Record<string, number> = {
      [UsageMetric.BANDWIDTH]: 0,
      [UsageMetric.BUILD_MINUTES]: 0,
      [UsageMetric.INVOCATIONS]: 0,
      [UsageMetric.STORAGE]: 0,
    };

    for (const record of records) {
      usage[record.metric] = (usage[record.metric] || 0) + record.quantity;
    }

    return usage as Record<UsageMetric, number>;
  }

  async getCurrentPeriodUsage(
    orgId: string,
  ): Promise<Record<UsageMetric, number>> {
    const { start, end } = await this.getCurrentPeriod(orgId);
    return this.getUsageForPeriod(orgId, start, end);
  }

  async getUsageByMetric(
    orgId: string,
    metric: UsageMetric,
  ): Promise<{ date: string; value: number }[]> {
    const { start, end } = await this.getCurrentPeriod(orgId);

    const records = await this.prisma.usageRecord.findMany({
      where: {
        orgId,
        metric,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Aggregate by day
    const dailyUsage = new Map<string, number>();

    for (const record of records) {
      const date = record.timestamp.toISOString().split('T')[0];
      dailyUsage.set(date, (dailyUsage.get(date) || 0) + record.quantity);
    }

    return Array.from(dailyUsage.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getCurrentPeriod(
    orgId: string,
  ): Promise<{ start: Date; end: Date }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      return {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      };
    }

    // Default to current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return { start, end };
  }
}
