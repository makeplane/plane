# Cloudflare Platform Overview

Cloudflare Developer Platform: comprehensive edge computing ecosystem for full-stack applications on global network across 300+ cities.

## Core Concepts

### Edge Computing Model

**Global Network:**
- Code runs on servers in 300+ cities globally
- Requests execute from nearest location
- Ultra-low latency (<50ms typical)
- Automatic failover and redundancy

**V8 Isolates:**
- Lightweight execution environments (faster than containers)
- Millisecond cold starts
- Zero infrastructure management
- Automatic scaling
- Pay-per-request pricing

### Key Components

**Workers** - Serverless functions on edge
- HTTP/scheduled/queue/email handlers
- JavaScript/TypeScript/Python/Rust support
- Max 50ms CPU (free), 30s (paid)
- 128MB memory limit

**D1** - SQLite database with global read replication
- Standard SQLite syntax
- Single-writer consistency
- Global read replication
- 25GB database size limit
- Batch operations for transactions

**KV** - Distributed key-value store
- Sub-millisecond reads (edge-cached)
- Eventual consistency (~60s globally)
- 25MB value size limit
- Automatic TTL expiration
- Best for: cache, sessions, feature flags

**R2** - Object storage (S3-compatible)
- Zero egress fees (huge cost advantage)
- Unlimited storage
- 5TB object size limit
- S3-compatible API
- Multipart upload support

**Durable Objects** - Stateful compute with WebSockets
- Single-instance coordination (strong consistency)
- Persistent storage (1GB limit paid)
- WebSocket support
- Automatic hibernation

**Queues** - Message queue system
- At-least-once delivery
- Automatic retries (exponential backoff)
- Dead-letter queue support
- Batch processing

**Pages** - Static site hosting + serverless functions
- Git integration (auto-deploy)
- Directory-based routing
- Framework support (Next.js, Remix, Astro, SvelteKit)
- Built-in preview deployments

**Workers AI** - Run AI models on edge
- LLMs (Llama 3, Mistral, Gemma, Qwen)
- Image generation (Stable Diffusion, DALL-E)
- Embeddings (BGE, GTE)
- Speech recognition (Whisper)
- No GPU management required

**Browser Rendering** - Headless browser automation
- Puppeteer/Playwright support
- Screenshots, PDFs, web scraping
- Session reuse for cost optimization
- MCP server support for AI agents

## Architecture Patterns

### Full-Stack Application

```
┌─────────────────────────────────────────┐
│    Cloudflare Pages (Frontend)          │
│    Next.js / Remix / Astro               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    Workers (API Layer)                   │
│    - Routing                             │
│    - Authentication                      │
│    - Business logic                      │
└─┬──────┬──────┬──────┬──────┬───────────┘
  │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────────────┐
│ D1 │ │ KV │ │ R2 │ │ DO │ │ Workers AI │
└────┘ └────┘ └────┘ └────┘ └────────────┘
```

### Polyglot Storage Pattern

```typescript
export default {
  async fetch(request: Request, env: Env) {
    // KV: Fast cache
    const cached = await env.KV.get(key);
    if (cached) return new Response(cached);

    // D1: Structured data
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first();

    // R2: Media files
    const avatar = await env.R2_BUCKET.get(`avatars/${user.id}.jpg`);

    // Durable Objects: Real-time
    const chat = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(roomId));

    // Queue: Async processing
    await env.EMAIL_QUEUE.send({ to: user.email, template: 'welcome' });

    return new Response(JSON.stringify({ user }));
  }
};
```

## Wrangler CLI Essentials

### Installation
```bash
npm install -g wrangler
wrangler login
wrangler init my-worker
```

### Core Commands
```bash
# Development
wrangler dev                    # Local dev server
wrangler dev --remote          # Dev on real edge

# Deployment
wrangler deploy                # Deploy to production
wrangler deploy --dry-run      # Preview changes

# Logs
wrangler tail                  # Real-time logs
wrangler tail --format pretty  # Formatted logs

# Versions
wrangler deployments list      # List deployments
wrangler rollback [version]    # Rollback

# Secrets
wrangler secret put SECRET_NAME
wrangler secret list
```

### Resource Management
```bash
# D1
wrangler d1 create my-db
wrangler d1 execute my-db --file=schema.sql

# KV
wrangler kv:namespace create MY_KV
wrangler kv:key put --binding=MY_KV "key" "value"

# R2
wrangler r2 bucket create my-bucket
wrangler r2 object put my-bucket/file.txt --file=./file.txt
```

## Configuration (wrangler.toml)

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Environment variables
[vars]
ENVIRONMENT = "production"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "YOUR_DATABASE_ID"

# KV Namespace
[[kv_namespaces]]
binding = "KV"
id = "YOUR_NAMESPACE_ID"

# R2 Bucket
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "my-bucket"

# Durable Objects
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "my-worker"

# Queues
[[queues.producers]]
binding = "MY_QUEUE"
queue = "my-queue"

# Workers AI
[ai]
binding = "AI"

# Cron triggers
[triggers]
crons = ["0 0 * * *"]
```

## Best Practices

### Performance
- Keep Workers lightweight (<1MB bundled)
- Use bindings over fetch (faster than HTTP)
- Leverage KV and Cache API for frequently accessed data
- Use D1 batch for multiple queries
- Stream large responses

### Security
- Use `wrangler secret` for API keys
- Separate production/staging/development environments
- Validate user input
- Implement rate limiting (KV or Durable Objects)
- Configure proper CORS headers

### Cost Optimization
- R2 for large files (zero egress fees vs S3)
- KV for caching (reduce D1/R2 requests)
- Request deduplication with caching
- Efficient D1 queries (proper indexing)
- Monitor usage via Cloudflare Analytics

## Decision Matrix

| Need | Choose |
|------|--------|
| Sub-millisecond reads | KV |
| SQL queries | D1 |
| Large files (>25MB) | R2 |
| Real-time WebSockets | Durable Objects |
| Async background jobs | Queues |
| ACID transactions | D1 |
| Strong consistency | Durable Objects |
| Zero egress costs | R2 |
| AI inference | Workers AI |
| Static site hosting | Pages |

## Resources

- Docs: https://developers.cloudflare.com
- Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Discord: https://discord.cloudflare.com
- Examples: https://developers.cloudflare.com/workers/examples/
- Status: https://www.cloudflarestatus.com
