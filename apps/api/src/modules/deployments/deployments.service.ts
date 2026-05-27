import { Queue } from 'bullmq';
import { prisma } from '@deployx/database';
import { DeploymentStatus, DeploymentType, buildOffsetQuery } from '@deployx/shared';

export class DeploymentsService {
  private buildQueue: Queue | null = null;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    if (process.env.REDIS_ENABLED !== 'false') {
      this.buildQueue = new Queue('build', {
        connection: { host: redisHost, port: redisPort, password: redisPassword },
      });
    }
  }

  async list(projectId: string, page: number = 1, pageSize: number = 20) {
    const { skip, take } = buildOffsetQuery(page, pageSize);

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          project: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.deployment.count({ where: { projectId } }),
    ]);

    return {
      data: deployments,
      pagination: {
        page,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async create(projectId: string, userId: string, data: { branch: string; commitSha?: string; type: DeploymentType }) {
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        branch: data.branch,
        commitSha: data.commitSha || 'HEAD',
        status: DeploymentStatus.QUEUED,
        type: data.type,
        triggeredById: userId,
      },
    });

    if (this.buildQueue) {
      await this.buildQueue.add('build', {
        deploymentId: deployment.id,
        projectId,
        branch: data.branch,
        commitSha: data.commitSha,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });
    }

    console.log(`Deployment ${deployment.id} created and queued for build`);

    return deployment;
  }

  async get(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    return deployment;
  }

  async cancel(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (deployment.status !== DeploymentStatus.QUEUED && deployment.status !== DeploymentStatus.BUILDING) {
      throw new Error('Only queued or building deployments can be canceled');
    }

    const promises: Promise<any>[] = [
      prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.CANCELLED },
      }),
    ];

    if (this.buildQueue) {
      promises.push(
        this.buildQueue.getJobs(['active', 'waiting', 'delayed']).then((jobs) => {
          const job = jobs.find((j) => j.data?.deploymentId === deploymentId);
          if (job) {
            return job.moveToFailed(new Error('Cancelled by user'), 'cancel');
          }
          return null;
        }),
      );
    }

    const [updated] = await Promise.all(promises);

    console.log(`Deployment ${deploymentId} cancelled`);

    return updated;
  }

  async redeploy(deploymentId: string) {
    const original = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!original) {
      throw new Error('Deployment not found');
    }

    const redeployment = await this.create(original.projectId, original.triggeredById || '', {
      branch: original.branch || 'main',
      commitSha: original.commitSha || undefined,
      type: original.type as DeploymentType,
    });

    console.log(`Redeployment ${redeployment.id} created from ${deploymentId}`);

    return redeployment;
  }

  async rollback(deploymentId: string, userId: string) {
    const target = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!target) {
      throw new Error('Deployment not found');
    }

    if (target.status !== DeploymentStatus.READY) {
      throw new Error('Only READY deployments can be rolled back to');
    }

    const currentProduction = await prisma.deployment.findFirst({
      where: {
        projectId: target.projectId,
        type: DeploymentType.PRODUCTION,
        status: DeploymentStatus.READY,
        id: { not: deploymentId },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rollback = await prisma.deployment.create({
      data: {
        projectId: target.projectId,
        branch: target.branch || 'main',
        commitSha: target.commitSha,
        commitMessage: target.commitMessage,
        status: DeploymentStatus.QUEUED,
        type: DeploymentType.ROLLBACK,
        url: target.url,
        triggeredById: userId,
      },
    });

    if (this.buildQueue) {
      await this.buildQueue.add('build', {
        deploymentId: rollback.id,
        projectId: target.projectId,
        branch: target.branch || 'main',
        commitSha: target.commitSha,
        isRollback: true,
        targetUrl: target.url,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }

    if (currentProduction) {
      await prisma.deployment.update({
        where: { id: currentProduction.id },
        data: { status: DeploymentStatus.CANCELLED },
      });
    }

    await prisma.deployment.update({
      where: { id: rollback.id },
      data: { status: DeploymentStatus.READY, url: target.url },
    });

    console.log(`Rollback ${rollback.id} created, restoring deployment ${deploymentId}`);

    return rollback;
  }

  async promote(deploymentId: string, userId: string) {
    const preview = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!preview) {
      throw new Error('Deployment not found');
    }

    if (preview.type !== DeploymentType.PREVIEW) {
      throw new Error('Only PREVIEW deployments can be promoted');
    }

    if (preview.status !== DeploymentStatus.READY) {
      throw new Error('Only READY deployments can be promoted');
    }

    const production = await prisma.deployment.create({
      data: {
        projectId: preview.projectId,
        branch: preview.branch || 'main',
        commitSha: preview.commitSha,
        commitMessage: preview.commitMessage,
        status: DeploymentStatus.QUEUED,
        type: DeploymentType.PRODUCTION,
        triggeredById: userId,
      },
    });

    if (this.buildQueue) {
      await this.buildQueue.add('build', {
        deploymentId: production.id,
        projectId: preview.projectId,
        branch: preview.branch || 'main',
        commitSha: preview.commitSha,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }

    console.log(`Promotion ${production.id} created from preview ${deploymentId}`);

    return production;
  }
}
