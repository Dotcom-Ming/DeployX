import { prisma } from '@deployx/database';
import { SslStatus } from '@deployx/shared';
import { DnsVerificationService } from './dns-verification.service';

export class DomainsService {
  private dnsVerificationService = new DnsVerificationService();

  async list(projectId: string) {
    return prisma.domain.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(projectId: string, domain: string) {
    const existing = await prisma.domain.findFirst({
      where: { projectId, domain },
    });

    if (existing) {
      throw new Error('Domain already exists for this project');
    }

    const record = await prisma.domain.create({
      data: {
        projectId,
        domain,
        sslStatus: SslStatus.PENDING,
      },
    });

    console.log(`Domain ${domain} added to project ${projectId}`);

    return record;
  }

  async remove(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    await prisma.domain.delete({
      where: { id: domainId },
    });

    console.log(`Domain ${domain.domain} removed`);

    return { deleted: true };
  }

  async verifyDns(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    const expectedCname = await this.dnsVerificationService.getExpectedCname(domain.projectId);
    const verified = await this.dnsVerificationService.verifyCname(domain.domain, expectedCname);

    if (verified) {
      await prisma.domain.update({
        where: { id: domainId },
        data: { verified: true },
      });
      console.log(`Domain ${domain.domain} DNS verified`);
    }

    return {
      domain: domain.domain,
      verificationMethod: 'CNAME',
      verificationValue: expectedCname,
      verified,
    };
  }
}
