import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { FrameworkDetectorService } from './framework-detector.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, FrameworkDetectorService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
