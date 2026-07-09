# Configuration

## TypeScript Setup

**Generate types from wrangler.jsonc** (replaces deprecated `@cloudflare/workers-types`):

```bash
npx wrangler types
```

Creates `worker-configuration.d.ts` with typed `Env` interface based on your bindings.

```typescript
// functions/api.ts
export const onRequest: PagesFunction<Env> = async (ctx) => {
  // ctx.env.KV, ctx.env.DB, etc. are fully typed
  return Response.json({ ok: true });
};
```

**Manual types** (if not using wrangler types):

```typescript
interface Env {
  KV: KVNamespace;
  DB: D1Database;
  API_KEY: string;
}
export const onRequest: PagesFunction<Env> = async (ctx) => { /* ... */ };
```

## wrangler.jsonc

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-pages-app",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  
  "vars": { "API_URL": "https://api.example.com" },
  "kv_namespaces": [{ "binding": "KV", "id": "abc123" }],
  "d1_databases": [{ "binding": "DB", "database_name": "prod-db", "database_id": "xyz789" }],
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "my-bucket" }],
  "durable_objects": { "bindings": [{ "name": "COUNTER", "class_name": "Counter", "script_name": "counter-worker" }] },
  "services": [{ "binding": "AUTH", "service": "auth-worker" }],
  "ai": { "binding": "AI" },
  "vectorize": [{ "binding": "VECTORIZE", "index_name": "my-index" }],
  "analytics_engine_datasets": [{ "binding": "ANALYTICS" }]
}
```

## Environment Overrides

Top-level → local dev, `env.preview` → preview, `env.production` → production

```jsonc
{
  "vars": { "API_URL": "http://localhost:8787" },
  "env": {
    "production": { "vars": { "API_URL": "https://api.example.com" } }
  }
}
```

**Note:** If overriding `vars`, `kv_namespaces`, `d1_databases`, etc., ALL must be redefined (non-inheritable)

## Local Secrets (.dev.vars)

**Local dev only** - NOT deployed:

```bash
# .dev.vars (add to .gitignore)
SECRET_KEY="my-secret-value"
```

Accessed via `ctx.env.SECRET_KEY`. Set production secrets:
```bash
echo "value" | npx wrangler pages secret put SECRET_KEY --project-name=my-app
```

## Static Config Files

**_routes.json** - Custom routing:
```json
{ "version": 1, "include": ["/api/*"], "exclude": ["/static/*"] }
```

**_headers** - Static headers:
```
/static/*
  Cache-Control: public, max-age=31536000
```

**_redirects** - Redirects:
```
/old  /new  301
```

## Local Dev & Deployment

```bash
# Dev server
npx wrangler pages dev ./dist

# With bindings
npx wrangler pages dev ./dist --kv=KV --d1=DB=db-id --r2=BUCKET

# Durable Objects (2 terminals)
cd do-worker && npx wrangler dev
cd pages-project && npx wrangler pages dev ./dist --do COUNTER=Counter@do-worker

# Deploy
npx wrangler pages deploy ./dist
npx wrangler pages deploy ./dist --branch preview

# Download config
npx wrangler pages download config my-project
```

**See also:** [api.md](./api.md) for binding usage examples
