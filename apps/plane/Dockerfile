FROM node:alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY ./apps ./apps
COPY ./package.json ./package.json
COPY ./.eslintrc.json ./.eslintrc.json
COPY ./turbo.json ./turbo.json
COPY ./yarn.lock ./yarn.lock
RUN turbo prune --scope=plane --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:alpine AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN yarn turbo run build --filter=plane...

FROM node:alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/plane/next.config.js .
COPY --from=installer /app/apps/plane/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/plane/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/plane/.next/static ./apps/plane/.next/static

CMD node apps/plane/server.js