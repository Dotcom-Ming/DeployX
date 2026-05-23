import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@deployx/database';
import { MembershipRole, PLAN_LIMITS, Plan } from '@deployx/shared';
import { MembersService } from './members.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly membersService: MembersService) {}

  async create(userId: string, data: { name: string; slug?: string }) {
    const slug = data.slug || this.generateSlug(data.name);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization slug already taken');
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug,
        ownerId: userId,
        memberships: {
          create: {
            userId,
            role: 'OWNER' as MembershipRole,
            acceptedAt: new Date(),
          },
        },
      },
    });

    return organization;
  }

  async getBySlug(slug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(slug: string, userId: string, data: { name?: string; slug?: string; plan?: string }) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const membership = organization.memberships[0];
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new ForbiddenException('You do not have permission to update this organization');
    }

    if (data.slug && data.slug !== slug) {
      const existing = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ConflictException('Organization slug already taken');
      }
    }

    const updated = await prisma.organization.update({
      where: { slug },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
      },
    });

    return updated;
  }

  async delete(slug: string, userId: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new ForbiddenException('Only the organization owner can delete the organization');
    }

    await prisma.organization.delete({
      where: { slug },
    });

    return { deleted: true };
  }

  async getMembers(slug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.membersService.getMembers(organization.id);
  }

  async inviteMember(slug: string, inviterId: string, email: string, role: MembershipRole) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        memberships: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check member limit based on plan
    const memberCount = organization.memberships.length;
    const plan = (organization.plan as Plan) || Plan.HOBBY;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.HOBBY];

    if (limits.members > 0 && memberCount >= limits.members) {
      throw new BadRequestException(
        `Member limit reached (${memberCount}/${limits.members}). Upgrade your plan to add more members.`,
      );
    }

    return this.membersService.inviteMember(organization.id, email, role);
  }

  async updateMember(slug: string, memberId: string, role: MembershipRole) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.membersService.updateMember(organization.id, memberId, role);
  }

  async removeMember(slug: string, memberId: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.membersService.removeMember(organization.id, memberId);
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }
}
