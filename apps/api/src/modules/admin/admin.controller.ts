import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search = '',
    @Query('status') status = 'all',
  ) {
    return this.adminService.getUsers(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      status,
    );
  }

  @Post('users/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('organizations')
  async getOrganizations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search = '',
    @Query('plan') plan = 'all',
  ) {
    return this.adminService.getOrganizations(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      plan,
    );
  }

  @Get('deployments')
  async getDeployments(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status = 'all',
  ) {
    return this.adminService.getDeployments(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      status,
    );
  }

  @Get('billing')
  async getBilling() {
    return this.adminService.getBillingStats();
  }

  @Get('system')
  async getSystem() {
    return this.adminService.getSystemHealth();
  }
}
