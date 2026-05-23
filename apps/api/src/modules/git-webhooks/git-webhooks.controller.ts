import { Controller, Post, Headers, Body, HttpCode, HttpStatus, RawBodyRequest, Req } from '@nestjs/common';
import { GitWebhooksService } from './git-webhooks.service';

@Controller('webhooks')
export class GitWebhooksController {
  constructor(private readonly gitWebhooksService: GitWebhooksService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGitHub(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    return this.gitWebhooksService.handleGitHubWebhook(headers, body);
  }

  @Post('gitlab')
  @HttpCode(HttpStatus.OK)
  async handleGitLab(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    return this.gitWebhooksService.handleGitLabWebhook(headers, body);
  }

  @Post('bitbucket')
  @HttpCode(HttpStatus.OK)
  async handleBitbucket(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ) {
    return this.gitWebhooksService.handleBitbucketWebhook(headers, body);
  }
}
