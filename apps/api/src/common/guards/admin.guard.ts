import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@deployx/database';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Development mode: allow access without token if ADMIN_DEV_MODE=true
    if (process.env.ADMIN_DEV_MODE === 'true') {
      request.user = { sub: 'dev-admin', email: 'admin@deployx.io' };
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
    let payload: any;
    try {
      const { verify } = await import('jsonwebtoken');
      payload = verify(token, jwtSecret);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { email: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Admin access required');
    }

    request.user = { sub: payload.sub, email: user.email };
    return true;
  }
}
