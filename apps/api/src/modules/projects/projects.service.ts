import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@deployx/database';
import { FrameworkDetectorService } from './framework-detector.service';
import { PLAN_LIMITS, Plan } from '@deployx/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly frameworkDetector: FrameworkDetectorService) {}

  async list(orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const projects = await prisma.project.findMany({
      where: { orgId: organization.id },
      orderBy: { updatedAt: 'desc' },
    });

    return projects;
  }

  async create(orgSlug: string, userId: string, data: {
    name: string;
    framework?: string;
    gitProvider?: string;
    repositoryUrl: string;
    branch: string;
    rootDirectory?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
  }) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const membership = organization.memberships[0];
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN' && membership.role !== 'DEVELOPER')) {
      throw new ForbiddenException('You do not have permission to create projects in this organization');
    }

    // Check project limit based on plan
    const projectCount = await prisma.project.count({
      where: { orgId: organization.id },
    });

    const plan = (organization.plan as Plan) || Plan.HOBBY;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.HOBBY];

    if (limits.projects > 0 && projectCount >= limits.projects) {
      throw new BadRequestException(
        `Project limit reached (${projectCount}/${limits.projects}). Upgrade your plan to create more projects.`,
      );
    }

    const slug = this.generateSlug(data.name);

    const existingProject = await prisma.project.findUnique({
      where: {
        orgId_slug: {
          orgId: organization.id,
          slug,
        },
      },
    });

    if (existingProject) {
      throw new ConflictException('A project with this name already exists in the organization');
    }

    let framework = data.framework || 'OTHER';
    let buildCmd = data.buildCommand;
    let outputDir = data.outputDirectory;
    let installCmd = data.installCommand;

    if (!buildCmd || !outputDir) {
      try {
        const detection = await this.frameworkDetector.detect(data.repositoryUrl, data.rootDirectory || '/');
        framework = data.framework || detection.framework;
        buildCmd = buildCmd || detection.buildCmd;
        outputDir = outputDir || detection.outputDir;
        installCmd = installCmd || detection.installCmd;
      } catch {
        // Framework detection failed, use defaults
      }
    }

    const project = await prisma.project.create({
      data: {
        orgId: organization.id,
        name: data.name,
        slug,
        framework: framework as any,
        gitProvider: (data.gitProvider || 'GITHUB') as any,
        gitRepo: data.repositoryUrl,
        rootDir: data.rootDirectory || '/',
        buildCmd,
        outputDir,
        installCmd,
      },
    });

    return project;
  }

  async get(orgSlug: string, projectId: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        orgId: organization.id,
      },
      include: {
        domains: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(orgSlug: string, projectId: string, data: {
    name?: string;
    branch?: string;
    rootDirectory?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
  }) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        orgId: organization.id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.branch !== undefined) updateData.branch = data.branch;
    if (data.rootDirectory !== undefined) updateData.rootDir = data.rootDirectory;
    if (data.buildCommand !== undefined) updateData.buildCmd = data.buildCommand;
    if (data.outputDirectory !== undefined) updateData.outputDir = data.outputDirectory;
    if (data.installCommand !== undefined) updateData.installCmd = data.installCommand;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return updated;
  }

  async delete(orgSlug: string, projectId: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        orgId: organization.id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { deleted: true };
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return baseSlug;
  }
}
