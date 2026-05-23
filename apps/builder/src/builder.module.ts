import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BuildProcessor } from './build.processor';
import { FrameworkDetector } from './framework-detector';
import { LocalBuilder } from './local-builder';
import { LogStreamService } from './log-stream.service';

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
      BullModule.registerQueue({
        name: 'build',
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ...bullImports,
  ],
  providers: [
    BuildProcessor,
    FrameworkDetector,
    LocalBuilder,
    LogStreamService,
  ],
})
export class BuilderModule {}
