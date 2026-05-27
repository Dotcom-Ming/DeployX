import * as crypto from 'crypto';
import { prisma } from '@deployx/database';

export interface InstallationRepositories {
  added: Array<{ full_name: string; id: number }>;
  removed: Array<{ full_name: string; id: number }>;
}

export class GitHubAppService {
  private readonly appId = process.env.GITHUB_APP_ID || '';
  private readonly privateKey = process.env.GITHUB_APP_PRIVATE_KEY || '';
  private readonly webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET || '';
  private readonly clientSecret = process.env.GITHUB_APP_CLIENT_SECRET || '';
  private readonly clientId = process.env.GITHUB_APP_CLIENT_ID || '';

  getInstallationUrl(orgSlug?: string): string {
    const baseUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME || 'deployx'}/installations`;
    const params = orgSlug ? `?state=${orgSlug}` : '';
    return `${baseUrl}${params}`;
  }

  getOAuthAuthorizeUrl(state: string): string {
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&state=${state}&scope=repo,user:email`;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;

    const expected = `sha256=${crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex')}`;

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private generateJwt(): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iat: now - 60,
      exp: now + (10 * 60),
      iss: this.appId,
    };

    const jose = require('jose');
    const key = jose.importPKCS8(this.privateKey, 'RS256');

    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .sign(key);
  }

  async getInstallationAccessToken(installationId: number): Promise<string> {
    const jwt = await this.generateJwt();

    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'DeployX',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get installation access token: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return data.token;
  }

  async handleInstallationEvent(body: any): Promise<void> {
    const action = body.action;
    const installation = body.installation;
    const repositories = body.repositories || [];

    if (!installation) return;

    const installationId = installation.id;
    const accountId = installation.account?.id;
    const accountLogin = installation.account?.login;
    const accountType = installation.account?.type;

    console.log(`GitHub App ${action} for ${accountLogin} (installation: ${installationId})`);

    if (action === 'created' || action === 'new_permissions_accepted') {
      for (const repo of repositories) {
        await this.registerRepository(installationId, accountLogin, repo.full_name, repo.id);
      }
    } else if (action === 'deleted') {
      await prisma.project.updateMany({
        where: {
          gitProvider: 'GITHUB',
          gitRepo: { in: repositories.map((r: any) => r.full_name) },
        },
        data: {
          gitRepo: undefined,
          gitProvider: undefined,
        },
      });
    }
  }

  async handleInstallationRepositoriesEvent(body: any): Promise<void> {
    const installation = body.installation;
    const installationId = installation?.id;
    const accountLogin = installation?.account?.login;

    const reposAdded = body.repositories_added || [];
    const reposRemoved = body.repositories_removed || [];

    for (const repo of reposAdded) {
      await this.registerRepository(installationId, accountLogin, repo.full_name, repo.id);
    }

    if (reposRemoved.length > 0) {
      await prisma.project.updateMany({
        where: {
          gitProvider: 'GITHUB',
          gitRepo: { in: reposRemoved.map((r: any) => r.full_name) },
        },
        data: {
          gitRepo: undefined,
          gitProvider: undefined,
        },
      });
    }
  }

  private async registerRepository(
    installationId: number,
    accountLogin: string | undefined,
    repoFullName: string,
    repoId: number,
  ): Promise<void> {
    await prisma.project.updateMany({
      where: {
        gitProvider: 'GITHUB',
        gitRepo: repoFullName,
      },
      data: {
        buildCmd: undefined,
      },
    });

    console.log(`Registered repository ${repoFullName} for installation ${installationId}`);
  }

  async listInstallationRepositories(installationId: number): Promise<Array<{ full_name: string; id: number; private: boolean }>> {
    const token = await this.getInstallationAccessToken(installationId);

    const repos: Array<{ full_name: string; id: number; private: boolean }> = [];
    let page = 1;

    while (true) {
      const response = await fetch(
        `https://api.github.com/installation/repositories?page=${page}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'DeployX',
          },
        },
      );

      if (!response.ok) break;

      const data = await response.json() as any;
      const batch = data.repositories || [];
      repos.push(...batch);

      if (batch.length < 100) break;
      page++;
    }

    return repos;
  }

  async exchangeOAuthCode(code: string): Promise<{ accessToken: string; installationId?: number }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange GitHub App OAuth code: ${response.status}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      installationId: data.installation_id,
    };
  }
}
