import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('me/orgs')
  async getUserOrgs(@CurrentUser() user: { id: string }) {
    return this.usersService.getUserOrgs(user.id);
  }
}
