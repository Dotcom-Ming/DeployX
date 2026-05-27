import * as dns from 'dns';

export class DnsVerificationService {

  async verifyCname(domain: string, expectedValue: string): Promise<boolean> {
    return new Promise((resolve) => {
      dns.resolveCname(domain, (err, addresses) => {
        if (err) {
          console.warn(`CNAME resolution failed for ${domain}: ${err.message}`);
          resolve(false);
          return;
        }

        const matched = addresses.some(
          (addr) => addr.toLowerCase() === expectedValue.toLowerCase(),
        );

        if (matched) {
          console.log(`CNAME verified for ${domain} -> ${expectedValue}`);
        } else {
          console.warn(`CNAME mismatch for ${domain}: got ${addresses.join(', ')}, expected ${expectedValue}`);
        }

        resolve(matched);
      });
    });
  }

  async getExpectedCname(projectId: string): Promise<string> {
    return 'cname.deployx.app';
  }
}
