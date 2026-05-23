import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orgs/:slug/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  async createCheckoutSession(
    @Param('slug') slug: string,
    @Body() body: { priceId: string; successUrl: string; cancelUrl: string },
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.billingService.createCheckoutSession(
      org.id,
      body.priceId,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('portal')
  async createBillingPortalSession(
    @Param('slug') slug: string,
    @Body() body: { returnUrl: string },
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.billingService.createBillingPortalSession(org.id, body.returnUrl);
  }

  @Get('subscription')
  async getSubscription(@Param('slug') slug: string) {
    const org = await this.getOrgBySlug(slug);
    return this.billingService.getSubscription(org.id);
  }

  @Get('invoices')
  async getInvoices(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.billingService.getInvoices(org.id, parseInt(limit || '10', 10));
  }

  @Get('usage')
  async getUsage(
    @Param('slug') slug: string,
    @Query('metric') metric: string,
    @Query('period') period?: 'current' | 'previous',
  ) {
    const org = await this.getOrgBySlug(slug);
    return this.billingService.getUsage(org.id, metric, period || 'current');
  }

  private async getOrgBySlug(slug: string) {
    const { prisma } = await import('@deployx/database');
    const org = await prisma.organization.findUnique({
      where: { slug },
    });
    if (!org) {
      throw new Error('Organization not found');
    }
    return org;
  }
}
