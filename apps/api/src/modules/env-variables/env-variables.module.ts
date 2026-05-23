import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EnvVariablesController } from './env-variables.controller';
import { EnvVariablesService } from './env-variables.service';

@Module({
  imports: [PrismaModule],
  controllers: [EnvVariablesController],
  providers: [EnvVariablesService],
  exports: [EnvVariablesService],
})
export class EnvVariablesModule {}
