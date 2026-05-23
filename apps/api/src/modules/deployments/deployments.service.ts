import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@deployx/database';
import { DeploymentStatus, DeploymentType } from '@deployx/shared';
import { buildOffsetQuery } from '@deployx/shared';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @Optional() @InjectQueue('build') private readonly buildQueue?: Queue,
  ) {}

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

    this.logger.log(`Deployment ${deployment.id} created and queued for build`);

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

    this.logger.log(`Deployment ${deploymentId} cancelled`);

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

    this.logger.log(`Redeployment ${redeployment.id} created from ${deploymentId}`);

    return redeployment;
  }
}
