import { PrismaClient } from '@deployx/database';
import { DeploymentStatus } from '@deployx/shared';
import Redis from 'ioredis';

export interface ResolvedRoute {
  deploymentUrl: string;
  projectId: string;
  deploymentId: string;
}

export class RoutingService {
  private readonly prisma = new PrismaClient();
  private readonly redis: Redis | null = null;
  private readonly defaultDomain: string;

  constructor() {
    this.defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
    if (process.env.REDIS_ENABLED !== 'false') {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: () => null,
        });
      } catch {
        console.warn('Redis connection failed, running without cache');
      }
    }
  }

  async resolveDomain(domain: string): Promise<ResolvedRoute | null> {
    if (this.redis) {
      try {
        const cacheKey = `deployx:route:${domain}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        console.warn('Redis cache read failed, falling back to DB');
      }
    }

    let route: ResolvedRoute | null = null;

    if (domain.endsWith(`.${this.defaultDomain}`)) {
      route = await this.resolveDefaultDomain(domain);
    } else {
      route = await this.resolveCustomDomain(domain);
    }

    if (route && this.redis) {
      try {
        const cacheKey = `deployx:route:${domain}`;
        await this.redis.set(cacheKey, JSON.stringify(route), 'EX', 60);
      } catch {
        console.warn('Redis cache write failed');
      }
    }

    return route;
  }

  private async resolveDefaultDomain(
    domain: string,
  ): Promise<ResolvedRoute | null> {
    const prefix = domain.slice(0, domain.length - this.defaultDomain.length - 1);
    const lastDashIndex = prefix.lastIndexOf('-');

    if (lastDashIndex === -1) {
      console.warn(`Invalid default domain format: ${domain}`);
      return null;
    }

    const projectSlug = prefix.slice(0, lastDashIndex);
    const deploymentHash = prefix.slice(lastDashIndex + 1);

    const deployment = await this.prisma.deployment.findFirst({
      where: {
        status: DeploymentStatus.READY,
        id: { endsWith: deploymentHash },
      },
      include: { project: true },
    });

    if (deployment && deployment.project?.slug === projectSlug) {
      return {
        deploymentUrl: deployment.url || `http://localhost:3000`,
        projectId: deployment.projectId,
        deploymentId: deployment.id,
      };
    }

    const project = await this.prisma.project.findFirst({
      where: { slug: projectSlug },
    });

    if (!project) {
      console.warn(`Project not found for slug: ${projectSlug}`);
      return null;
    }

    const latestDeployment = await this.prisma.deployment.findFirst({
      where: {
        projectId: project.id,
        status: DeploymentStatus.READY,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestDeployment) {
      console.warn(`No ready deployment found for project: ${projectSlug}`);
      return null;
    }

    return {
      deploymentUrl: latestDeployment.url || `http://localhost:3000`,
      projectId: project.id,
      deploymentId: latestDeployment.id,
    };
  }

  private async resolveCustomDomain(
    domain: string,
  ): Promise<ResolvedRoute | null> {
    const domainRecord = await this.prisma.domain.findUnique({
      where: { domain },
      include: { project: true },
    });

    if (!domainRecord || !domainRecord.verified) {
      console.warn(`Domain not found or not verified: ${domain}`);
      return null;
    }

    const deployment = await this.prisma.deployment.findFirst({
      where: {
        projectId: domainRecord.projectId,
        status: DeploymentStatus.READY,
        type: 'PRODUCTION',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!deployment) {
      console.warn(
        `No production deployment found for domain: ${domain}`,
      );
      return null;
    }

    return {
      deploymentUrl: deployment.url || `http://localhost:3000`,
      projectId: domainRecord.projectId,
      deploymentId: deployment.id,
    };
  }

  async invalidateCache(domain: string): Promise<void> {
    if (this.redis) {
      try {
        const cacheKey = `deployx:route:${domain}`;
        await this.redis.del(cacheKey);
        console.log(`Invalidated route cache for ${domain}`);
      } catch {
        console.warn('Redis cache invalidation failed');
      }
    }
  }
}
