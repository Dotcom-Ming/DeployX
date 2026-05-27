import { PrismaClient } from '@deployx/database';

export interface AuditLogParams {
  orgId: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async logAction(params: AuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ip || null,
      },
    });
  }
}
