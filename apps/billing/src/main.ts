import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';
import { json, Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(BillingModule, {
    rawBody: true,
  });

  app.enableCors();

  // Use raw body for Stripe webhook endpoint
  app.use('/billing/webhooks/stripe', (req: Request, res: Response, next: NextFunction) => {
    // Stripe requires the raw body to verify webhook signatures
    // NestJS rawBody option stores the raw body on req.rawBody
    next();
  });

  app.use(json());

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`DeployX Billing Service running on port ${port}`);
}

bootstrap();
