import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { UsageService } from './usage.service';
import { UsageAggregatorProcessor } from './usage-aggregator.processor';
import { QuotaService } from './quota.service';
import { InvoiceService } from './invoice.service';
import billingConfig from './config/billing.config';

const bullImports = process.env.REDIS_ENABLED !== 'false'
  ? [
      BullModule.forRootAsync({
        useFactory: () => ({
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
          },
        }),
      }),
      BullModule.registerQueue(
        { name: 'usage-aggregation' },
      ),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [billingConfig],
    }),
    ...bullImports,
  ],
  controllers: [StripeWebhookController],
  providers: [
    BillingService,
    StripeService,
    UsageService,
    UsageAggregatorProcessor,
    QuotaService,
    InvoiceService,
  ],
  exports: [BillingService, UsageService, QuotaService, InvoiceService],
})
export class BillingModule {}
