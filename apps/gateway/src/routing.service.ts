import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@deployx/database';
import { DeploymentStatus } from '@deployx/shared';
import Redis from 'ioredis';

export interface ResolvedRoute {
  deploymentUrl: string;
  projectId: string;
  deploymentId: string;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
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
        this.logger.warn('Redis connection failed, running without cache');
      }
    }
  }

  async resolveDomain(domain: string): Promise<ResolvedRoute | null> {
    // Check cache first
    if (this.redis) {
      try {
        const cacheKey = `deployx:route:${domain}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        this.logger.warn('Redis cache read failed, falling back to DB');
      }
    }

    let route: ResolvedRoute | null = null;

    if (domain.endsWith(`.${this.defaultDomain}`)) {
      route = await this.resolveDefaultDomain(domain);
    } else {
      route = await this.resolveCustomDomain(domain);
    }

    if (route && this.redis) {
      // Cache for 60 seconds
      try {
        const cacheKey = `deployx:route:${domain}`;
        await this.redis.set(cacheKey, JSON.stringify(route), 'EX', 60);
      } catch {
        this.logger.warn('Redis cache write failed');
      }
    }

    return route;
  }

  private async resolveDefaultDomain(
    domain: string,
  ): Promise<ResolvedRoute | null> {
    // Pattern: <project-slug>-<hash>.deployx.app
    const prefix = domain.slice(0, domain.length - this.defaultDomain.length - 1);
    const lastDashIndex = prefix.lastIndexOf('-');

    if (lastDashIndex === -1) {
      this.logger.warn(`Invalid default domain format: ${domain}`);
      return null;
    }

    const projectSlug = prefix.slice(0, lastDashIndex);
    const deploymentHash = prefix.slice(lastDashIndex + 1);

    // Try to find by deployment hash (last 8 chars of deployment ID)
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

    // Fallback: find by project slug and latest ready deployment
    const project = await this.prisma.project.findFirst({
      where: { slug: projectSlug },
    });

    if (!project) {
      this.logger.warn(`Project not found for slug: ${projectSlug}`);
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
      this.logger.warn(`No ready deployment found for project: ${projectSlug}`);
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
      this.logger.warn(`Domain not found or not verified: ${domain}`);
      return null;
    }

    // Find the latest production deployment for this project
    const deployment = await this.prisma.deployment.findFirst({
      where: {
        projectId: domainRecord.projectId,
        status: DeploymentStatus.READY,
        type: 'PRODUCTION',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!deployment) {
      this.logger.warn(
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
        this.logger.log(`Invalidated route cache for ${domain}`);
      } catch {
        this.logger.warn('Redis cache invalidation failed');
      }
    }
  }
}
