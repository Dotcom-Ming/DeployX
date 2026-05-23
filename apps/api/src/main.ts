import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { initSentry } from './common/monitoring/sentry';

async function bootstrap() {
  initSentry();

  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  try {
    const config = new DocumentBuilder()
      .setTitle('DeployX API')
      .setDescription('DeployX Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addOAuth2()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  } catch {
    // Swagger not available, skip setup
  }

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`DeployX API running on port ${port}`);
}

bootstrap();
