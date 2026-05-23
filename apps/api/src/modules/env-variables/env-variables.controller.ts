import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EnvVariablesService } from './env-variables.service';
import { createEnvSchema } from './dto/create-env.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/projects/:id/env')
@UseGuards(JwtAuthGuard)
export class EnvVariablesController {
  constructor(private readonly envVariablesService: EnvVariablesService) {}

  @Get()
  async list(@Param('id') projectId: string) {
    return this.envVariablesService.list(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('id') projectId: string,
    @Body() body: unknown,
  ) {
    const data = createEnvSchema.parse(body);
    return this.envVariablesService.create(projectId, data.key, data.value, data.target);
  }

  @Patch(':varId')
  async update(
    @Param('varId') varId: string,
    @Body() body: { key?: string; value?: string; target?: string },
  ) {
    return this.envVariablesService.update(varId, body);
  }

  @Delete(':varId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('varId') varId: string) {
    return this.envVariablesService.remove(varId);
  }
}
