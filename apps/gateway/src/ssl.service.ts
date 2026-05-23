import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@deployx/database';

export interface CertificateInfo {
  domain: string;
  status: string;
  expiresAt?: Date;
  issuer?: string;
}

@Injectable()
export class SslService {
  private readonly logger = new Logger(SslService.name);
  private readonly prisma = new PrismaClient();

  async getCertificate(domain: string): Promise<CertificateInfo | null> {
    const domainRecord = await this.prisma.domain.findUnique({
      where: { domain },
    });

    if (!domainRecord) {
      return null;
    }

    return {
      domain: domainRecord.domain,
      status: domainRecord.sslStatus,
      expiresAt: undefined, // Not tracked in current schema
      issuer: "Let's Encrypt",
    };
  }

  generateCertManagerResource(
    domain: string,
    projectId: string,
  ): string {
    const secretName = `cert-${domain.replace(/\./g, '-')}`;

    return `
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ${secretName}
  namespace: deployx-gateway
  labels:
    app: deployx-gateway
    project-id: ${projectId}
spec:
  secretName: ${secretName}-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - ${domain}
  duration: 2160h
  renewBefore: 360h
`.trim();
  }

  async updateSslStatus(domain: string, status: string): Promise<void> {
    await this.prisma.domain.update({
      where: { domain },
      data: { sslStatus: status as any },
    });

    this.logger.log(`Updated SSL status for ${domain} to ${status}`);
  }
}
