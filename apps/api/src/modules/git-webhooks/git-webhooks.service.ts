import { PrismaClient } from '@deployx/database';
import { DeploymentsService } from '../deployments/deployments.service';
import { GitHubService } from './github.service';
import { GitLabService } from './gitlab.service';
import { BitbucketService } from './bitbucket.service';
import { DeploymentType } from '@deployx/shared';
import * as crypto from 'crypto';

export class GitWebhooksService {
  private prisma = new PrismaClient();
  private deploymentsService = new DeploymentsService();
  private githubService = new GitHubService();
  private gitlabService = new GitLabService();
  private bitbucketService = new BitbucketService();

  private generatePreviewDomain(projectSlug: string, branch: string, prNumber: number): string {
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
    const safeBranch = branch.replace(/[^a-z0-9-]/g, '-').substring(0, 20);
    const hash = crypto.randomBytes(4).toString('hex');
    return `${projectSlug}-${safeBranch}-${hash}.${defaultDomain}`;
  }

  private generateProductionDomain(projectSlug: string): string {
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
    const hash = crypto.randomBytes(4).toString('hex');
    return `${projectSlug}-${hash}.${defaultDomain}`;
  }

  async handleGitHubWebhook(headers: Record<string, string>, body: any) {
    const signature = headers['x-hub-signature-256'] || headers['x-hub-signature'] || '';
    const event = headers['x-github-event'] || '';
    const secret = process.env.GITHUB_WEBHOOK_SECRET || '';

    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    if (!this.githubService.verifySignature(rawBody, signature, secret)) {
      console.warn('GitHub webhook signature verification failed');
      throw new Error('Invalid signature');
    }

    console.log(`GitHub webhook received: ${event}`);

    if (event === 'push') {
      const parsed = this.githubService.parsePushEvent(body);
      if (parsed) {
        await this.processPushEvent(parsed.repo, parsed.branch, parsed.commitSha, parsed.commitMessage);
      }
    } else if (event === 'pull_request') {
      const parsed = this.githubService.parsePullRequestEvent(body);
      if (parsed && ['opened', 'synchronize', 'reopened'].includes(parsed.action)) {
        await this.processPullRequestEvent(parsed.repo, parsed.prNumber, parsed.branch, parsed.commitSha, 'github');
      }
    }

    return { processed: true };
  }

  async handleGitLabWebhook(headers: Record<string, string>, body: any) {
    const token = headers['x-gitlab-token'] || '';
    const secret = process.env.GITLAB_WEBHOOK_SECRET || '';

    if (!this.gitlabService.verifyToken(token, secret)) {
      console.warn('GitLab webhook token verification failed');
      throw new Error('Invalid token');
    }

    const eventKind = body.object_kind || '';
    console.log(`GitLab webhook received: ${eventKind}`);

    if (eventKind === 'push') {
      const parsed = this.gitlabService.parsePushEvent(body);
      if (parsed) {
        await this.processPushEvent(parsed.repo, parsed.branch, parsed.commitSha, parsed.commitMessage);
      }
    } else if (eventKind === 'merge_request') {
      const parsed = this.gitlabService.parseMergeRequestEvent(body);
      if (parsed && ['open', 'update', 'reopen'].includes(parsed.action)) {
        await this.processPullRequestEvent(parsed.repo, parsed.mrNumber, parsed.branch, parsed.commitSha, 'gitlab');
      }
    }

    return { processed: true };
  }

  async handleBitbucketWebhook(headers: Record<string, string>, body: any) {
    console.log('Bitbucket webhook received');

    const eventKey = headers['x-event-key'] || body.eventKey || '';

    if (eventKey === 'repo:push') {
      const parsed = this.bitbucketService.parsePushEvent(body);
      if (parsed) {
        await this.processPushEvent(parsed.repo, parsed.branch, parsed.commitSha, parsed.commitMessage);
      }
    } else if (eventKey.startsWith('pullrequest:')) {
      const parsed = this.bitbucketService.parsePullRequestEvent(body);
      if (parsed && ['created', 'updated', 'fulfilled'].includes(parsed.action)) {
        await this.processPullRequestEvent(parsed.repo, parsed.prNumber, parsed.branch, parsed.commitSha, 'bitbucket');
      }
    }

    return { processed: true };
  }

  async processPushEvent(
    repo: string,
    branch: string,
    commitSha: string,
    commitMessage: string,
  ) {
    console.log(`Processing push event: ${repo} branch=${branch} sha=${commitSha}`);

    const project = await this.prisma.project.findFirst({ where: { gitRepo: repo } });
    if (project) {
      const deploymentUrl = this.generateProductionDomain(project.slug);

      await this.deploymentsService.create(project.id, 'webhook', {
        branch,
        commitSha,
        type: DeploymentType.PRODUCTION,
      });

      console.log(`Production deployment triggered for project ${project.id}, URL: ${deploymentUrl}`);
    }
  }

  async processPullRequestEvent(
    repo: string,
    prNumber: number,
    branch: string,
    commitSha: string,
    provider: 'github' | 'gitlab' | 'bitbucket' = 'github',
  ) {
    console.log(`Processing PR event: ${repo} pr=#${prNumber} branch=${branch} sha=${commitSha}`);

    const project = await this.prisma.project.findFirst({ where: { gitRepo: repo } });
    if (project) {
      const previewUrl = this.generatePreviewDomain(project.slug, branch, prNumber);

      const deployment = await this.deploymentsService.create(project.id, 'webhook', {
        branch,
        commitSha,
        type: DeploymentType.PREVIEW,
      });

      console.log(`Preview deployment triggered for project ${project.id}, URL: ${previewUrl}`);

      if (provider === 'github') {
        await this.githubService.createPRComment(repo, prNumber, previewUrl, 'building');
      }

      if (deployment?.id) {
        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: { url: previewUrl },
        });
      }
    }
  }
}
