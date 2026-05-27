import { prisma } from '@deployx/database';
import { NotFoundError } from '../../common/errors';

export class UsersService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        githubId: true,
        gitlabId: true,
        googleId: true,
        emailVerified: true,
        mfaSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw NotFoundError('User not found');
    }

    const { mfaSecret, ...userWithoutSecret } = user;

    return {
      ...userWithoutSecret,
      mfaEnabled: !!mfaSecret,
    };
  }

  async updateMe(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw NotFoundError('User not found');
    }

    const updateData: { name?: string; avatarUrl?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        mfaSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { mfaSecret, ...userWithoutSecret } = updated;

    return {
      ...userWithoutSecret,
      mfaEnabled: !!mfaSecret,
    };
  }

  async getUserOrgs(userId: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        acceptedAt: { not: null },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      plan: m.organization.plan,
      logoUrl: m.organization.logoUrl,
      role: m.role,
      joinedAt: m.acceptedAt,
      createdAt: m.organization.createdAt,
      updatedAt: m.organization.updatedAt,
    }));
  }
}
