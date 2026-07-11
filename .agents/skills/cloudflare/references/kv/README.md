# Cloudflare Workers KV

Globally-distributed, eventually-consistent key-value store optimized for high read volume and low latency.

## Overview

KV provides:
- Eventual consistency (60s global propagation)
- Read-optimized performance
- 25 MiB value limit per key
- Auto-replication to Cloudflare edge
- Metadata support (1024 bytes)

**Use cases:** Config storage, user sessions, feature flags, caching, A/B testing

## When to Use KV

| Need | Recommendation |
|------|----------------|
| Strong consistency | → [Durable Objects](../durable-objects/) |
| SQL queries | → [D1](../d1/) |
| Object storage (files) | → [R2](../r2/) |
| High read, low write volume | → KV ✅ |
| Sub-10ms global reads | → KV ✅ |

**Quick comparison:**

| Feature | KV | D1 | Durable Objects |
|---------|----|----|-----------------|
| Consistency | Eventual | Strong | Strong |
| Read latency | <10ms | ~50ms | <1ms |
| Write limit | 1/s per key | Unlimited | Unlimited |
| Use case | Config, cache | Relational data | Coordination |

## Quick Start

```bash
wrangler kv namespace create MY_NAMESPACE
# Add binding to wrangler.jsonc
```

```typescript
// Write
await env.MY_KV.put("key", "value", { expirationTtl: 300 });

// Read
const value = await env.MY_KV.get("key");
const json = await env.MY_KV.get<Config>("config", "json");
```

## Core Operations

| Method | Purpose | Returns |
|--------|---------|---------|
| `get(key, type?)` | Single read | `string \| null` |
| `get(keys, type?)` | Bulk read (≤100) | `Map<string, T \| null>` |
| `put(key, value, options?)` | Write | `Promise<void>` |
| `delete(key)` | Delete | `Promise<void>` |
| `list(options?)` | List keys | `{ keys, list_complete, cursor? }` |
| `getWithMetadata(key)` | Get + metadata | `{ value, metadata }` |

## Consistency Model

- **Write visibility:** Immediate in same location, ≤60s globally
- **Read path:** Eventually consistent
- **Write rate:** 1 write/second per key (429 on exceed)

## Reading Order

| Task | Files to Read |
|------|---------------|
| Quick start | README → configuration.md |
| Implement feature | README → api.md → patterns.md |
| Debug issues | gotchas.md → api.md |
| Batch operations | api.md (bulk section) → patterns.md |
| Performance tuning | gotchas.md (performance) → patterns.md (caching) |

## In This Reference

- [configuration.md](./configuration.md) - wrangler.jsonc setup, namespace creation, TypeScript types
- [api.md](./api.md) - KV methods, bulk operations, cacheTtl, content types
- [patterns.md](./patterns.md) - Caching, sessions, rate limiting, A/B testing
- [gotchas.md](./gotchas.md) - Eventual consistency, concurrent writes, value limits

## See Also

- [workers](../workers/) - Worker runtime for KV access
- [d1](../d1/) - Use D1 for strong consistency needs
- [durable-objects](../durable-objects/) - Strongly consistent alternative
