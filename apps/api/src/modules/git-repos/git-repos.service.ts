import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GitReposService {
  private readonly logger = new Logger(GitReposService.name);

  async fetchGitHubRepos(token: string) {
    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'DeployX',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json() as any[];

      return repos.map((repo) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
        provider: 'GITHUB',
        defaultBranch: repo.default_branch,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch GitHub repos', error);
      throw error;
    }
  }

  async fetchGitLabRepos(token: string) {
    try {
      const response = await fetch('https://gitlab.com/api/v4/projects?per_page=100&order_by=updated_at', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'DeployX',
        },
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.status}`);
      }

      const repos = await response.json() as any[];

      return repos.map((repo) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.path_with_namespace,
        private: repo.visibility !== 'public',
        htmlUrl: repo.web_url,
        description: repo.description,
        language: null,
        updatedAt: repo.last_activity_at,
        provider: 'GITLAB',
        defaultBranch: repo.default_branch,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch GitLab repos', error);
      throw error;
    }
  }
}
