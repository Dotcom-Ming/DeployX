import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UsageCheckCron } from './usage-check.cron';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, UsageCheckCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
