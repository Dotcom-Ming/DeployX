import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { prisma } from '@deployx/database';

@Injectable()
export class UsageCheckCron {
  private readonly logger = new Logger(UsageCheckCron.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkAllOrganizations() {
    this.logger.log('Running usage limit check for all organizations');

    const organizations = await prisma.organization.findMany({
      select: { id: true },
    });

    for (const org of organizations) {
      try {
        await this.notificationsService.checkUsageLimits(org.id);
      } catch (error) {
        this.logger.error(`Failed to check usage limits for org ${org.id}`, error);
      }
    }

    this.logger.log(`Usage limit check completed for ${organizations.length} organizations`);
  }
}
