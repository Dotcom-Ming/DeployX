export interface TraefikIngressRoute {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
  };
  spec: {
    entryPoints: string[];
    routes: Array<{
      match: string;
      kind: string;
      services: Array<{
        name: string;
        port: number;
      }>;
    }>;
    tls?: {
      secretName: string;
    };
  };
}

export class TraefikProvider {

  generateIngressRoute(
    domain: string,
    serviceName: string,
    port: number,
    enableTls = true,
  ): string {
    const routeName = `route-${domain.replace(/\./g, '-')}`;
    const secretName = enableTls
      ? `cert-${domain.replace(/\./g, '-')}-tls`
      : undefined;

    const ingressRoute: TraefikIngressRoute = {
      apiVersion: 'traefik.containo.us/v1alpha1',
      kind: 'IngressRoute',
      metadata: {
        name: routeName,
        namespace: 'deployx-gateway',
        labels: {
          app: 'deployx-gateway',
          domain,
        },
      },
      spec: {
        entryPoints: ['web', 'websecure'],
        routes: [
          {
            match: `Host(\`${domain}\`)`,
            kind: 'Rule',
            services: [
              {
                name: serviceName,
                port,
              },
            ],
          },
        ],
        ...(enableTls && secretName
          ? {
              tls: {
                secretName,
              },
            }
          : {}),
      },
    };

    // Convert to YAML-like format
    return this.toYaml(ingressRoute);
  }

  generateTraefikConfig(
    domains: Array<{ domain: string; serviceName: string; port: number; enableTls?: boolean }>,
  ): string {
    const routes = domains.map((d) =>
      this.generateIngressRoute(d.domain, d.serviceName, d.port, d.enableTls),
    );

    return routes.join('\n---\n');
  }

  generateMiddleware(
    name: string,
    config: Record<string, any>,
  ): string {
    return `
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: ${name}
  namespace: deployx-gateway
spec:
  ${Object.entries(config)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join('\n  ')}
`.trim();
  }

  private toYaml(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            lines.push(`${spaces}  -`);
            const subLines = this.toYaml(item, indent + 2)
              .split('\n')
              .map((line) => (line.trim() ? `  ${line}` : line))
              .join('\n')
              .trim();
            lines.push(`${spaces}  ${subLines}`);
          } else {
            lines.push(`${spaces}  - ${this.formatYamlValue(item)}`);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${spaces}${key}:`);
        lines.push(this.toYaml(value, indent + 1));
      } else {
        lines.push(`${spaces}${key}: ${this.formatYamlValue(value)}`);
      }
    }

    return lines.join('\n');
  }

  private formatYamlValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      // Quote strings that contain special characters
      if (value.includes(':') || value.includes('{') || value.includes('}') || value.includes('`')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }
}
