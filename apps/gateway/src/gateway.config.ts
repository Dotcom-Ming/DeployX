import { registerAs } from '@nestjs/config';

export default registerAs('gateway', () => ({
  sslCertDir: process.env.SSL_CERT_DIR || './certs',
  acmeEmail: process.env.ACME_EMAIL || 'admin@deployx.app',
  acmeDirectoryUrl: process.env.ACME_DIRECTORY_URL || 'https://acme-v02.api.letsencrypt.org/directory',
  proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || '30000', 10),
  proxyReadTimeout: parseInt(process.env.PROXY_READ_TIMEOUT || '60000', 10),
  traefikApiUrl: process.env.TRAEFIK_API_URL || 'http://localhost:8080',
  traefikProviderPollInterval: parseInt(process.env.TRAEFIK_PROVIDER_POLL_INTERVAL || '5000', 10),
}));
