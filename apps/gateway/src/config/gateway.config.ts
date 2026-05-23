import { registerAs } from '@nestjs/config';

export default registerAs('gateway', () => ({
  defaultDomain: process.env.DEFAULT_DOMAIN || 'deployx.app',
  port: parseInt(process.env.PORT || '3004', 10),
  traefikEnabled: process.env.TRAEFIK_ENABLED === 'true' || false,
  traefikNamespace: process.env.TRAEFIK_NAMESPACE || 'deployx-gateway',
}));
