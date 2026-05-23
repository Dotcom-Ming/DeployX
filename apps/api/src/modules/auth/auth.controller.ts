import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { registerSchema } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { mfaEnableSchema, mfaVerifySchema } from './dto/mfa.dto';
import { forgotPasswordSchema, resetPasswordSchema } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: unknown,
  ) {
    return this.authService.register(body as { email: string; name: string; password: string; orgName?: string });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: unknown,
  ) {
    return this.authService.login(body as { email: string; password: string });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('oauth/:provider')
  async oauthInitiate(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const validProviders = ['github', 'gitlab', 'google'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ message: `Unsupported OAuth provider: ${provider}` });
    }

    const authGuard = new (AuthGuard(provider))();
    return authGuard.canActivate({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any);
  }

  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const profile = req.user as Record<string, unknown>;
      const result = await this.authService.validateOAuthUser(provider, profile);

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = `${clientUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
    }
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  async enableMFA(@CurrentUser() user: { id: string }) {
    return this.authService.enableMFA(user.id);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyMFA(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(mfaVerifySchema)) body: unknown,
  ) {
    const { code } = body as { code: string };
    return this.authService.verifyMFA(user.id, code);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: unknown,
  ) {
    const { email } = body as { email: string };
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: unknown,
  ) {
    const { token, password } = body as { token: string; password: string };
    return this.authService.resetPassword(token, password);
  }
}
