import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { prisma } from '@deployx/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-jwt-secret',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    name: string;
    orgId: string;
    role: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { acceptedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: payload.orgId,
      role: payload.role,
      mfaEnabled: !!user.mfaSecret,
    };
  }
}
