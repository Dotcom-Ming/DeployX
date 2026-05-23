import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';

@Injectable()
export class DnsVerificationService {
  private readonly logger = new Logger(DnsVerificationService.name);

  async verifyCname(domain: string, expectedValue: string): Promise<boolean> {
    return new Promise((resolve) => {
      dns.resolveCname(domain, (err, addresses) => {
        if (err) {
          this.logger.warn(`CNAME resolution failed for ${domain}: ${err.message}`);
          resolve(false);
          return;
        }

        const matched = addresses.some(
          (addr) => addr.toLowerCase() === expectedValue.toLowerCase(),
        );

        if (matched) {
          this.logger.log(`CNAME verified for ${domain} -> ${expectedValue}`);
        } else {
          this.logger.warn(`CNAME mismatch for ${domain}: got ${addresses.join(', ')}, expected ${expectedValue}`);
        }

        resolve(matched);
      });
    });
  }

  async getExpectedCname(projectId: string): Promise<string> {
    return 'cname.deployx.app';
  }
}
