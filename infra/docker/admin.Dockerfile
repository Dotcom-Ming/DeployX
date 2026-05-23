# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/ ./packages/

# ---- Dependencies ----
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY apps/admin/ ./apps/admin/
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @deployx/admin build

# ---- Production ----
FROM node:20-alpine AS production
RUN apk add --no-cache tini
USER node
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/apps/admin/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=node:node /app/apps/admin/public ./apps/admin/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/admin/server.js"]
