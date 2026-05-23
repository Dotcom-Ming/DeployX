import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GitLabService {
  private readonly logger = new Logger(GitLabService.name);

  verifyToken(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false;
    }

    return token === secret;
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
      const commit = body.commits?.[0];

      return {
        branch,
        commitSha: body.after || commit?.id || '',
        commitMessage: commit?.message || '',
        repo: body.project?.path_with_namespace || '',
      };
    } catch (error) {
      this.logger.error('Failed to parse GitLab push event', error);
      return null;
    }
  }

  parseMergeRequestEvent(body: any): {
    mrNumber: number;
    branch: string;
    commitSha: string;
    repo: string;
    action: string;
  } | null {
    try {
      const mr = body.object_attributes;
      if (!mr) {
        return null;
      }

      return {
        mrNumber: mr.iid,
        branch: mr.source_branch || '',
        commitSha: mr.last_commit?.id || '',
        repo: body.project?.path_with_namespace || '',
        action: mr.action || body.object_kind || '',
      };
    } catch (error) {
      this.logger.error('Failed to parse GitLab merge request event', error);
      return null;
    }
  }
}
