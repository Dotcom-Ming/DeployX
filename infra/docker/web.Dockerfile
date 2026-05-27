# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# ---- Dependencies ----
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY apps/web/ ./apps/web/
RUN pnpm --filter @deployx/web build

# ---- Production ----
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf || true
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
