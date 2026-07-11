# Cloudflare R2 Object Storage

S3-compatible object storage with zero egress fees, optimized for large file storage and delivery.

## Overview

R2 provides:
- S3-compatible API (Workers API + S3 REST)
- Zero egress fees globally
- Strong consistency for writes/deletes
- Storage classes (Standard/Infrequent Access)
- SSE-C encryption support

**Use cases:** Media storage, backups, static assets, user uploads, data lakes

## Quick Start

```bash
wrangler r2 bucket create my-bucket --location=enam
wrangler r2 object put my-bucket/file.txt --file=./local.txt
```

```typescript
// Upload
await env.MY_BUCKET.put(key, data, {
  httpMetadata: { contentType: 'image/jpeg' }
});

// Download
const object = await env.MY_BUCKET.get(key);
if (object) return new Response(object.body);
```

## Core Operations

| Method | Purpose | Returns |
|--------|---------|---------|
| `put(key, value, options?)` | Upload object | `R2Object \| null` |
| `get(key, options?)` | Download object | `R2ObjectBody \| R2Object \| null` |
| `head(key)` | Get metadata only | `R2Object \| null` |
| `delete(keys)` | Delete object(s) | `Promise<void>` |
| `list(options?)` | List objects | `R2Objects` |

## Storage Classes

- **Standard**: Frequent access, low latency reads
- **InfrequentAccess**: 30-day minimum storage, retrieval fees, lower storage cost

## Event Notifications

R2 integrates with Cloudflare Queues for reactive workflows:

```typescript
// wrangler.jsonc
{
  "event_notifications": [{
    "queue": "r2-notifications",
    "actions": ["PutObject", "DeleteObject"]
  }]
}

// Consumer
async queue(batch: MessageBatch, env: Env) {
  for (const message of batch.messages) {
    const event = message.body; // { action, bucket, object, timestamps }
    if (event.action === 'PutObject') {
      // Process upload: thumbnail generation, virus scan, etc.
    }
  }
}
```

## Reading Order

**First-time users:** README → configuration.md → api.md → patterns.md  
**Specific tasks:**
- Setup: configuration.md
- Client uploads: patterns.md (presigned URLs)
- Public static site: patterns.md (public access + custom domain)
- Processing uploads: README (event notifications) + queues reference
- Debugging: gotchas.md

## In This Reference

- [configuration.md](./configuration.md) - Bindings, S3 SDK, CORS, lifecycles, token scopes
- [api.md](./api.md) - Workers API, multipart, conditional requests, presigned URLs
- [patterns.md](./patterns.md) - Streaming, caching, client uploads, public buckets
- [gotchas.md](./gotchas.md) - List truncation, etag format, stream length, S3 SDK region

## See Also

- [workers](../workers/) - Worker runtime and fetch handlers
- [kv](../kv/) - Metadata storage for R2 objects
- [d1](../d1/) - Store R2 URLs in relational database
- [queues](../queues/) - Process R2 uploads asynchronously
