import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { DomainsModule } from './modules/domains/domains.module';
import { EnvVariablesModule } from './modules/env-variables/env-variables.module';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { GitWebhooksModule } from './modules/git-webhooks/git-webhooks.module';
import { BillingModule } from './modules/billing/billing.module';
import { EmailModule } from './modules/email/email.module';
import { GitReposModule } from './modules/git-repos/git-repos.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

const bullModule = process.env.REDIS_ENABLED !== 'false'
  ? BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    })
  : { module: class BullMockModule {}, providers: [], exports: [] };

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AppConfigModule,
    PrismaModule,
    bullModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    DeploymentsModule,
    DomainsModule,
    EnvVariablesModule,
    ApiTokensModule,
    GitWebhooksModule,
    BillingModule,
    EmailModule,
    GitReposModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
  ],
})
export class AppModule {}
