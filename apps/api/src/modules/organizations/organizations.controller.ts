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
import { OrganizationsService } from './organizations.service';
import { MembershipRole } from '@deployx/shared';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: { name: string; slug?: string },
  ) {
    return this.organizationsService.create(user.id, body);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.organizationsService.getBySlug(slug);
  }

  @Patch(':slug')
  async update(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; slug?: string; plan?: string },
  ) {
    return this.organizationsService.update(slug, user.id, body);
  }

  @Delete(':slug')
  async delete(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationsService.delete(slug, user.id);
  }

  @Get(':slug/members')
  async getMembers(@Param('slug') slug: string) {
    return this.organizationsService.getMembers(slug);
  }

  @Post(':slug/members/invite')
  async inviteMember(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() body: { email: string; role: MembershipRole },
  ) {
    return this.organizationsService.inviteMember(slug, user.id, body.email, body.role);
  }

  @Patch(':slug/members/:id')
  async updateMember(
    @Param('slug') slug: string,
    @Param('id') memberId: string,
    @Body() body: { role: MembershipRole },
  ) {
    return this.organizationsService.updateMember(slug, memberId, body.role);
  }

  @Delete(':slug/members/:id')
  async removeMember(
    @Param('slug') slug: string,
    @Param('id') memberId: string,
  ) {
    return this.organizationsService.removeMember(slug, memberId);
  }
}
