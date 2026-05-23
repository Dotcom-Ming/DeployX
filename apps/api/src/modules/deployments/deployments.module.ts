import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DeploymentsGateway } from './deployments.gateway';

const bullImports = process.env.REDIS_ENABLED !== 'false'
  ? [BullModule.registerQueue({ name: 'build' })]
  : [];

@Module({
  imports: [
    PrismaModule,
    ...bullImports,
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentsGateway],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
