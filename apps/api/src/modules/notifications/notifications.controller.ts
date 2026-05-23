import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.notificationsService.getNotifications(org.id, parseInt(limit || '20', 10));
  }

  @Get('unread-count')
  async getUnreadCount(@Param('slug') slug: string) {
    const org = await this.getOrgBySlug(slug);
    const count = await this.notificationsService.getUnreadCount(org.id);
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('slug') slug: string,
    @Param('id') notificationId: string,
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.notificationsService.markAsRead(notificationId, org.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Param('slug') slug: string) {
    const org = await this.getOrgBySlug(slug);
    return this.notificationsService.markAllAsRead(org.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Param('slug') slug: string,
    @Param('id') notificationId: string,
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.notificationsService.deleteNotification(notificationId, org.id);
  }

  private async getOrgBySlug(slug: string) {
    const { prisma } = await import('@deployx/database');
    const org = await prisma.organization.findUnique({
      where: { slug },
    });
    if (!org) {
      throw new Error('Organization not found');
    }
    return org;
  }
}
