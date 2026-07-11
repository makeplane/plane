# Wrangler Configuration

Configuration reference for wrangler.jsonc (recommended).

## Config Format

**wrangler.jsonc recommended** (Wrangler v4+) - provides schema validation.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",  // Use current date
  "vars": { "API_KEY": "dev-key" },
  "kv_namespaces": [{ "binding": "MY_KV", "id": "abc123" }]
}
```

## Field Inheritance

Inheritable: `name`, `main`, `compatibility_date`, `routes`, `triggers`
Non-inheritable (define per env): `vars`, bindings (KV, D1, R2, etc.)

## Environments

```jsonc
{
  "name": "my-worker",
  "vars": { "ENV": "dev" },
  "env": {
    "production": {
      "name": "my-worker-prod",
      "vars": { "ENV": "prod" },
      "route": { "pattern": "example.com/*", "zone_name": "example.com" }
    }
  }
}
```

Deploy: `wrangler deploy --env production`

## Routing

```jsonc
// Custom domain (recommended)
{ "routes": [{ "pattern": "api.example.com", "custom_domain": true }] }

// Zone-based
{ "routes": [{ "pattern": "api.example.com/*", "zone_name": "example.com" }] }

// workers.dev
{ "workers_dev": true }
```

## Bindings

```jsonc
// Variables
{ "vars": { "API_URL": "https://api.example.com" } }

// KV
{ "kv_namespaces": [{ "binding": "CACHE", "id": "abc123" }] }

// D1
{ "d1_databases": [{ "binding": "DB", "database_id": "abc-123" }] }

// R2
{ "r2_buckets": [{ "binding": "ASSETS", "bucket_name": "my-assets" }] }

// Durable Objects
{ "durable_objects": { 
  "bindings": [{ 
    "name": "COUNTER", 
    "class_name": "Counter",
    "script_name": "my-worker"  // Required for external DOs
  }] 
} }
{ "migrations": [{ "tag": "v1", "new_sqlite_classes": ["Counter"] }] }

// Service Bindings
{ "services": [{ "binding": "AUTH", "service": "auth-worker" }] }

// Queues
{ "queues": {
  "producers": [{ "binding": "TASKS", "queue": "task-queue" }],
  "consumers": [{ "queue": "task-queue", "max_batch_size": 10 }]
} }

// Vectorize
{ "vectorize": [{ "binding": "VECTORS", "index_name": "embeddings" }] }

// Hyperdrive (requires nodejs_compat for pg/postgres)
{ "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "hyper-id" }] }
{ "compatibility_flags": ["nodejs_compat"] }  // For pg/postgres

// Workers AI
{ "ai": { "binding": "AI" } }

// Workflows
{ "workflows": [{ "binding": "WORKFLOW", "name": "my-workflow", "class_name": "MyWorkflow" }] }

// Secrets Store (centralized secrets)
{ "secrets_store": [{ "binding": "SECRETS", "id": "store-id" }] }

// Constellation (AI inference)
{ "constellation": [{ "binding": "MODEL", "project_id": "proj-id" }] }
```

## Workers Assets (Static Files)

Recommended for serving static files (replaces old `site` config).

```jsonc
{
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",  // or "none", "force-trailing-slash"
    "not_found_handling": "single-page-application"  // or "404-page", "none"
  }
}
```

Access in Worker:
```typescript
export default {
  async fetch(request, env) {
    // Try serving static asset first
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    
    // Custom logic for non-assets
    return new Response("API response");
  }
}
```

## Placement

Control where Workers run geographically.

```jsonc
{
  "placement": {
    "mode": "smart"  // or "off"
  }
}
```

- `"smart"`: Run Worker near data sources (D1, Durable Objects) to reduce latency
- `"off"`: Default distribution (run everywhere)

## Auto-Provisioning (Beta)

Omit resource IDs - Wrangler creates them and writes back to config on deploy.

```jsonc
{ "kv_namespaces": [{ "binding": "MY_KV" }] }  // No id - auto-provisioned
```

After deploy, ID is added to config automatically.

## Advanced

```jsonc
// Cron Triggers
{ "triggers": { "crons": ["0 0 * * *"] } }

// Observability (tracing)
{ "observability": { "enabled": true, "head_sampling_rate": 0.1 } }

// Runtime Limits
{ "limits": { "cpu_ms": 100 } }

// Browser Rendering
{ "browser": { "binding": "BROWSER" } }

// mTLS Certificates
{ "mtls_certificates": [{ "binding": "CERT", "certificate_id": "cert-uuid" }] }

// Logpush (stream logs to R2/S3)
{ "logpush": true }

// Tail Consumers (process logs with another Worker)
{ "tail_consumers": [{ "service": "log-worker" }] }

// Unsafe bindings (access to arbitrary bindings)
{ "unsafe": { "bindings": [{ "name": "MY_BINDING", "type": "plain_text", "text": "value" }] } }
```

## See Also

- [README.md](./README.md) - Overview and commands
- [api.md](./api.md) - Programmatic API
- [patterns.md](./patterns.md) - Workflows
- [gotchas.md](./gotchas.md) - Common issues
