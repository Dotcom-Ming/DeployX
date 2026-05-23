import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  generateSecret(userId: string): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret();
    const appName = 'DeployX';
    const otpauthUrl = authenticator.keyuri(userId, appName, secret);

    return { secret, otpauthUrl };
  }

  async generateQrCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  verifyCode(secret: string, code: string): boolean {
    return authenticator.verify({
      token: code,
      secret,
    });
  }
}
