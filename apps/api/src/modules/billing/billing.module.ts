import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { BillingService } from './billing.service';
import { UsageAggregationService } from './usage-aggregation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, UsageAggregationService],
  exports: [BillingService, UsageAggregationService],
})
export class BillingModule {}
