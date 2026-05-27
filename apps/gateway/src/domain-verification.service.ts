import { prisma } from '@deployx/database';
import { SslStatus } from '@deployx/shared';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);

export class DomainVerificationService {
  private readonly expectedCname = process.env.GATEWAY_CNAME || 'gateway.deployx.app';
  private readonly verificationTimeout = 24 * 60 * 60 * 1000;
  private cronTimers: ReturnType<typeof setInterval>[] = [];

  startCron() {
    this.cronTimers.push(setInterval(() => this.verifyPendingDomains(), 10 * 60 * 1000));
    this.cronTimers.push(setInterval(() => this.renewExpiringCertificates(), 60 * 60 * 1000));

    this.verifyPendingDomains();
    this.renewExpiringCertificates();

    console.log('Domain verification cron jobs started');
  }

  stopCron() {
    this.cronTimers.forEach(timer => clearInterval(timer));
    this.cronTimers = [];
  }

  async verifyPendingDomains() {
    console.log('Checking pending domain verifications...');

    const pendingDomains = await prisma.domain.findMany({
      where: {
        verified: false,
        sslStatus: SslStatus.PENDING,
        createdAt: {
          gte: new Date(Date.now() - this.verificationTimeout),
        },
      },
    });

    for (const domain of pendingDomains) {
      try {
        const isVerified = await this.verifyDnsRecord(domain.domain);

        if (isVerified) {
          await prisma.domain.update({
            where: { id: domain.id },
            data: {
              verified: true,
              sslStatus: SslStatus.PENDING,
            },
          });

          console.log(`Domain ${domain.domain} verified successfully`);

          await this.triggerCertificateIssuance(domain);
        }
      } catch (error: any) {
        console.error(`Failed to verify domain ${domain.domain}: ${error.message}`);
      }
    }
  }

  async verifyDnsRecord(domainName: string): Promise<boolean> {
    try {
      const records = await resolveCname(domainName);

      if (!records || records.length === 0) {
        return false;
      }

      const expectedTarget = this.expectedCname.toLowerCase();
      const isMatch = records.some(
        (record) => record.toLowerCase().replace(/\.$/, '') === expectedTarget,
      );

      if (!isMatch) {
        console.warn(
          `CNAME mismatch for ${domainName}. Expected: ${expectedTarget}, Got: ${records.join(', ')}`,
        );
      }

      return isMatch;
    } catch {
      return false;
    }
  }

  async triggerCertificateIssuance(domain: any): Promise<void> {
    try {
      const projectId = domain.projectId;

      const certResource = this.generateCertManagerResource(
        domain.domain,
        projectId,
      );

      console.log(`Generated cert-manager resource for ${domain.domain}`);

      await this.applyCertManagerResource(certResource);

      await prisma.domain.update({
        where: { id: domain.id },
        data: { sslStatus: SslStatus.PENDING },
      });

      console.log(`Certificate issuance triggered for ${domain.domain}`);
    } catch (error: any) {
      console.error(
        `Failed to trigger certificate issuance for ${domain.domain}: ${error.message}`,
      );

      await prisma.domain.update({
        where: { id: domain.id },
        data: { sslStatus: SslStatus.ERROR },
      });
    }
  }

  generateCertManagerResource(
    domainName: string,
    projectId: string,
  ): string {
    const secretName = `cert-${domainName.replace(/\./g, '-')}`;

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
    - ${domainName}
  duration: 2160h
  renewBefore: 360h
`.trim();
  }

  private async applyCertManagerResource(resourceYaml: string): Promise<void> {
    try {
      const { execSync } = await import('child_process');

      const tempFile = `/tmp/cert-${Date.now()}.yaml`;
      const fs = await import('fs');
      fs.writeFileSync(tempFile, resourceYaml);

      execSync(`kubectl apply -f ${tempFile}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      fs.unlinkSync(tempFile);

      console.log('cert-manager resource applied successfully');
    } catch (error: any) {
      console.error(`Failed to apply cert-manager resource: ${error.message}`);
      throw error;
    }
  }

  async checkCertificateStatus(domainName: string): Promise<SslStatus> {
    try {
      const { execSync } = await import('child_process');

      const secretName = `cert-${domainName.replace(/\./g, '-')}-tls`;

      const output = execSync(
        `kubectl get certificate ${secretName} -n deployx-gateway -o jsonpath='{.status.conditions[0].type}'`,
        { encoding: 'utf-8' },
      );

      if (output.includes('Ready')) {
        return SslStatus.ISSUED;
      }

      return SslStatus.PENDING;
    } catch {
      return SslStatus.ERROR;
    }
  }

  async renewExpiringCertificates() {
    console.log('Checking for certificates nearing expiration...');

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const domains = await prisma.domain.findMany({
      where: {
        verified: true,
        sslStatus: SslStatus.ISSUED,
      },
    });

    for (const domain of domains) {
      try {
        const status = await this.checkCertificateStatus(domain.domain);

        if (status === SslStatus.ERROR) {
          await this.triggerCertificateIssuance(domain);
        }
      } catch (error: any) {
        console.error(
          `Failed to check certificate status for ${domain.domain}: ${error.message}`,
        );
      }
    }
  }

  async removeDomain(domainId: string): Promise<void> {
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    try {
      const secretName = `cert-${domain.domain.replace(/\./g, '-')}-tls`;

      const { execSync } = await import('child_process');
      execSync(
        `kubectl delete certificate ${secretName} -n deployx-gateway --ignore-not-found`,
        { encoding: 'utf-8', stdio: 'pipe' },
      );

      console.log(`Removed certificate for ${domain.domain}`);
    } catch (error: any) {
      console.error(
        `Failed to remove certificate for ${domain.domain}: ${error.message}`,
      );
    }

    await prisma.domain.delete({
      where: { id: domainId },
    });

    console.log(`Domain ${domain.domain} removed`);
  }
}
