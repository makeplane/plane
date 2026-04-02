# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base

# Setup pnpm package manager with corepack and configure global bin directory for caching
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# *****************************************************************************
# STAGE 1: Prune the project
# *****************************************************************************
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
ARG TURBO_VERSION=2.8.21
RUN corepack enable pnpm && pnpm add -g turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune --scope=flux --docker

# *****************************************************************************
# STAGE 2: Install dependencies & build the project
# *****************************************************************************
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable pnpm

# Copy full directory structure before fetch to ensure all package.json files are available
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Fetch dependencies to cache store, then install offline with dev deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --store-dir=/pnpm/store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store CI=true pnpm install --offline --frozen-lockfile --store-dir=/pnpm/store

ENV TURBO_TELEMETRY_DISABLED=1

RUN --mount=type=secret,id=TURBO_TOKEN,required=false \
    --mount=type=secret,id=TURBO_REMOTE_CACHE_SIGNATURE_KEY,required=false \
    --mount=type=secret,id=SENTRY_AUTH_TOKEN,required=false \
    sh -ec 'if [ -s /run/secrets/TURBO_TOKEN ]; then export TURBO_TOKEN="$(cat /run/secrets/TURBO_TOKEN)"; fi; \
      if [ -s /run/secrets/TURBO_REMOTE_CACHE_SIGNATURE_KEY ]; then export TURBO_REMOTE_CACHE_SIGNATURE_KEY="$(cat /run/secrets/TURBO_REMOTE_CACHE_SIGNATURE_KEY)"; fi; \
      if [ -s /run/secrets/SENTRY_AUTH_TOKEN ]; then export SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN)"; fi; \
      pnpm turbo run build --filter=flux'

# *****************************************************************************
# STAGE 3: Run the project
# *****************************************************************************

FROM registry.access.redhat.com/ubi10/nodejs-22 AS runner
USER root
WORKDIR /app

COPY --chown=1001:0 --from=installer /app/packages ./packages
COPY --chown=1001:0 --from=installer /app/apps/flux/dist ./apps/flux/dist
COPY --chown=1001:0 --from=installer /app/apps/flux/node_modules ./apps/flux/node_modules
COPY --chown=1001:0 --from=installer /app/node_modules ./node_modules
COPY --chown=1001:0 --from=installer /app/apps/flux/package.json ./apps/flux/package.json

ENV TURBO_TELEMETRY_DISABLED=1
ENV PORT=3000

USER 1001

EXPOSE 3000

CMD ["node", "apps/flux"]
