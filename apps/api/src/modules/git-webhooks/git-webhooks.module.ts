import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeploymentsModule } from '../deployments/deployments.module';
import { GitWebhooksController } from './git-webhooks.controller';
import { GitWebhooksService } from './git-webhooks.service';
import { GitHubService } from './github.service';
import { GitLabService } from './gitlab.service';
import { BitbucketService } from './bitbucket.service';

@Module({
  imports: [PrismaModule, DeploymentsModule],
  controllers: [GitWebhooksController],
  providers: [GitWebhooksService, GitHubService, GitLabService, BitbucketService],
  exports: [GitWebhooksService],
})
export class GitWebhooksModule {}
