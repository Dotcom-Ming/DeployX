import { prisma } from '@deployx/database';
import { CasbinEnforcer } from '@deployx/auth';

export class AbacService {
  async enforceResourceAccess(
    userId: string,
    orgId: string,
    resourceType: string,
    action: string,
    resourceId: string,
  ): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
      select: { role: true },
    });

    if (!membership) return false;

    const role = membership.role.toLowerCase();
    if (role === 'owner' || role === 'admin') return true;

    if (resourceType === 'project') {
      const project = await prisma.project.findUnique({
        where: { id: resourceId },
        select: { orgId: true },
      });
      if (!project || project.orgId !== orgId) return false;
    }

    if (resourceType === 'deployment') {
      const deployment = await prisma.deployment.findUnique({
        where: { id: resourceId },
        include: { project: { select: { orgId: true } } },
      });
      if (!deployment || deployment.project.orgId !== orgId) return false;

      if (role === 'viewer') {
        const deployedByUser = deployment.triggeredById === userId;
        if (!deployedByUser && !['view', 'read'].includes(action)) {
          return false;
        }
      }
    }

    if (resourceType === 'domain') {
      const domain = await prisma.domain.findUnique({
        where: { id: resourceId },
        include: { project: { select: { orgId: true } } },
      });
      if (!domain || domain.project.orgId !== orgId) return false;
    }

    if (resourceType === 'env') {
      const envVar = await prisma.envVariable.findUnique({
        where: { id: resourceId },
        include: { project: { select: { orgId: true } } },
      });
      if (!envVar || envVar.project.orgId !== orgId) return false;
    }

    return true;
  }
}
