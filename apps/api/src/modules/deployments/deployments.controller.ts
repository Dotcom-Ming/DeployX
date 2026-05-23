import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { DeploymentsService } from './deployments.service';
import { createDeploymentSchema } from './dto/create-deployment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/projects/:id/deployments')
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  async list(
    @Param('id') projectId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = parseInt(page || '1', 10);
    const parsedPageSize = parseInt(pageSize || '20', 10);
    return this.deploymentsService.list(projectId, parsedPage, parsedPageSize);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: ExpressRequest & { user: { sub: string } },
    @Param('id') projectId: string,
    @Body() body: unknown,
  ) {
    const data = createDeploymentSchema.parse(body);
    const userId = req.user.sub;
    return this.deploymentsService.create(projectId, userId, data);
  }

  @Get(':did')
  async get(
    @Param('id') projectId: string,
    @Param('did') deploymentId: string,
  ) {
    return this.deploymentsService.get(deploymentId);
  }

  @Post(':did/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') projectId: string,
    @Param('did') deploymentId: string,
  ) {
    return this.deploymentsService.cancel(deploymentId);
  }

  @Post(':did/redeploy')
  @HttpCode(HttpStatus.CREATED)
  async redeploy(
    @Param('id') projectId: string,
    @Param('did') deploymentId: string,
  ) {
    return this.deploymentsService.redeploy(deploymentId);
  }
}
