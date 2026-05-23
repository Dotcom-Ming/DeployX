import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GitReposService } from './git-repos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('git-repos')
@UseGuards(JwtAuthGuard)
export class GitReposController {
  constructor(private readonly gitReposService: GitReposService) {}

  @Get('github')
  async getGitHubRepos(@Query('token') token?: string) {
    const accessToken = token || process.env.GITHUB_PAT;
    if (!accessToken) {
      throw new Error('GitHub token is required');
    }
    return this.gitReposService.fetchGitHubRepos(accessToken);
  }

  @Get('gitlab')
  async getGitLabRepos(@Query('token') token?: string) {
    const accessToken = token || process.env.GITLAB_PAT;
    if (!accessToken) {
      throw new Error('GitLab token is required');
    }
    return this.gitReposService.fetchGitLabRepos(accessToken);
  }
}
