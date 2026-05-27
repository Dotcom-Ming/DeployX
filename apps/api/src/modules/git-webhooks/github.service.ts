import * as crypto from 'crypto';

export class GitHubService {

  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) {
      return false;
    }

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  parsePushEvent(body: any): {
    branch: string;
    commitSha: string;
    commitMessage: string;
    repo: string;
  } | null {
    try {
      const ref = body.ref as string;
      if (!ref || !ref.startsWith('refs/heads/')) {
        return null;
      }

      const branch = ref.replace('refs/heads/', '');
      const headCommit = body.head_commit || (body.commits && body.commits[0]);

      return {
        branch,
        commitSha: headCommit?.id || '',
        commitMessage: headCommit?.message || '',
        repo: body.repository?.full_name || '',
      };
    } catch (error) {
      console.error('Failed to parse GitHub push event', error);
      return null;
    }
  }

  parsePullRequestEvent(body: any): {
    prNumber: number;
    branch: string;
    commitSha: string;
    repo: string;
    action: string;
  } | null {
    try {
      const pr = body.pull_request;
      if (!pr) {
        return null;
      }

      return {
        prNumber: pr.number,
        branch: pr.head?.ref || '',
        commitSha: pr.head?.sha || '',
        repo: body.repository?.full_name || '',
        action: body.action || '',
      };
    } catch (error) {
      console.error('Failed to parse GitHub pull request event', error);
      return null;
    }
  }

  async createPRComment(
    repo: string,
    prNumber: number,
    deploymentUrl: string,
    status: 'success' | 'error' | 'building',
  ): Promise<void> {
    const token = process.env.GITHUB_APP_TOKEN || process.env.GITHUB_PAT;
    if (!token) {
      console.warn('GitHub token not configured, skipping PR comment');
      return;
    }

    const statusEmoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '🔄';
    const statusText = status === 'success' ? 'Deployed' : status === 'error' ? 'Deployment failed' : 'Deploying...';

    const body = `### ${statusEmoji} DeployX Preview ${statusText}

| Status | URL |
|--------|-----|
| ${statusText} | [${deploymentUrl}](${deploymentUrl}) |

---
*Powered by DeployX*`;

    try {
      const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'DeployX',
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create PR comment: ${response.status} ${errorText}`);
        return;
      }

      console.log(`PR comment created for ${repo}#${prNumber}`);
    } catch (error) {
      console.error('Failed to create PR comment', error);
    }
  }

  async updatePRComment(
    repo: string,
    commentId: number,
    deploymentUrl: string,
    status: 'success' | 'error' | 'building',
  ): Promise<void> {
    const token = process.env.GITHUB_APP_TOKEN || process.env.GITHUB_PAT;
    if (!token) {
      console.warn('GitHub token not configured, skipping PR comment update');
      return;
    }

    const statusEmoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '🔄';
    const statusText = status === 'success' ? 'Deployed' : status === 'error' ? 'Deployment failed' : 'Deploying...';

    const body = `### ${statusEmoji} DeployX Preview ${statusText}

| Status | URL |
|--------|-----|
| ${statusText} | [${deploymentUrl}](${deploymentUrl}) |

---
*Powered by DeployX*`;

    try {
      const url = `https://api.github.com/repos/${repo}/issues/comments/${commentId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'DeployX',
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update PR comment: ${response.status} ${errorText}`);
        return;
      }

      console.log(`PR comment updated for ${repo}#${commentId}`);
    } catch (error) {
      console.error('Failed to update PR comment', error);
    }
  }

  async findExistingPRComment(
    repo: string,
    prNumber: number,
  ): Promise<number | null> {
    const token = process.env.GITHUB_APP_TOKEN || process.env.GITHUB_PAT;
    if (!token) {
      return null;
    }

    try {
      const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'DeployX',
        },
      });

      if (!response.ok) {
        return null;
      }

      const comments = await response.json() as any[];
      const deployXComment = comments.find(
        (comment) => comment.body?.includes('Powered by DeployX'),
      );

      return deployXComment?.id || null;
    } catch {
      return null;
    }
  }
}
