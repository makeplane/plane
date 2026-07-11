# Configuration

## wrangler.jsonc

```jsonc
{
  "name": "my-pages-project",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2026-01-01", // Use current date for new projects
  "compatibility_flags": ["nodejs_compat"],
  "placement": {
    "mode": "smart"  // Optional: Enable Smart Placement
  },
  "kv_namespaces": [{"binding": "KV", "id": "abcd1234..."}],
  "d1_databases": [{"binding": "DB", "database_id": "xxxx-xxxx", "database_name": "production-db"}],
  "r2_buckets": [{"binding": "BUCKET", "bucket_name": "my-bucket"}],
  "durable_objects": {"bindings": [{"name": "COUNTER", "class_name": "Counter", "script_name": "counter-worker"}]},
  "services": [{"binding": "API", "service": "api-worker"}],
  "queues": {"producers": [{"binding": "QUEUE", "queue": "my-queue"}]},
  "vectorize": [{"binding": "VECTORIZE", "index_name": "my-index"}],
  "ai": {"binding": "AI"},
  "analytics_engine_datasets": [{"binding": "ANALYTICS"}],
  "vars": {"API_URL": "https://api.example.com", "ENVIRONMENT": "production"},
  "env": {
    "preview": {
      "vars": {"API_URL": "https://staging-api.example.com"},
      "kv_namespaces": [{"binding": "KV", "id": "preview-namespace-id"}]
    }
  }
}
```

## Build Config

**Git deployment**: Dashboard → Project → Settings → Build settings  
Set build command, output dir, env vars. Framework auto-detection configures automatically.

## Environment Variables

### Local (.dev.vars)
```bash
# .dev.vars (never commit)
SECRET_KEY="local-secret-key"
API_TOKEN="dev-token-123"
```

### Production
```bash
echo "secret-value" | npx wrangler pages secret put SECRET_KEY --project-name=my-project
npx wrangler pages secret list --project-name=my-project
npx wrangler pages secret delete SECRET_KEY --project-name=my-project
```

Access: `env.SECRET_KEY`

## Static Config Files

### _redirects
Place in build output (e.g., `dist/_redirects`):

```txt
/old-page /new-page 301          # 301 redirect
/blog/* /news/:splat 301         # Splat wildcard
/users/:id /members/:id 301      # Placeholders
/api/* /api-v2/:splat 200        # Proxy (no redirect)
```

**Limits**: 2,100 total (2,000 static + 100 dynamic), 1,000 char/line  
**Note**: Functions take precedence

### _headers
```txt
/secure/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff

/api/*
  Access-Control-Allow-Origin: *

/static/*
  Cache-Control: public, max-age=31536000, immutable
```

**Limits**: 100 rules, 2,000 char/line  
**Note**: Only static assets; Functions set headers in Response

### _routes.json
Controls which requests invoke Functions (auto-generated for most frameworks):

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/build/*", "/static/*", "/assets/*", "/*.{ico,png,jpg,css,js}"]
}
```

**Purpose**: Functions are metered; static requests are free. `exclude` takes precedence. Max 100 rules, 100 char/rule.

## TypeScript

```bash
npx wrangler types --path='./functions/types.d.ts'
```

Point `types` in `functions/tsconfig.json` to generated file.

## Smart Placement

Automatically optimizes function execution location based on request patterns.

```jsonc
{
  "placement": {
    "mode": "smart"  // Enable optimization (default: off)
  }
}
```

**How it works**: System analyzes traffic over hours/days and places function execution closer to:
- User clusters (e.g., regional traffic)
- Data sources (e.g., D1 database primary location)

**Benefits**: 
- Lower latency for read-heavy apps with centralized databases
- Better performance for apps with regional traffic patterns

**Trade-offs**:
- Initial learning period: First requests may be slower while system optimizes
- Optimization time: Performance improves over 24-48 hours

**When to enable**: Global apps with D1/Durable Objects in specific regions, or apps with concentrated geographic traffic.

**When to skip**: Evenly distributed global traffic with no data locality constraints.

## Remote Bindings (Local Dev)

Connect local dev server to production bindings instead of local mocks:

```bash
# All bindings remote
npx wrangler pages dev ./dist --remote

# Specific bindings remote (others local)
npx wrangler pages dev ./dist --remote --kv=KV --d1=DB
```

**Use cases**:
- Test against production data (read-only operations)
- Debug binding-specific behavior
- Validate changes before deployment

**⚠️ Warning**: 
- Writes affect **real production data**
- Use only for read-heavy debugging or with non-production accounts
- Consider creating separate preview environments instead

**Requirements**: Must be logged in (`npx wrangler login`) with access to bindings.

## Local Dev

```bash
# Basic
npx wrangler pages dev ./dist

# With bindings
npx wrangler pages dev ./dist --kv KV --d1 DB=local-db-id

# Remote bindings (production data)
npx wrangler pages dev ./dist --remote

# Persistence
npx wrangler pages dev ./dist --persist-to=./.wrangler/state/v3

# Proxy mode (SSR frameworks)
npx wrangler pages dev -- npm run dev
```

## Limits (as of Jan 2026)

| Resource | Free | Paid |
|----------|------|------|
| **Functions Requests** | 100k/day | Unlimited (metered) |
| **Function CPU Time** | 10ms/req | 30s default, 5min max (Workers Paid) |
| **Function Memory** | 128MB | 128MB |
| **Script Size** | 1MB compressed | 10MB compressed |
| **Deployments** | 500/month | 5,000/month |
| **Files per Deploy** | 20,000 | 20,000 |
| **File Size** | 25MB | 25MB |
| **Build Time** | 20min | 20min |
| **Redirects** | 2,100 (2k static + 100 dynamic) | Same |
| **Header Rules** | 100 | 100 |
| **Route Rules** | 100 | 100 |
| **Subrequests** | 50/request | 10,000/request (Workers Paid) |

**Notes**:
- Functions use Workers runtime; Workers Paid plan increases limits
- Free plan sufficient for most projects
- Static requests always free (not counted toward limits)

[Full limits](https://developers.cloudflare.com/pages/platform/limits/)
