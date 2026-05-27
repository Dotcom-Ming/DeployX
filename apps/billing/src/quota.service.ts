import { PrismaClient } from '@deployx/database';
import { PLAN_LIMITS, Plan, UsageMetric } from '@deployx/shared';

export interface QuotaUsage {
  [metric: string]: {
    used: number;
    limit: number;
    percentage: number;
    exceeded: boolean;
  };
}

export class QuotaService {
  private readonly prisma = new PrismaClient();

  async checkQuota(
    orgId: string,
    metric: UsageMetric,
  ): Promise<{ allowed: boolean; used: number; limit: number }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const planLimits = PLAN_LIMITS[org.plan as Plan];
    const limit = this.getLimitForMetric(planLimits, metric);

    // 0 means unlimited
    if (limit === 0) {
      return { allowed: true, used: 0, limit: 0 };
    }

    const { start, end } = await this.getCurrentPeriod(orgId);
    const usage = await this.prisma.usageRecord.aggregate({
      where: {
        orgId,
        metric,
        timestamp: { gte: start, lte: end },
      },
      _sum: { quantity: true },
    });

    const used = usage._sum.quantity || 0;
    const allowed = used < limit;

    return { allowed, used, limit };
  }

  async getQuotaUsage(orgId: string): Promise<QuotaUsage> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const planLimits = PLAN_LIMITS[org.plan as Plan];
    const { start, end } = await this.getCurrentPeriod(orgId);

    const metrics = [
      UsageMetric.BANDWIDTH,
      UsageMetric.BUILD_MINUTES,
      UsageMetric.INVOCATIONS,
      UsageMetric.STORAGE,
    ];

    const result: QuotaUsage = {};

    for (const metric of metrics) {
      const limit = this.getLimitForMetric(planLimits, metric);
      const usage = await this.prisma.usageRecord.aggregate({
        where: {
          orgId,
          metric,
          timestamp: { gte: start, lte: end },
        },
        _sum: { quantity: true },
      });

      const used = usage._sum.quantity || 0;
      const isUnlimited = limit === 0;

      result[metric] = {
        used,
        limit: isUnlimited ? Infinity : limit,
        percentage: isUnlimited ? 0 : limit > 0 ? Math.round((used / limit) * 100) : 0,
        exceeded: !isUnlimited && used >= limit,
      };
    }

    return result;
  }

  async enforceHardLimit(
    orgId: string,
    metric: UsageMetric,
  ): Promise<void> {
    const { allowed, used, limit } = await this.checkQuota(orgId, metric);

    if (!allowed) {
      console.warn(
        `Quota exceeded for org ${orgId}, metric ${metric}: ${used}/${limit}`,
      );
      throw new Error(
        `Quota exceeded for ${metric}. Used ${used} of ${limit}. Please upgrade your plan.`,
      );
    }
  }

  private getLimitForMetric(
    planLimits: { bandwidth: number; buildMinutes: number; invocations: number; projects: number },
    metric: UsageMetric,
  ): number {
    switch (metric) {
      case UsageMetric.BANDWIDTH:
        return planLimits.bandwidth;
      case UsageMetric.BUILD_MINUTES:
        return planLimits.buildMinutes;
      case UsageMetric.INVOCATIONS:
        return planLimits.invocations;
      case UsageMetric.STORAGE:
        return 0; // Storage not tracked in plan limits currently
      default:
        return 0;
    }
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

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return { start, end };
  }
}
