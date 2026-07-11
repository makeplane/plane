# Binding Patterns and Best Practices

## Service Binding Patterns

### RPC via Service Bindings

```typescript
// auth-worker
export default {
  async fetch(request: Request, env: Env) {
    const token = request.headers.get('Authorization');
    return new Response(JSON.stringify({ valid: await validateToken(token) }));
  }
}

// api-worker
const response = await env.AUTH_SERVICE.fetch(
  new Request('https://fake-host/validate', {
    headers: { 'Authorization': token }
  })
);
```

**Why RPC?** Zero latency (same datacenter), no DNS, free, type-safe.

**HTTP vs Service:**
```typescript
// ❌ HTTP (slow, paid, cross-region latency)
await fetch('https://auth-worker.example.com/validate');

// ✅ Service binding (fast, free, same isolate)
await env.AUTH_SERVICE.fetch(new Request('https://fake-host/validate'));
```

**URL doesn't matter:** Service bindings ignore hostname/protocol, routing happens via binding name.

### Typed Service RPC

```typescript
// shared-types.ts
export interface AuthRequest { token: string; }
export interface AuthResponse { valid: boolean; userId?: string; }

// auth-worker
export default {
  async fetch(request: Request): Promise<Response> {
    const body: AuthRequest = await request.json();
    const response: AuthResponse = { valid: true, userId: '123' };
    return Response.json(response);
  }
}

// api-worker
const response = await env.AUTH_SERVICE.fetch(
  new Request('https://fake/validate', {
    method: 'POST',
    body: JSON.stringify({ token } satisfies AuthRequest)
  })
);
const data: AuthResponse = await response.json();
```

## Secrets Management

```bash
# Set secret
npx wrangler secret put API_KEY
cat api-key.txt | npx wrangler secret put API_KEY
npx wrangler secret put API_KEY --env staging
```

```typescript
// Use secret
const response = await fetch('https://api.example.com', {
  headers: { 'Authorization': `Bearer ${env.API_KEY}` }
});
```

**Never commit secrets:**
```jsonc
// ❌ NEVER
{ "vars": { "API_KEY": "sk_live_abc123" } }
```

## Testing with Mock Bindings

### Vitest Mock

```typescript
import { vi } from 'vitest';

const mockKV: KVNamespace = {
  get: vi.fn(async (key) => key === 'test' ? 'value' : null),
  put: vi.fn(async () => {}),
  delete: vi.fn(async () => {}),
  list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: '' })),
  getWithMetadata: vi.fn(),
} as unknown as KVNamespace;

const mockEnv: Env = { MY_KV: mockKV };
const mockCtx: ExecutionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

const response = await worker.fetch(
  new Request('http://localhost/test'),
  mockEnv,
  mockCtx
);
```

## Binding Access Patterns

### Lazy Access

```typescript
// ✅ Access only when needed
if (url.pathname === '/cached') {
  const cached = await env.MY_KV.get('data');
  if (cached) return new Response(cached);
}
```

### Parallel Access

```typescript
// ✅ Parallelize independent calls
const [user, config, cache] = await Promise.all([
  env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first(),
  env.MY_KV.get('config'),
  env.CACHE.get('data')
]);
```

## Storage Selection

### KV: CDN-Backed Reads

```typescript
const config = await env.MY_KV.get('app-config', { type: 'json' });
```

**Use when:** Read-heavy, <25MB, global distribution, eventual consistency OK  
**Latency:** <10ms reads (cached), writes eventually consistent (60s)

### D1: Relational Queries

```typescript
const results = await env.DB.prepare(`
  SELECT u.name, COUNT(o.id) FROM users u
  LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id
`).all();
```

**Use when:** Relational data, JOINs, ACID transactions  
**Limits:** 10GB database size, 100k rows per query

### R2: Large Objects

```typescript
const object = await env.MY_BUCKET.get('large-file.zip');
return new Response(object.body);
```

**Use when:** Files >25MB, S3-compatible API needed  
**Limits:** 5TB per object, unlimited storage

### Durable Objects: Coordination

```typescript
const id = env.COUNTER.idFromName('global');
const stub = env.COUNTER.get(id);
await stub.fetch(new Request('https://fake/increment'));
```

**Use when:** Strong consistency, real-time coordination, WebSocket state  
**Guarantees:** Single-threaded execution, transactional storage

## Anti-Patterns

**❌ Hardcoding credentials:** `const apiKey = 'sk_live_abc123'`  
**✅** `npx wrangler secret put API_KEY`

**❌ Using REST API:** `fetch('https://api.cloudflare.com/.../kv/...')`  
**✅** `env.MY_KV.get('key')`

**❌ Polling storage:** `setInterval(() => env.KV.get('config'), 1000)`  
**✅** Use Durable Objects for real-time state

**❌ Large data in vars:** `{ "vars": { "HUGE_CONFIG": "..." } }` (5KB max)  
**✅** `env.MY_KV.put('config', data)`

**❌ Caching env globally:** `const apiKey = env.API_KEY` outside fetch()  
**✅** Access `env.API_KEY` per-request inside fetch()

## See Also

- [Service Bindings Docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Miniflare Testing](https://miniflare.dev/)