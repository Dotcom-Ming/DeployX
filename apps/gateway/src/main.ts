import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Don't set a global prefix - gateway needs to catch all routes
  app.enableCors();

  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`DeployX Gateway Service running on port ${port}`);
}

bootstrap();
