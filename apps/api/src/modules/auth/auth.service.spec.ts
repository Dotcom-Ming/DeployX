import { AuthService } from '../../modules/auth/auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('@deployx/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@deployx/auth', () => ({
  signAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn().mockReturnValue({ sub: 'user-1', tokenVersion: 0 }),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('TESTSECRET'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/DeployX:test@test.com?secret=TESTSECRET'),
    check: jest.fn(),
    verify: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test'),
}));

const mockPrisma = require('@deployx/database').prisma;
const mockBcrypt = bcrypt as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.organization.create.mockResolvedValue({
        id: 'org-1',
        name: "Test User's Organization",
        slug: 'test-user-abc123',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
        orgName: "Test User's Organization",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.organization.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user-1');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictError if email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
      });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        mfaSecret: null,
        memberships: [
          {
            orgId: 'org-1',
            role: 'OWNER',
            organization: { id: 'org-1', name: 'Test Org' },
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user-1');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should return requiresMfa if user has MFA enabled', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
        mfaSecret: 'some-secret',
        memberships: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('requiresMfa', true);
      expect(result).toHaveProperty('tempToken');
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
        memberships: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('enableMFA', () => {
    it('should generate MFA setup data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        mfaSecret: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        mfaSecret: 'TESTSECRET',
      });

      const result = await service.enableMFA('user-1');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestError if MFA already enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        mfaSecret: 'existing-secret',
      });

      await expect(service.enableMFA('user-1')).rejects.toThrow('MFA is already enabled');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.enableMFA('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('verifyMFA', () => {
    it('should verify MFA code successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        mfaSecret: 'TESTSECRET',
        passwordHash: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.membership.findFirst.mockResolvedValue({ orgId: 'org-1', role: 'OWNER' });

      const result = await service.verifyMFA('user-1', '123456');

      expect(result).toHaveProperty('verified', true);
      expect(result).toHaveProperty('accessToken');
      expect(result.user).toHaveProperty('mfaEnabled', true);
    });

    it('should throw BadRequestError if MFA not enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        mfaSecret: null,
      });

      await expect(service.verifyMFA('user-1', '123456')).rejects.toThrow('MFA is not enabled');
    });
  });
});
