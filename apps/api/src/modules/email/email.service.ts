import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendVerificationEmail(email: string, verificationUrl: string) {
    await this.transporter.sendMail({
      from: `"DeployX" <${process.env.SMTP_FROM || 'noreply@deployx.app'}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to DeployX!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.transporter.sendMail({
      from: `"DeployX" <${process.env.SMTP_FROM || 'noreply@deployx.app'}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
        </div>
      `,
    });
    this.logger.log(`Password reset email sent to ${email}`);
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: `"DeployX" <${process.env.SMTP_FROM || 'noreply@deployx.app'}>`,
      to,
      subject,
      html,
    });
  }
}
