import { prisma } from '@deployx/database';
import { UsageMetric, SubscriptionStatus, Plan } from '@deployx/shared';

export class UsageAggregationService {
  start() {
    setInterval(() => this.aggregateUsage(), 60 * 60 * 1000);
    this.aggregateUsage().catch((err) => {
      console.error('Initial usage aggregation failed:', err);
    });

    setInterval(() => this.checkTrialExpiry(), 60 * 60 * 1000);
    this.checkTrialExpiry().catch((err) => {
      console.error('Initial trial check failed:', err);
    });

    console.log('Usage aggregation and trial check scheduler started');
  }

  async aggregateUsage() {
    console.log('Starting hourly usage aggregation...');

    try {
      await this.aggregateBandwidth();
      await this.aggregateBuildMinutes();
      await this.aggregateFunctionInvocations();
      await this.aggregateStorage();

      console.log('Usage aggregation completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Usage aggregation failed: ${message}`);
    }
  }

  private async aggregateBandwidth() {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const org of orgs) {
      const bandwidth = await this.fetchBandwidthFromGateway(org.id, oneHourAgo);

      if (bandwidth > 0) {
        await prisma.usageRecord.create({
          data: {
            orgId: org.id,
            metric: UsageMetric.BANDWIDTH,
            quantity: bandwidth,
            timestamp: new Date(),
          },
        });

        console.log(`Aggregated ${bandwidth} bytes bandwidth for org ${org.id}`);
      }
    }
  }

  private async aggregateBuildMinutes() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const deployments = await prisma.deployment.findMany({
      where: {
        status: 'READY',
        updatedAt: {
          gte: oneHourAgo,
        },
      },
      select: {
        id: true,
        projectId: true,
        buildDuration: true,
        project: {
          select: {
            orgId: true,
          },
        },
      },
    });

    for (const deployment of deployments) {
      if (!deployment.project) continue;

      const buildMinutes = deployment.buildDuration
        ? Math.ceil(deployment.buildDuration / 60000)
        : 0;

      if (buildMinutes > 0) {
        await prisma.usageRecord.create({
          data: {
            orgId: deployment.project.orgId,
            metric: UsageMetric.BUILD_MINUTES,
            quantity: buildMinutes,
            timestamp: new Date(),
          },
        });

        console.log(`Aggregated ${buildMinutes} build minutes for deployment ${deployment.id}`);
      }
    }
  }

  private async aggregateFunctionInvocations() {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const org of orgs) {
      const invocations = await this.fetchFunctionMetricsFromKnative(org.id, oneHourAgo);

      if (invocations > 0) {
        await prisma.usageRecord.create({
          data: {
            orgId: org.id,
            metric: UsageMetric.INVOCATIONS,
            quantity: invocations,
            timestamp: new Date(),
          },
        });

        console.log(`Aggregated ${invocations} function invocations for org ${org.id}`);
      }
    }
  }

  private async aggregateStorage() {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });

    for (const org of orgs) {
      const storageBytes = await this.fetchStorageUsage(org.id);

      if (storageBytes > 0) {
        await prisma.usageRecord.create({
          data: {
            orgId: org.id,
            metric: UsageMetric.STORAGE,
            quantity: storageBytes,
            timestamp: new Date(),
          },
        });

        console.log(`Aggregated ${storageBytes} bytes storage for org ${org.id}`);
      }
    }
  }

  private async fetchBandwidthFromGateway(orgId: string, since: Date): Promise<number> {
    try {
      const gatewayUrl = process.env.GATEWAY_METRICS_URL || 'http://gateway:8081/metrics';
      const response = await fetch(`${gatewayUrl}?orgId=${orgId}&since=${since.toISOString()}`);
      if (!response.ok) return 0;
      const data = (await response.json()) as { bandwidthBytes?: number };
      return data.bandwidthBytes || 0;
    } catch {
      return 0;
    }
  }

  private async fetchFunctionMetricsFromKnative(orgId: string, since: Date): Promise<number> {
    try {
      const knativeUrl = process.env.KNATIVE_METRICS_URL || 'http://knative:9090/api/v1/query';
      const response = await fetch(`${knativeUrl}?query=sum(increase(function_invocations_total{org="${orgId}"}[1h]))`);
      if (!response.ok) return 0;
      const data = (await response.json()) as { data?: { result?: Array<{ value?: [string, string] }> } };
      return parseInt(data?.data?.result?.[0]?.value?.[1] || '0', 10);
    } catch {
      return 0;
    }
  }

  private async fetchStorageUsage(orgId: string): Promise<number> {
    try {
      const s3Endpoint = process.env.S3_ENDPOINT || 'http://minio:9000';
      const response = await fetch(`${s3Endpoint}/api/v1/buckets/usage?orgId=${orgId}`);
      if (!response.ok) return 0;
      const data = (await response.json()) as { totalBytes?: number };
      return data.totalBytes || 0;
    } catch {
      return 0;
    }
  }

  private async checkTrialExpiry(): Promise<void> {
    try {
      const now = new Date();

      const expiredTrials = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.TRIALING,
          currentPeriodEnd: { lte: now },
        },
      });

      for (const trial of expiredTrials) {
        await prisma.subscription.update({
          where: { id: trial.id },
          data: { status: SubscriptionStatus.CANCELED },
        });

        await prisma.organization.update({
          where: { id: trial.orgId },
          data: { plan: Plan.HOBBY },
        });

        console.log(`Trial expired for org ${trial.orgId}, downgraded to Hobby`);
      }

      if (expiredTrials.length > 0) {
        console.log(`${expiredTrials.length} trial(s) expired`);
      }
    } catch (error) {
      console.error('Trial expiry check failed:', error);
    }
  }
}
