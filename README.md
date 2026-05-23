# DeployX

A Vercel-like PaaS cloud deployment platform built as a monorepo. DeployX supports Git integration, automated builds, serverless deployment, custom domains, real-time logs, billing, and enterprise-grade permission management.

## Architecture

DeployX is built with a microservices architecture using the following tech stack:

- **Monorepo**: pnpm workspace + Turborepo
- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Cache/Queue**: Redis (BullMQ)
- **Gateway**: Traefik
- **Infrastructure**: Docker, Kubernetes, Terraform
- **CI/CD**: GitHub Actions
- **Billing**: Stripe

### Project Structure

```
DeployX/
├── apps/                          # Microservices
│   ├── web/                       # User-facing dashboard (Next.js 14)
│   ├── admin/                     # Admin management panel (Next.js)
│   ├── api/                       # Main API service (NestJS)
│   ├── builder/                   # Build scheduler/worker service
│   ├── billing/                   # Stripe billing & metering service
│   ├── gateway/                   # Edge gateway/routing service
│   └── docs/                      # Documentation site (Next.js)
│
├── packages/                      # Shared libraries
│   ├── ui/                        # Shared UI components
│   ├── database/                  # Prisma schema + client
│   ├── shared/                    # Shared types, constants, utilities
│   ├── auth/                      # Auth SDK (JWT, OAuth, Casbin)
│   └── sdk/                       # Platform SDK (for CLI / external use)
│
├── infra/                         # Infrastructure as Code
│   ├── docker/                    # Dockerfiles for each service
│   ├── k8s/                       # Kubernetes manifests
│   └── terraform/                 # Terraform configs
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose
- PostgreSQL (or use Docker Compose)
- Redis (or use Docker Compose)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/deployx.git
cd deployx

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed
```

### Configuration

Copy the `.env.example` files and update them with your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/builder/.env.example apps/builder/.env
cp apps/billing/.env.example apps/billing/.env
cp apps/gateway/.env.example apps/gateway/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Start a specific service
pnpm --filter @deployx/api dev

# Build all services
pnpm build

# Run tests
pnpm test
```

### Docker Compose

Start the entire stack with Docker Compose:

```bash
docker compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3001 | Main REST API & WebSocket gateway |
| Builder | 3002 | Build scheduler & worker |
| Billing | 3003 | Stripe billing & usage metering |
| Gateway | 3004 | Edge routing & SSL management |
| Web | 3000 | User-facing dashboard |
| Admin | 3005 | Admin management panel |
| Docs | 3006 | Documentation site |

## Key Features

- **Git Integration**: GitHub, GitLab, Bitbucket webhooks for automatic deployments
- **Framework Auto-Detection**: Next.js, Nuxt, Vite, and more
- **Custom Domains**: DNS verification + automatic SSL via Let's Encrypt
- **Real-time Logs**: WebSocket-based log streaming with terminal UI
- **Team Management**: RBAC + ABAC permissions via Casbin
- **Billing**: Stripe integration with usage-based metering
- **Multi-tenant**: Organization-based isolation

## Deployment

### Kubernetes

```bash
# Apply namespace
kubectl apply -f infra/k8s/namespace.yaml

# Apply all manifests
kubectl apply -f infra/k8s/
```

You can also use the unified deployment entrypoints:

```bash
# Core platform services
make k8s-apply-core

# Monitoring stack (Prometheus/Grafana/Loki/Alertmanager)
make k8s-apply-monitoring

# Observability stack (OTel Collector + Jaeger)
make k8s-apply-observability

# Postgres daily backup CronJob
make k8s-apply-backup

# Apply everything
make k8s-apply-all
```

### Helm

```bash
# Render chart templates
make helm-template

# Install or upgrade chart
make helm-install
```

### CI/CD

The project uses GitHub Actions for CI/CD:

- **CI**: Runs on every PR (lint, test, build)
- **Staging**: Auto-deploys from `develop` branch
- **Production**: Deploys on release publish

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## License

MIT
