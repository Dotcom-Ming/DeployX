import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { addDomainSchema } from './dto/add-domain.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/projects/:id/domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  async list(@Param('id') projectId: string) {
    return this.domainsService.list(projectId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Param('id') projectId: string,
    @Body() body: unknown,
  ) {
    const data = addDomainSchema.parse(body);
    return this.domainsService.add(projectId, data.domain);
  }

  @Delete(':domainId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('domainId') domainId: string) {
    return this.domainsService.remove(domainId);
  }

  @Post(':domainId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyDns(@Param('domainId') domainId: string) {
    return this.domainsService.verifyDns(domainId);
  }
}
