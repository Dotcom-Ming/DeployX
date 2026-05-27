import { Job } from 'bullmq';
import { PrismaClient } from '@deployx/database';
import { FrameworkDetector, DetectedFramework } from './framework-detector';
import { LocalBuilder } from './local-builder';
import { LogStreamService } from './log-stream.service';
import { ArtifactStorageService } from './artifact-storage.service';
import { DeploymentStatus } from '@deployx/shared';

export interface BuildJobData {
  deploymentId: string;
  projectId: string;
  repoUrl?: string;
  branch?: string;
  commitSha?: string;
  rootDir?: string;
  isRollback?: boolean;
  targetUrl?: string;
  useKaniko?: boolean;
}

export class BuildProcessor {
  private readonly prisma = new PrismaClient();
  private readonly artifactStorage = new ArtifactStorageService();

  constructor(
    private readonly frameworkDetector: FrameworkDetector,
    private readonly localBuilder: LocalBuilder,
    private readonly logStream: LogStreamService,
  ) {}

  async process(job: Job<BuildJobData>): Promise<void> {
    const { deploymentId, projectId, repoUrl, branch, commitSha, rootDir, isRollback, targetUrl, useKaniko } = job.data;
    console.log(`Processing build for deployment ${deploymentId}`);
    const startTime = Date.now();

    try {
      if (isRollback && targetUrl) {
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: { status: DeploymentStatus.READY, url: targetUrl },
        });
        await this.logStream.emitLog(deploymentId, `Rollback deployment ready at ${targetUrl}`, 'info');
        return;
      }

      if (useKaniko) {
        await this.processKanikoBuild(job);
        return;
      }

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.BUILDING },
      });

      await this.logStream.emitLog(deploymentId, `Starting build for deployment ${deploymentId}`, 'info');

      await job.updateProgress(10);
      const projectDir = await this.cloneStep(deploymentId, repoUrl, branch, commitSha);

      await job.updateProgress(30);
      const frameworkInfo = await this.detectFrameworkStep(deploymentId, projectDir, rootDir);

      await job.updateProgress(50);
      await this.installStep(deploymentId, projectDir, frameworkInfo);

      await job.updateProgress(70);
      await this.buildStep(deploymentId, projectDir, frameworkInfo);

      await job.updateProgress(85);
      await this.uploadArtifactStep(deploymentId, projectId, projectDir, frameworkInfo);

      await job.updateProgress(100);
      const buildDuration = Math.round((Date.now() - startTime) / 1000);

      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      const deploymentUrl = this.generateDeploymentUrl(project?.slug || projectId, deploymentId);

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.READY, url: deploymentUrl, buildDuration },
      });

      await this.logStream.emitLog(deploymentId, `Build completed successfully in ${buildDuration}s. URL: ${deploymentUrl}`, 'info');
      console.log(`Build completed for deployment ${deploymentId} in ${buildDuration}s`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Build failed for deployment ${deploymentId}: ${err.message}`);
      await this.logStream.emitLog(deploymentId, `Build failed: ${err.message}`, 'error');
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.ERROR },
      });
      throw error;
    }
  }

  private async cloneStep(deploymentId: string, repoUrl: string | undefined, branch: string | undefined, commitSha: string | undefined): Promise<string> {
    if (!repoUrl) throw new Error('Repository URL is required for build');
    await this.logStream.emitLog(deploymentId, `Cloning repository: ${repoUrl} (branch: ${branch || 'main'})`, 'info');
    const projectDir = await this.localBuilder.cloneRepo(repoUrl, branch || 'main', commitSha);
    await this.logStream.emitLog(deploymentId, 'Repository cloned successfully', 'info');
    return projectDir;
  }

  private async detectFrameworkStep(deploymentId: string, projectDir: string, rootDir?: string) {
    const effectiveDir = rootDir && rootDir !== '/' ? `${projectDir}/${rootDir}` : projectDir;
    await this.logStream.emitLog(deploymentId, 'Detecting framework...', 'info');
    const frameworkInfo = await this.frameworkDetector.detectFramework(effectiveDir);
    await this.logStream.emitLog(deploymentId, `Detected framework: ${frameworkInfo.framework} (build: ${frameworkInfo.buildCmd}, output: ${frameworkInfo.outputDir})`, 'info');
    return frameworkInfo;
  }

  private async installStep(deploymentId: string, projectDir: string, frameworkInfo: { installCmd: string }) {
    await this.logStream.emitLog(deploymentId, `Installing dependencies: ${frameworkInfo.installCmd}`, 'info');
    await this.localBuilder.installDependencies(projectDir, frameworkInfo.installCmd, (line: string) => {
      this.logStream.emitLog(deploymentId, line, 'info');
    });
    await this.logStream.emitLog(deploymentId, 'Dependencies installed successfully', 'info');
  }

  private async buildStep(deploymentId: string, projectDir: string, frameworkInfo: { buildCmd: string; outputDir: string }) {
    await this.logStream.emitLog(deploymentId, `Building project: ${frameworkInfo.buildCmd}`, 'info');
    await this.localBuilder.executeBuild(projectDir, frameworkInfo.buildCmd, (line: string) => {
      this.logStream.emitLog(deploymentId, line, 'info');
    });
    await this.logStream.emitLog(deploymentId, `Build completed. Output directory: ${frameworkInfo.outputDir}`, 'info');
  }

  private async uploadArtifactStep(
    deploymentId: string,
    projectId: string,
    projectDir: string,
    frameworkInfo: { outputDir: string },
  ): Promise<void> {
    if (!this.artifactStorage.isConfigured) {
      await this.logStream.emitLog(deploymentId, 'Artifact storage not configured, skipping upload', 'warn');
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    const outputDir = path.resolve(projectDir, frameworkInfo.outputDir);

    if (fs.existsSync(outputDir)) {
      await this.logStream.emitLog(deploymentId, `Uploading build artifacts from ${frameworkInfo.outputDir}...`, 'info');
      try {
        const result = await this.artifactStorage.uploadBuildArtifact(projectId, deploymentId, outputDir);
        if (result) {
          await this.logStream.emitLog(deploymentId, `Build artifacts uploaded: ${result.key} (${(result.size / 1024 / 1024).toFixed(2)} MB)`, 'info');

          await this.prisma.deployment.update({
            where: { id: deploymentId },
            data: { buildLogsUrl: result.url },
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await this.logStream.emitLog(deploymentId, `Artifact upload failed: ${err.message}`, 'warn');
      }
    }
  }

  private async processKanikoBuild(job: Job<BuildJobData>): Promise<void> {
    const { deploymentId, projectId, repoUrl, branch, commitSha } = job.data;
    const startTime = Date.now();

    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.BUILDING },
    });

    await this.logStream.emitLog(deploymentId, 'Starting Kaniko container build...', 'info');

    try {
      const { generateBuildJob } = await import('./k8s-job.templates');
      const deployment = await this.prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { project: true },
      });

      if (!deployment || !deployment.project) {
        throw new Error('Deployment or project not found');
      }

      const jobYaml = generateBuildJob(deployment as any);

      const { execSync } = await import('child_process');
      const tmpFile = `/tmp/build-job-${deploymentId.slice(-8)}.yaml`;

      const fs = await import('fs');
      fs.writeFileSync(tmpFile, jobYaml);

      await this.logStream.emitLog(deploymentId, 'Submitting Kaniko build job to Kubernetes...', 'info');
      await job.updateProgress(20);

      execSync(`kubectl apply -f ${tmpFile}`, { timeout: 30000 });

      await this.logStream.emitLog(deploymentId, 'Kaniko build job submitted. Waiting for completion...', 'info');
      await job.updateProgress(40);

      const jobName = `build-${deploymentId.slice(-8)}`;
      const maxWaitTime = 10 * 60 * 1000;
      const pollInterval = 10000;
      const startWait = Date.now();

      while (Date.now() - startWait < maxWaitTime) {
        try {
          const result = execSync(
            `kubectl get job ${jobName} -n deployx-builder -o jsonpath='{.status.conditions[0].type}'`,
            { timeout: 10000, encoding: 'utf-8' },
          ).trim();

          if (result === 'Complete') {
            await this.logStream.emitLog(deploymentId, 'Kaniko build completed successfully', 'info');
            break;
          } else if (result === 'Failed') {
            throw new Error('Kaniko build job failed');
          }

          const progress = Math.min(90, 40 + ((Date.now() - startWait) / maxWaitTime) * 50);
          await job.updateProgress(progress);
        } catch (pollError: any) {
          if (pollError.message?.includes('Failed')) {
            throw new Error('Kaniko build job failed');
          }
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      try {
        fs.unlinkSync(tmpFile);
      } catch {}

      const buildDuration = Math.round((Date.now() - startTime) / 1000);
      const registry = process.env.BUILDER_REGISTRY || 'registry.deployx.app';
      const imageTag = `${registry}/${projectId}:${commitSha || 'latest'}`;

      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      const deploymentUrl = this.generateDeploymentUrl(project?.slug || projectId, deploymentId);

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.READY,
          url: deploymentUrl,
          buildDuration,
          buildLogsUrl: imageTag,
        },
      });

      await job.updateProgress(100);
      await this.logStream.emitLog(deploymentId, `Kaniko build completed in ${buildDuration}s. Image: ${imageTag}`, 'info');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.logStream.emitLog(deploymentId, `Kaniko build failed: ${err.message}`, 'error');
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.ERROR },
      });
      throw error;
    }
  }

  private generateDeploymentUrl(projectSlug: string, deploymentId: string): string {
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
    const hash = deploymentId.slice(-8);
    return `https://${projectSlug}-${hash}.${defaultDomain}`;
  }
}
