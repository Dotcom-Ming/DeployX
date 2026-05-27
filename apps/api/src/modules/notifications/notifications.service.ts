import { prisma } from '@deployx/database';
import { EmailService } from '../email/email.service';
import { PLAN_LIMITS, Plan } from '@deployx/shared';

export class NotificationsService {
  private emailService = new EmailService();

  async createNotification(data: {
    orgId: string;
    userId?: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        orgId: data.orgId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return notification;
  }

  async getNotifications(orgId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(orgId: string) {
    return prisma.notification.count({
      where: { orgId, read: false },
    });
  }

  async markAsRead(notificationId: string, orgId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, orgId },
      data: { read: true },
    });
  }

  async markAllAsRead(orgId: string) {
    return prisma.notification.updateMany({
      where: { orgId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string, orgId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, orgId },
    });
  }

  async checkUsageLimits(orgId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: true,
        projects: {
          select: { id: true },
        },
        memberships: {
          select: { id: true },
        },
      },
    });

    if (!organization) return;

    const plan = (organization.plan as Plan) || Plan.HOBBY;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.HOBBY];

    // Check project limit
    if (limits.projects > 0) {
      const projectCount = organization.projects.length;
      const usagePercent = (projectCount / limits.projects) * 100;

      if (usagePercent >= 100) {
        await this.sendLimitAlert(
          orgId,
          'PROJECT_LIMIT_EXCEEDED',
          `Project limit exceeded (${projectCount}/${limits.projects})`,
          `You've reached your project limit of ${limits.projects}. Upgrade your plan to create more projects.`,
          { current: projectCount, limit: limits.projects },
        );
      } else if (usagePercent >= 80) {
        await this.sendLimitAlert(
          orgId,
          'PROJECT_LIMIT_WARNING',
          `Project limit approaching (${projectCount}/${limits.projects})`,
          `You're using ${projectCount} of ${limits.projects} projects (${Math.round(usagePercent)}%). Consider upgrading your plan.`,
          { current: projectCount, limit: limits.projects, usagePercent: Math.round(usagePercent) },
        );
      }
    }

    // Check member limit
    if (limits.members > 0) {
      const memberCount = organization.memberships.length;
      const usagePercent = (memberCount / limits.members) * 100;

      if (usagePercent >= 100) {
        await this.sendLimitAlert(
          orgId,
          'MEMBER_LIMIT_EXCEEDED',
          `Member limit exceeded (${memberCount}/${limits.members})`,
          `You've reached your member limit of ${limits.members}. Upgrade your plan to add more members.`,
          { current: memberCount, limit: limits.members },
        );
      } else if (usagePercent >= 80) {
        await this.sendLimitAlert(
          orgId,
          'MEMBER_LIMIT_WARNING',
          `Member limit approaching (${memberCount}/${limits.members})`,
          `You're using ${memberCount} of ${limits.members} members (${Math.round(usagePercent)}%). Consider upgrading your plan.`,
          { current: memberCount, limit: limits.members, usagePercent: Math.round(usagePercent) },
        );
      }
    }

    // Check usage records (bandwidth, build minutes)
    const subscription = organization.subscriptions[0];
    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      const metrics = ['BANDWIDTH', 'BUILD_MINUTES', 'INVOCATIONS', 'STORAGE'];

      for (const metric of metrics) {
        const usage = await prisma.usageRecord.aggregate({
          where: {
            orgId,
            metric,
            timestamp: {
              gte: subscription.currentPeriodStart,
              lte: subscription.currentPeriodEnd,
            },
          },
          _sum: { quantity: true },
        });

        const quantity = usage._sum.quantity || 0;
        const limitKey = metric.toLowerCase() as keyof typeof limits;
        const limit = limits[limitKey] as number;

        if (limit > 0) {
          const usagePercent = (quantity / limit) * 100;

          if (usagePercent >= 100) {
            await this.sendLimitAlert(
              orgId,
              `${metric}_LIMIT_EXCEEDED`,
              `${metric} limit exceeded (${Math.round(quantity)}/${limit})`,
              `You've exceeded your ${metric.toLowerCase()} limit. Additional usage may incur overage charges.`,
              { current: quantity, limit, usagePercent: Math.round(usagePercent) },
            );
          } else if (usagePercent >= 80) {
            await this.sendLimitAlert(
              orgId,
              `${metric}_LIMIT_WARNING`,
              `${metric} limit approaching (${Math.round(quantity)}/${limit})`,
              `You're using ${Math.round(quantity)} of ${limit} ${metric.toLowerCase()} (${Math.round(usagePercent)}%).`,
              { current: quantity, limit, usagePercent: Math.round(usagePercent) },
            );
          }
        }
      }
    }
  }

  private async sendLimitAlert(
    orgId: string,
    type: string,
    title: string,
    message: string,
    metadata: Record<string, unknown>,
  ) {
    // Check if we already sent this alert recently (within 24 hours)
    const existingAlert = await prisma.notification.findFirst({
      where: {
        orgId,
        type,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingAlert) {
      console.debug(`Alert ${type} already sent within 24 hours for org ${orgId}`);
      return;
    }

    // Create in-app notification
    await this.createNotification({
      orgId,
      type,
      title,
      message,
      metadata,
    });

    // Send email notification
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: true,
      },
    });

    if (org?.owner?.email) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      await this.emailService.sendEmail(
        org.owner.email,
        `DeployX: ${title}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${title}</h2>
            <p>${message}</p>
            <a href="${clientUrl}/${org.slug}/billing" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              View Billing
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              This is an automated alert from DeployX.
            </p>
          </div>
        `,
      );

      console.log(`Limit alert email sent to ${org.owner.email} for org ${orgId}`);
    }
  }
}
