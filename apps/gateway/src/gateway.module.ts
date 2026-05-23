import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyController } from './proxy.controller';
import { RoutingService } from './routing.service';
import { SslService } from './ssl.service';
import { TraefikProvider } from './traefik-provider';
import { DomainVerificationService } from './domain-verification.service';
import { TraefikDynamicRoutingService } from './traefik-dynamic-routing.service';
import gatewayConfig from './config/gateway.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [gatewayConfig],
    }),
  ],
  controllers: [ProxyController],
  providers: [RoutingService, SslService, TraefikProvider, DomainVerificationService, TraefikDynamicRoutingService],
  exports: [RoutingService, SslService, TraefikProvider, DomainVerificationService, TraefikDynamicRoutingService],
})
export class GatewayModule {}
