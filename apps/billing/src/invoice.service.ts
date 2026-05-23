import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@deployx/database';
import Stripe from 'stripe';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly prisma = new PrismaClient();
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async getInvoices(orgId: string): Promise<any[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return invoices;
  }

  async getInvoice(invoiceId: string): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    return invoice;
  }

  async syncInvoiceFromStripe(stripeInvoiceId: string): Promise<any> {
    this.logger.log(`Syncing invoice ${stripeInvoiceId} from Stripe`);

    const stripeInvoice = await this.stripe.invoices.retrieve(stripeInvoiceId);

    const localInvoice = await this.prisma.invoice.findUnique({
      where: { stripeInvoiceId },
    });

    const invoiceData = {
      amount: stripeInvoice.amount_paid / 100,
      currency: stripeInvoice.currency,
      status: this.mapStripeInvoiceStatus(stripeInvoice.status),
      items: JSON.stringify(stripeInvoice.lines?.data || []),
      pdfUrl: stripeInvoice.invoice_pdf,
    };

    if (localInvoice) {
      return this.prisma.invoice.update({
        where: { id: localInvoice.id },
        data: invoiceData,
      });
    }

    // Need to find the org from the Stripe customer
    if (stripeInvoice.customer) {
      const subscription = await this.prisma.subscription.findFirst({
        where: { stripeCustomerId: stripeInvoice.customer as string },
      });

      if (subscription) {
        return this.prisma.invoice.create({
          data: {
            orgId: subscription.orgId,
            stripeInvoiceId,
            ...invoiceData,
          },
        });
      }
    }

    throw new NotFoundException(
      `Cannot determine organization for Stripe invoice ${stripeInvoiceId}`,
    );
  }

  private mapStripeInvoiceStatus(status: string | null): string {
    switch (status) {
      case 'paid':
        return 'PAID';
      case 'draft':
        return 'DRAFT';
      case 'open':
        return 'OPEN';
      case 'void':
        return 'VOID';
      case 'uncollectible':
        return 'UNCOLLECTIBLE';
      default:
        return 'DRAFT';
    }
  }
}
