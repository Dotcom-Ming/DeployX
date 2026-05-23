# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/billing/package.json ./apps/billing/
COPY packages/ ./packages/

# ---- Dependencies ----
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY apps/billing/ ./apps/billing/
RUN pnpm --filter @deployx/billing build

# ---- Production ----
FROM node:20-alpine AS production
RUN apk add --no-cache tini
USER node
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/billing/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/billing/package.json ./
ENV NODE_ENV=production
EXPOSE 3003
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
