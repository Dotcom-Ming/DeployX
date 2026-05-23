import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@deployx/database';
import { MembershipRole } from '@deployx/shared';

@Injectable()
export class MembersService {
  async getMembers(orgId: string) {
    const memberships = await prisma.membership.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      orgId: m.orgId,
      role: m.role,
      joinedAt: m.acceptedAt,
      user: m.user,
    }));
  }

  async inviteMember(orgId: string, email: string, role: MembershipRole) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`No user found with email: ${email}`);
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        orgId,
        role,
        acceptedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      orgId: membership.orgId,
      role: membership.role,
      joinedAt: membership.acceptedAt,
      user: membership.user,
    };
  }

  async updateMember(orgId: string, memberId: string, role: MembershipRole) {
    const membership = await prisma.membership.findFirst({
      where: { id: memberId, orgId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      orgId: updated.orgId,
      role: updated.role,
      joinedAt: updated.acceptedAt,
      user: updated.user,
    };
  }

  async removeMember(orgId: string, memberId: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: memberId, orgId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (org && membership.userId === org.ownerId) {
      throw new ConflictException('Cannot remove the organization owner');
    }

    await prisma.membership.delete({
      where: { id: memberId },
    });

    return { removed: true };
  }
}
