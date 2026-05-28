# Deployment Guide (MCP)

Three primary targets. Pick one (or ship all) based on Phase 3 decisions.

## Cloudflare Workers

Best for: global edge, low ops, per-session state via Durable Objects.

`wrangler.toml`:

```toml
name = "<tool>-mcp"
main = "dist/worker.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "MCP_SESSION"
class_name = "McpSession"

[[migrations]]
tag = "v1"
new_classes = ["McpSession"]

[vars]
MCP_TRANSPORT = "http"
```

Worker entry wires Streamable HTTP onto `/mcp`, routes to a `McpSession` Durable Object keyed by `mcp-session-id`. Secrets via `wrangler secret put MCP_TOKEN`.

Deploy: `wrangler deploy`.

Notes:

- SSE works but Streamable HTTP is preferred.
- stdio cannot run on Workers — build it, test it locally, skip it from this target.
- Do not import Node-only modules; rely on `nodejs_compat` sparingly and prefer web APIs.

## Docker

Best for: self-host, air-gapped, or full control.

`Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm i --frozen-lockfile
COPY . .
RUN pnpm -C packages/mcp build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/packages/mcp/dist ./dist
COPY --from=build --chown=app:app /app/packages/mcp/package.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 8080
ENV MCP_TRANSPORT=http PORT=8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "dist/bin.js"]
```

`docker-compose.yml` sample with env file, port, restart policy. Document passing `MCP_TOKEN` via a secrets manager, never hardcoded in compose.

Publish image to GHCR (`ghcr.io/<org>/<tool>-mcp`) from `release.yml`.

## PaaS (Fly.io, Railway, Render)

Any Node-capable PaaS works with the Streamable HTTP transport.

- **Fly.io**: `fly launch` with the Dockerfile, set secrets via `fly secrets set`.
- **Railway**: connect repo, set `MCP_TRANSPORT=http`, inject secrets as env vars.
- **Render**: Web Service, Docker runtime, health check path `/healthz`.

All three: bind `0.0.0.0`, read `PORT` from env, emit logs to stdout/stderr, no local filesystem writes.

## Cross-cutting

- **TLS** is terminated by the PaaS or by a reverse proxy you run — do not ship TLS in the app.
- **Rate limits** at the app layer (per token), regardless of PaaS rate limits.
- **Session storage**: Cloudflare → Durable Objects; Docker/PaaS → in-memory with sticky sessions or Redis if horizontal scaling.
- **Config hot-reload**: not required; prefer redeploy.
- **Secrets rotation**: support at least two valid tokens during rotation window (`MCP_TOKEN`, `MCP_TOKEN_PREV`).

## Local dev

```
pnpm -C packages/mcp dev          # stdio, for Claude Code integration
pnpm -C packages/mcp dev -- --transport http --port 8080
```

Add an `mcp.json` example in `docs/mcp.md` showing how to register the server in Claude Code, Cursor, and similar clients.
