import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { DnsVerificationService } from './dns-verification.service';

@Module({
  imports: [PrismaModule],
  controllers: [DomainsController],
  providers: [DomainsService, DnsVerificationService],
  exports: [DomainsService],
})
export class DomainsModule {}
