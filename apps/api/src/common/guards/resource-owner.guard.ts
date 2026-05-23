import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@deployx/database';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  private prisma = new PrismaClient();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const orgSlug = request.params?.slug;
    const orgId = request.headers?.['x-org-id'] as string | undefined;

    if (!orgSlug && !orgId) {
      return true;
    }

    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          userId: user.sub || user.id,
          ...(orgId ? { orgId } : {}),
          ...(!orgId && orgSlug
            ? {
                organization: {
                  slug: orgSlug,
                },
              }
            : {}),
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'You do not have access to this organization',
        );
      }

      request.user = {
        ...user,
        orgId: membership.orgId,
        role: membership.role,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Failed to verify organization membership');
    }
  }
}
