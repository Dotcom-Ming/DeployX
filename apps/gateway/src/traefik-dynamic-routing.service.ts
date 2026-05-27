import { prisma } from '@deployx/database';
import { SslStatus } from '@deployx/shared';

export interface TraefikRouteConfig {
  name: string;
  namespace: string;
  entryPoints: string[];
  rule: string;
  service: {
    name: string;
    namespace: string;
    port: number;
  };
  tls?: {
    secret: string;
  };
  middlewares?: string[];
}

export class TraefikDynamicRoutingService {
  private readonly defaultDomain = process.env.DEFAULT_DOMAIN || 'deployx.app';
  private readonly namespace = process.env.K8S_NAMESPACE || 'deployx-gateway';

  async generateRouteForDomain(domain: string, projectId: string): Promise<TraefikRouteConfig | null> {
    const domainRecord = await prisma.domain.findUnique({
      where: { domain },
    });

    if (!domainRecord || !domainRecord.verified) {
      console.warn(`Domain ${domain} is not verified`);
      return null;
    }

    const deployment = await prisma.deployment.findFirst({
      where: {
        projectId,
        status: 'READY',
        type: 'PRODUCTION',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!deployment) {
      console.warn(`No ready production deployment found for project ${projectId}`);
      return null;
    }

    const routeName = this.generateRouteName(domain);
    const serviceName = `service-${projectId}`;

    const route: TraefikRouteConfig = {
      name: routeName,
      namespace: this.namespace,
      entryPoints: ['web', 'websecure'],
      rule: `Host(\`${domain}\`)`,
      service: {
        name: serviceName,
        namespace: this.namespace,
        port: 80,
      },
      middlewares: [],
    };

    if (domainRecord.sslStatus === SslStatus.ISSUED) {
      route.tls = {
        secret: `cert-${domain.replace(/\./g, '-')}-tls`,
      };
    }

    return route;
  }

  async generateRoutesForProject(projectId: string): Promise<TraefikRouteConfig[]> {
    const domains = await prisma.domain.findMany({
      where: {
        projectId,
        verified: true,
      },
    });

    const routes: TraefikRouteConfig[] = [];

    for (const domain of domains) {
      const route = await this.generateRouteForDomain(domain.domain, projectId);
      if (route) {
        routes.push(route);
      }
    }

    return routes;
  }

  generateDefaultRoute(projectSlug: string, deploymentHash: string): TraefikRouteConfig {
    const domain = `${projectSlug}-${deploymentHash}.${this.defaultDomain}`;
    const serviceName = `service-${projectSlug}`;

    return {
      name: `route-${projectSlug}-${deploymentHash}`,
      namespace: this.namespace,
      entryPoints: ['web', 'websecure'],
      rule: `Host(\`${domain}\`)`,
      service: {
        name: serviceName,
        namespace: this.namespace,
        port: 80,
      },
      tls: {
        secret: `cert-${this.defaultDomain.replace(/\./g, '-')}-wildcard-tls`,
      },
    };
  }

  generatePreviewRoute(
    projectSlug: string,
    branch: string,
    deploymentHash: string,
  ): TraefikRouteConfig {
    const sanitizedBranch = branch.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const domain = `${projectSlug}-${sanitizedBranch}-${deploymentHash}.${this.defaultDomain}`;
    const serviceName = `service-${projectSlug}-preview`;

    return {
      name: `route-${projectSlug}-${sanitizedBranch}-${deploymentHash}`,
      namespace: this.namespace,
      entryPoints: ['web', 'websecure'],
      rule: `Host(\`${domain}\`)`,
      service: {
        name: serviceName,
        namespace: this.namespace,
        port: 80,
      },
      tls: {
        secret: `cert-${this.defaultDomain.replace(/\./g, '-')}-wildcard-tls`,
      },
    };
  }

  generateIngressRouteYaml(route: TraefikRouteConfig): string {
    const yaml = `
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: ${route.name}
  namespace: ${route.namespace}
spec:
  entryPoints:
${route.entryPoints.map((ep) => `    - ${ep}`).join('\n')}
  routes:
    - match: ${route.rule}
      kind: Rule
      services:
        - name: ${route.service.name}
          namespace: ${route.service.namespace}
          port: ${route.service.port}
${route.middlewares && route.middlewares.length > 0 ? `      middlewares:
${route.middlewares.map((mw) => `        - name: ${mw}`).join('\n')}` : ''}
${route.tls ? `  tls:
    secretName: ${route.tls.secret}` : ''}
`.trim();

    return yaml;
  }

  async applyRoute(route: TraefikRouteConfig): Promise<void> {
    try {
      const yaml = this.generateIngressRouteYaml(route);

      const { execSync } = await import('child_process');
      const fs = await import('fs');

      const tempFile = `/tmp/traefik-route-${Date.now()}.yaml`;
      fs.writeFileSync(tempFile, yaml);

      execSync(`kubectl apply -f ${tempFile}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      fs.unlinkSync(tempFile);

      console.log(`Applied Traefik route ${route.name}`);
    } catch (error: any) {
      console.error(`Failed to apply Traefik route ${route.name}: ${error.message}`);
      throw error;
    }
  }

  async removeRoute(routeName: string): Promise<void> {
    try {
      const { execSync } = await import('child_process');

      execSync(
        `kubectl delete ingressroute ${routeName} -n ${this.namespace} --ignore-not-found`,
        { encoding: 'utf-8', stdio: 'pipe' },
      );

      console.log(`Removed Traefik route ${routeName}`);
    } catch (error: any) {
      console.error(`Failed to remove Traefik route ${routeName}: ${error.message}`);
    }
  }

  async syncAllRoutes(): Promise<void> {
    console.log('Syncing all Traefik routes...');

    const domains = await prisma.domain.findMany({
      where: { verified: true },
      include: { project: true },
    });

    for (const domain of domains) {
      try {
        const route = await this.generateRouteForDomain(
          domain.domain,
          domain.projectId,
        );

        if (route) {
          await this.applyRoute(route);
        }
      } catch (error: any) {
        console.error(
          `Failed to sync route for ${domain.domain}: ${error.message}`,
        );
      }
    }

    console.log('Traefik routes synced successfully');
  }

  private generateRouteName(domain: string): string {
    return `route-${domain.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }
}
