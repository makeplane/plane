# Workers Gotchas

## Common Errors

### "Too much CPU time used"

**Cause:** Worker exceeded CPU time limit (10ms on Free plan, 30s default / 5min max on Paid)  
**Solution:** Use `ctx.waitUntil()` for background work, offload heavy compute to Durable Objects, or consider Workers AI for ML workloads

### "Module-Level State Lost"

**Cause:** Workers are stateless between requests; module-level variables reset unpredictably  
**Solution:** Use KV, D1, or Durable Objects for persistent state; don't rely on module-level variables

### "Body has already been used"

**Cause:** Attempting to read response body twice (bodies are streams)  
**Solution:** Clone response before reading: `response.clone()` or read once and create new Response with the text

### "Node.js module not found"

**Cause:** Node.js built-ins not available by default  
**Solution:** Use Workers APIs (e.g., R2 for file storage) or enable Node.js compat with `"compatibility_flags": ["nodejs_compat"]`

### "Cannot fetch in global scope"

**Cause:** Attempting to use fetch during module initialization  
**Solution:** Move fetch calls inside handler functions (fetch, scheduled, etc.) where they're allowed

### "Subrequest depth limit exceeded"

**Cause:** Too many nested subrequests creating deep call chain  
**Solution:** Flatten request chain or use service bindings for direct Worker-to-Worker communication

### "D1 read-after-write inconsistency"

**Cause:** D1 is eventually consistent; reads may not reflect recent writes  
**Solution:** Use D1 Sessions (2024+) to guarantee read-after-write consistency within a session:

```typescript
const session = env.DB.withSession();
await session.prepare('INSERT INTO users (name) VALUES (?)').bind('Alice').run();
const user = await session.prepare('SELECT * FROM users WHERE name = ?').bind('Alice').first(); // Guaranteed to see Alice
```

**When to use sessions:** Write → Read patterns, transactions requiring consistency

### "wrangler types not generating TypeScript definitions"

**Cause:** Type generation not configured or outdated  
**Solution:** Run `npx wrangler types` after changing bindings in wrangler.jsonc:

```bash
npx wrangler types  # Generates .wrangler/types/runtime.d.ts
```

Add to `tsconfig.json`: `"include": [".wrangler/types/**/*.ts"]`

Then import: `import type { Env } from './.wrangler/types/runtime';`

### "Durable Object RPC errors with deprecated fetch pattern"

**Cause:** Using old `stub.fetch()` pattern instead of RPC (2024+)  
**Solution:** Export methods directly, call via RPC:

```typescript
// ❌ Old fetch pattern
export class MyDO {
  async fetch(request: Request) {
    const { method } = await request.json();
    if (method === 'increment') return new Response(String(await this.increment()));
  }
  async increment() { return ++this.value; }
}
const stub = env.DO.get(id);
const res = await stub.fetch('http://x', { method: 'POST', body: JSON.stringify({ method: 'increment' }) });

// ✅ RPC pattern (type-safe, no serialization overhead)
export class MyDO {
  async increment() { return ++this.value; }
}
const stub = env.DO.get(id);
const count = await stub.increment(); // Direct method call
```

### "WebSocket connection closes unexpectedly"

**Cause:** Worker reaches CPU limit while maintaining WebSocket connection  
**Solution:** Use WebSocket hibernation (2024+) to offload idle connections:

```typescript
export class WebSocketDO {
  async webSocketMessage(ws: WebSocket, message: string) {
    // Handle message
  }
  async webSocketClose(ws: WebSocket, code: number) {
    // Cleanup
  }
}
```

Hibernation automatically suspends inactive connections, wakes on events

### "Framework middleware not working with Workers"

**Cause:** Framework expects Node.js primitives (e.g., Express uses Node streams)  
**Solution:** Use Workers-native frameworks (Hono, itty-router, Worktop) or adapt middleware:

```typescript
// ✅ Hono (Workers-native)
import { Hono } from 'hono';
const app = new Hono();
app.use('*', async (c, next) => { /* middleware */ await next(); });
```

See [frameworks.md](./frameworks.md) for full patterns

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Request size | 100 MB | Maximum incoming request size |
| Response size | Unlimited | Supports streaming |
| CPU time (Free) | 10ms | Free plan |
| CPU time (Paid) | 30s default / 5min max | Configurable via `limits.cpu_ms` |
| Subrequests (Free) | 50 | Per invocation |
| Subrequests (Paid) | 10,000 | Per invocation |
| Subrequest operations (KV, R2, Cache API) | 1,000 | Shared across KV reads, R2 ops, Cache API calls per request |
| KV value size | 25 MiB | Maximum per key |
| Environment variable size | 5 KB | Per variable |

## See Also

- [Patterns](./patterns.md) - Best practices
- [API](./api.md) - Runtime APIs
- [Configuration](./configuration.md) - Setup
- [Frameworks](./frameworks.md) - Hono, routing, validation
