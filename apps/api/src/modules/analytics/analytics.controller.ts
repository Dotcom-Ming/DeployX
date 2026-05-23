import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/projects/:id/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(
    @Param('id') projectId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getProjectAnalytics(
      projectId,
      parseInt(days || '7', 10),
    );
  }
}
