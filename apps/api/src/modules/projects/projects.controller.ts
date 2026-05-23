import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createProjectSchema } from './dto/create-project.dto';
import { updateProjectSchema } from './dto/update-project.dto';

@Controller('orgs/:slug/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return this.projectsService.list(slug);
  }

  @Post()
  async create(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(createProjectSchema)) body: unknown,
  ) {
    const dto = body as {
      name: string;
      framework?: string;
      gitProvider?: string;
      repositoryUrl: string;
      branch: string;
      rootDirectory?: string;
      buildCommand?: string;
      outputDirectory?: string;
      installCommand?: string;
    };
    return this.projectsService.create(slug, user.id, dto);
  }

  @Get(':id')
  async get(
    @Param('slug') slug: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.get(slug, projectId);
  }

  @Patch(':id')
  async update(
    @Param('slug') slug: string,
    @Param('id') projectId: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: unknown,
  ) {
    const dto = body as {
      name?: string;
      branch?: string;
      rootDirectory?: string;
      buildCommand?: string;
      outputDirectory?: string;
      installCommand?: string;
    };
    return this.projectsService.update(slug, projectId, dto);
  }

  @Delete(':id')
  async delete(
    @Param('slug') slug: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.delete(slug, projectId);
  }
}
