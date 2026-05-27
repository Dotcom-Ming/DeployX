import { signAccessToken, signRefreshToken, verifyRefreshToken, AccessTokenPayload, RefreshTokenPayload } from '@deployx/auth';
import { UnauthorizedError } from '../../common/errors';

export class TokenService {

  generateAccessToken(user: { id: string; email: string; name?: string | null }, orgId: string, role: string): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name || '',
      orgId,
      role,
    };

    return signAccessToken(payload);
  }

  generateRefreshToken(userId: string, tokenVersion: number): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenVersion,
    };

    return signRefreshToken(payload);
  }

  validateRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = verifyRefreshToken(token);
      return {
        sub: decoded.sub,
        tokenVersion: decoded.tokenVersion,
      };
    } catch {
      throw UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
