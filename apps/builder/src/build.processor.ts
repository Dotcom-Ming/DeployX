import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@deployx/database';
import { FrameworkDetector } from './framework-detector';
import { LocalBuilder } from './local-builder';
import { LogStreamService } from './log-stream.service';
import { DeploymentStatus } from '@deployx/shared';

export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  repoUrl?: string;
  branch?: string;
  commitSha?: string;
  rootDir?: string;
}

@Injectable()
@Processor('build')
export class BuildProcessor extends WorkerHost {
  private readonly logger = new Logger(BuildProcessor.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly frameworkDetector: FrameworkDetector,
    private readonly localBuilder: LocalBuilder,
    private readonly logStream: LogStreamService,
  ) {
    super();
  }

  async process(job: Job<BuildJobData>): Promise<void> {
    const { deploymentId, projectId, repoUrl, branch, commitSha, rootDir } =
      job.data;

    this.logger.log(`Processing build for deployment ${deploymentId}`);
    const startTime = Date.now();

    try {
      // Update deployment status to BUILDING
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.BUILDING },
      });

      await this.logStream.emitLog(
        deploymentId,
        `Starting build for deployment ${deploymentId}`,
        'info',
      );

      // Step 1: Clone repository
      await job.updateProgress(10);
      const projectDir = await this.cloneStep(
        deploymentId,
        repoUrl,
        branch,
        commitSha,
      );

      // Step 2: Detect framework
      await job.updateProgress(30);
      const frameworkInfo = await this.detectFrameworkStep(
        deploymentId,
        projectDir,
        rootDir,
      );

      // Step 3: Install dependencies
      await job.updateProgress(50);
      await this.installStep(deploymentId, projectDir, frameworkInfo);

      // Step 4: Build project
      await job.updateProgress(70);
      await this.buildStep(deploymentId, projectDir, frameworkInfo);

      // Step 5: Mark as READY
      await job.updateProgress(100);
      const buildDuration = Math.round((Date.now() - startTime) / 1000);

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      const deploymentUrl = this.generateDeploymentUrl(
        project?.slug || projectId,
        deploymentId,
      );

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.READY,
          url: deploymentUrl,
          buildDuration,
        },
      });

      await this.logStream.emitLog(
        deploymentId,
        `Build completed successfully in ${buildDuration}s. URL: ${deploymentUrl}`,
        'info',
      );

      this.logger.log(
        `Build completed for deployment ${deploymentId} in ${buildDuration}s`,
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Build failed for deployment ${deploymentId}: ${err.message}`,
        err.stack,
      );

      await this.logStream.emitLog(
        deploymentId,
        `Build failed: ${err.message}`,
        'error',
      );

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.ERROR },
      });

      throw error;
    }
  }

  private async cloneStep(
    deploymentId: string,
    repoUrl: string | undefined,
    branch: string | undefined,
    commitSha: string | undefined,
  ): Promise<string> {
    if (!repoUrl) {
      throw new Error('Repository URL is required for build');
    }

    await this.logStream.emitLog(
      deploymentId,
      `Cloning repository: ${repoUrl} (branch: ${branch || 'main'})`,
      'info',
    );

    const projectDir = await this.localBuilder.cloneRepo(
      repoUrl,
      branch || 'main',
      commitSha,
    );

    await this.logStream.emitLog(
      deploymentId,
      'Repository cloned successfully',
      'info',
    );

    return projectDir;
  }

  private async detectFrameworkStep(
    deploymentId: string,
    projectDir: string,
    rootDir?: string,
  ) {
    const effectiveDir = rootDir && rootDir !== '/'
      ? `${projectDir}/${rootDir}`
      : projectDir;

    await this.logStream.emitLog(
      deploymentId,
      'Detecting framework...',
      'info',
    );

    const frameworkInfo =
      await this.frameworkDetector.detectFramework(effectiveDir);

    await this.logStream.emitLog(
      deploymentId,
      `Detected framework: ${frameworkInfo.framework} (build: ${frameworkInfo.buildCmd}, output: ${frameworkInfo.outputDir})`,
      'info',
    );

    return frameworkInfo;
  }

  private async installStep(
    deploymentId: string,
    projectDir: string,
    frameworkInfo: { installCmd: string },
  ) {
    await this.logStream.emitLog(
      deploymentId,
      `Installing dependencies: ${frameworkInfo.installCmd}`,
      'info',
    );

    await this.localBuilder.installDependencies(
      projectDir,
      frameworkInfo.installCmd,
      (line: string) => {
        this.logStream.emitLog(deploymentId, line, 'info');
      },
    );

    await this.logStream.emitLog(
      deploymentId,
      'Dependencies installed successfully',
      'info',
    );
  }

  private async buildStep(
    deploymentId: string,
    projectDir: string,
    frameworkInfo: { buildCmd: string; outputDir: string },
  ) {
    await this.logStream.emitLog(
      deploymentId,
      `Building project: ${frameworkInfo.buildCmd}`,
      'info',
    );

    await this.localBuilder.executeBuild(
      projectDir,
      frameworkInfo.buildCmd,
      (line: string) => {
        this.logStream.emitLog(deploymentId, line, 'info');
      },
    );

    await this.logStream.emitLog(
      deploymentId,
      `Build completed. Output directory: ${frameworkInfo.outputDir}`,
      'info',
    );
  }

  private generateDeploymentUrl(
    projectSlug: string,
    deploymentId: string,
  ): string {
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
    const hash = deploymentId.slice(-8);
    return `https://${projectSlug}-${hash}.${defaultDomain}`;
  }
}
