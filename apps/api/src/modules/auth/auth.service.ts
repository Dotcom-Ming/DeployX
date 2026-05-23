import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { prisma } from '@deployx/database';
import { TokenService } from './token.service';
import { MfaService } from './mfa.service';
import { EmailService } from '../email/email.service';
import { registerSchema, RegisterDto } from './dto/register.dto';
import { loginSchema, LoginDto } from './dto/login.dto';
import { mfaVerifySchema, MfaVerifyDto } from './dto/mfa.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly mfaService: MfaService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const validated = registerSchema.parse(dto);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        passwordHash,
      },
    });

    const orgName = validated.orgName || `${validated.name}'s Organization`;
    const slug = this.generateSlug(orgName);

    const organization = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: 'OWNER',
            acceptedAt: new Date(),
          },
        },
      },
    });

    const accessToken = this.tokenService.generateAccessToken(
      user,
      organization.id,
      'OWNER',
    );
    const refreshToken = this.tokenService.generateRefreshToken(user.id, 0);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/auth/verify-email?token=${verificationToken}`;

    await this.emailService.sendVerificationEmail(user.email, verificationUrl).catch((err) => {
      this.logger.warn(`Failed to send verification email: ${err.message}`);
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userWithoutPassword,
        orgId: organization.id,
        orgSlug: organization.slug,
        role: 'OWNER',
        mfaEnabled: false,
        emailVerified: false,
      },
    };
  }

  async login(dto: LoginDto) {
    const validated = loginSchema.parse(dto);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
          where: { acceptedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(validated.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.mfaSecret) {
      return {
        requiresMfa: true,
        tempToken: this.tokenService.generateAccessToken(
          user,
          'pending',
          'pending',
        ),
      };
    }

    const membership = user.memberships[0];
    const orgId = membership?.orgId || '';
    const orgSlug = membership?.organization?.slug || '';
    const role = membership?.role || 'VIEWER';

    const accessToken = this.tokenService.generateAccessToken(user, orgId, role);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, 0);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userWithoutPassword,
        orgId,
        orgSlug,
        role,
        mfaEnabled: !!user.mfaSecret,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = this.tokenService.validateRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { acceptedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = user.memberships[0];
    const orgId = membership?.orgId || '';
    const role = membership?.role || 'VIEWER';

    const newAccessToken = this.tokenService.generateAccessToken(user, orgId, role);
    const newRefreshToken = this.tokenService.generateRefreshToken(user.id, payload.tokenVersion);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async validateOAuthUser(provider: string, profile: Record<string, unknown>) {
    const providerIdField = `${provider}Id` as 'githubId' | 'gitlabId' | 'googleId';
    const providerId = profile.id as string;
    const emails = profile.emails as Array<{ value: string; primary?: boolean }>;
    const email = emails?.find((e) => e.primary)?.value || emails?.[0]?.value;

    if (!email) {
      throw new BadRequestException('No email found in OAuth profile');
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (!user[providerIdField]) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [providerIdField]: String(providerId) },
        });
      }
    } else {
      const displayName = (profile.displayName as string) || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          [providerIdField]: String(providerId),
          avatarUrl: (profile.photos as Array<{ value: string }>)?.[0]?.value || null,
        },
      });

      const slug = this.generateSlug(`${displayName}'s Organization`);
      await prisma.organization.create({
        data: {
          name: `${displayName}'s Organization`,
          slug,
          ownerId: user.id,
          memberships: {
            create: {
              userId: user.id,
              role: 'OWNER',
              acceptedAt: new Date(),
            },
          },
        },
      });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, acceptedAt: { not: null } },
      orderBy: { createdAt: 'asc' },
      include: { organization: true },
    });

    const orgId = membership?.orgId || '';
    const orgSlug = membership?.organization?.slug || '';
    const role = membership?.role || 'OWNER';

    const accessToken = this.tokenService.generateAccessToken(user, orgId, role);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, 0);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userWithoutPassword,
        orgId,
        orgSlug,
        role,
        mfaEnabled: !!user.mfaSecret,
      },
    };
  }

  async enableMFA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.mfaSecret) {
      throw new BadRequestException('MFA is already enabled');
    }

    const { secret, otpauthUrl } = this.mfaService.generateSecret(userId);
    const qrCodeDataUrl = await this.mfaService.generateQrCode(otpauthUrl);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
    };
  }

  async verifyMFA(userId: string, code: string) {
    const validated = mfaVerifySchema.parse({ code });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = this.mfaService.verifyCode(user.mfaSecret, validated.code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, acceptedAt: { not: null } },
      orderBy: { createdAt: 'asc' },
      include: { organization: true },
    });

    const orgId = membership?.orgId || '';
    const orgSlug = membership?.organization?.slug || '';
    const role = membership?.role || 'OWNER';

    const accessToken = this.tokenService.generateAccessToken(user, orgId, role);
    const refreshToken = this.tokenService.generateRefreshToken(user.id, 0);

    const { passwordHash: _, mfaSecret: __, ...userWithoutSensitive } = user;

    return {
      verified: true,
      accessToken,
      refreshToken,
      user: {
        ...userWithoutSensitive,
        orgId,
        orgSlug,
        role,
        mfaEnabled: true,
      },
    };
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }

  async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    if (verificationToken.user.emailVerified) {
      return { verified: true, message: 'Email already verified' };
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { verified: true, message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationUrl = `${clientUrl}/auth/verify-email?token=${verificationToken}`;

    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If an account exists with this email, a reset link has been sent' };
    }

    if (!user.passwordHash) {
      return { message: 'This account uses OAuth login. Please sign in with your OAuth provider.' };
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl).catch((err) => {
      this.logger.warn(`Failed to send password reset email: ${err.message}`);
    });

    return { message: 'If an account exists with this email, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: 'Password reset successfully' };
  }
}
