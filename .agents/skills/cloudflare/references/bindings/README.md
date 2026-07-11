# Cloudflare Bindings Skill Reference

Expert guidance on Cloudflare Workers Bindings - the runtime APIs that connect Workers to Cloudflare platform resources.

## What Are Bindings?

Bindings are how Workers access Cloudflare resources (storage, compute, services) via the `env` object. They're configured in `wrangler.jsonc`, type-safe via TypeScript, and zero-overhead at runtime.

## Reading Order

1. **This file** - Binding catalog and selection guide
2. **[api.md](api.md)** - TypeScript types and env access patterns
3. **[configuration.md](configuration.md)** - Complete wrangler.jsonc examples
4. **[patterns.md](patterns.md)** - Best practices and common patterns
5. **[gotchas.md](gotchas.md)** - Critical pitfalls and troubleshooting

## Binding Catalog

### Storage Bindings

| Binding | Use Case | Access Pattern |
|---------|----------|----------------|
| **KV** | Key-value cache, CDN-backed reads | `env.MY_KV.get(key)` |
| **R2** | Object storage (S3-compatible) | `env.MY_BUCKET.get(key)` |
| **D1** | SQL database (SQLite) | `env.DB.prepare(sql).all()` |
| **Durable Objects** | Coordination, real-time state | `env.MY_DO.get(id)` |
| **Vectorize** | Vector embeddings search | `env.VECTORIZE.query(vector)` |
| **Queues** | Async message processing | `env.MY_QUEUE.send(msg)` |

### Compute Bindings

| Binding | Use Case | Access Pattern |
|---------|----------|----------------|
| **Service** | Worker-to-Worker RPC | `env.MY_SERVICE.fetch(req)` |
| **Workers AI** | LLM inference | `env.AI.run(model, input)` |
| **Browser Rendering** | Headless Chrome | `env.BROWSER.fetch(url)` |

### Platform Bindings

| Binding | Use Case | Access Pattern |
|---------|----------|----------------|
| **Analytics Engine** | Custom metrics | `env.ANALYTICS.writeDataPoint(data)` |
| **mTLS** | Client certificates | `env.MY_CERT` (string) |
| **Hyperdrive** | Database pooling | `env.HYPERDRIVE.connectionString` |
| **Rate Limiting** | Request throttling | `env.RATE_LIMITER.limit(id)` |
| **Workflows** | Long-running workflows | `env.MY_WORKFLOW.create()` |

### Configuration Bindings

| Binding | Use Case | Access Pattern |
|---------|----------|----------------|
| **Environment Variables** | Non-sensitive config | `env.API_URL` (string) |
| **Secrets** | Sensitive values | `env.API_KEY` (string) |
| **Text/Data Blobs** | Static files | `env.MY_BLOB` (string) |
| **WASM** | WebAssembly modules | `env.MY_WASM` (WebAssembly.Module) |

## Quick Selection Guide

**Need persistent storage?**
- Key-value < 25MB → **KV**
- Files/objects → **R2**
- Relational data → **D1**
- Real-time coordination → **Durable Objects**

**Need AI/compute?**
- LLM inference → **Workers AI**
- Scraping/PDFs → **Browser Rendering**
- Call another Worker → **Service binding**

**Need async processing?**
- Background jobs → **Queues**

**Need config?**
- Public values → **Environment Variables**
- Secrets → **Secrets** (never commit)

## Quick Start

1. **Add binding to wrangler.jsonc:**
```jsonc
{
  "kv_namespaces": [
    { "binding": "MY_KV", "id": "your-kv-id" }
  ]
}
```

2. **Generate types:**
```bash
npx wrangler types
```

3. **Access in Worker:**
```typescript
export default {
  async fetch(request, env, ctx) {
    await env.MY_KV.put('key', 'value');
    return new Response('OK');
  }
}
```

## Type Safety

Bindings are fully typed via `wrangler types`. See [api.md](api.md) for details.

## Limits

- 64 bindings max per Worker (all types combined)
- See [gotchas.md](gotchas.md) for per-binding limits

## Key Concepts

**Zero-overhead access:** Bindings compiled into Worker, no network calls to access
**Type-safe:** Full TypeScript support via `wrangler types`
**Per-environment:** Different IDs for dev/staging/production
**Secrets vs Vars:** Secrets encrypted at rest, never in config files

## See Also

- [Cloudflare Docs: Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
