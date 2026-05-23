import { NestFactory } from '@nestjs/core';
import { BuilderModule } from './builder.module';

async function bootstrap() {
  const app = await NestFactory.create(BuilderModule);

  app.enableCors();

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`DeployX Builder Service running on port ${port}`);
}

bootstrap();
