import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@deployx/database';
import * as crypto from 'crypto';

@Injectable()
export class ApiTokensService {
  private readonly logger = new Logger(ApiTokensService.name);

  async list(userId: string) {
    const tokens = await prisma.apiToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return tokens;
  }

  async create(userId: string, name: string, scopes: string[], expiresAt?: string) {
    const plainToken = this.generateToken();
    const hashedToken = this.hashToken(plainToken);

    const token = await prisma.apiToken.create({
      data: {
        userId,
        name,
        hashedToken,
        scopes: JSON.stringify(scopes),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    this.logger.log(`API token "${name}" created for user ${userId}`);

    return {
      id: token.id,
      name: token.name,
      token: plainToken,
      scopes: JSON.parse(token.scopes),
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }

  async revoke(tokenId: string, userId: string) {
    const token = await prisma.apiToken.findFirst({
      where: { id: tokenId, userId, revokedAt: null },
    });

    if (!token) {
      throw new Error('Token not found or already revoked');
    }

    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`API token "${token.name}" revoked`);

    return { revoked: true };
  }

  async validateToken(token: string) {
    const hashedToken = this.hashToken(token);

    const record = await prisma.apiToken.findFirst({
      where: {
        hashedToken,
        revokedAt: null,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!record) {
      return null;
    }

    if (record.expiresAt && new Date() > record.expiresAt) {
      return null;
    }

    // Update lastUsedAt
    await prisma.apiToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: record.id,
      userId: record.userId,
      scopes: JSON.parse(record.scopes as string),
      user: record.user,
    };
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateToken(): string {
    const prefix = 'dx_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}
