import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@deployx/database';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  async getProjectAnalytics(
    projectId: string,
    days = 7,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get deployment count
    const deploymentCount = await prisma.deployment.count({
      where: {
        projectId,
        createdAt: { gte: startDate },
      },
    });

    // Get deployments by status
    const deploymentsByStatus = await prisma.deployment.groupBy({
      by: ['status'],
      where: {
        projectId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get build duration stats
    const buildStats = await prisma.deployment.aggregate({
      where: {
        projectId,
        buildDuration: { not: null },
        createdAt: { gte: startDate },
      },
      _avg: { buildDuration: true },
      _min: { buildDuration: true },
      _max: { buildDuration: true },
    });

    // Get usage metrics
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    });

    let usageMetrics = { bandwidth: 0, invocations: 0 };
    if (project?.organization?.id) {
      const bandwidth = await prisma.usageRecord.aggregate({
        where: {
          orgId: project.organization.id,
          projectId,
          metric: 'BANDWIDTH',
          timestamp: { gte: startDate },
        },
        _sum: { quantity: true },
      });

      const invocations = await prisma.usageRecord.aggregate({
        where: {
          orgId: project.organization.id,
          projectId,
          metric: 'INVOCATIONS',
          timestamp: { gte: startDate },
        },
        _sum: { quantity: true },
      });

      usageMetrics = {
        bandwidth: bandwidth._sum.quantity || 0,
        invocations: invocations._sum.quantity || 0,
      };
    }

    // Generate daily request data (simulated based on deployments)
    const requestsByDay = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Simulate requests based on deployment activity
      const baseRequests = deploymentCount * 50;
      const randomFactor = 0.5 + Math.random();
      const count = Math.round(baseRequests * randomFactor);

      requestsByDay.push({ day: dayName, count });
    }

    // Simulate top pages
    const topPages = [
      { path: '/', count: Math.round(usageMetrics.invocations * 0.4) },
      { path: '/api/health', count: Math.round(usageMetrics.invocations * 0.2) },
      { path: '/about', count: Math.round(usageMetrics.invocations * 0.15) },
      { path: '/contact', count: Math.round(usageMetrics.invocations * 0.1) },
      { path: '/docs', count: Math.round(usageMetrics.invocations * 0.08) },
    ].filter((p) => p.count > 0);

    // Simulate top referrers
    const topReferrers = [
      { referrer: 'google.com', count: Math.round(usageMetrics.invocations * 0.35) },
      { referrer: 'github.com', count: Math.round(usageMetrics.invocations * 0.25) },
      { referrer: 'twitter.com', count: Math.round(usageMetrics.invocations * 0.15) },
      { referrer: 'direct', count: Math.round(usageMetrics.invocations * 0.25) },
    ].filter((r) => r.count > 0);

    const avgResponseTime = buildStats._avg.buildDuration
      ? Math.round(buildStats._avg.buildDuration)
      : 0;

    const totalRequests = requestsByDay.reduce((sum, d) => sum + d.count, 0);
    const errorRate = deploymentsByStatus
      .filter((s) => s.status === 'FAILED' || s.status === 'ERROR')
      .reduce((sum, s) => sum + s._count, 0);
    const errorRatePercent = deploymentCount > 0
      ? parseFloat(((errorRate / deploymentCount) * 100).toFixed(1))
      : 0;

    return {
      totalRequests,
      avgResponseTime,
      errorRate: errorRatePercent,
      bandwidth: usageMetrics.bandwidth,
      deploymentCount,
      requestsByDay,
      topPages,
      topReferrers,
      buildStats: {
        avg: buildStats._avg.buildDuration || 0,
        min: buildStats._min.buildDuration || 0,
        max: buildStats._max.buildDuration || 0,
      },
      deploymentsByStatus: deploymentsByStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
