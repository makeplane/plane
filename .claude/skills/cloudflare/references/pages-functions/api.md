# Function API

## EventContext

```typescript
interface EventContext<Env = any> {
  request: Request;              // Incoming request
  functionPath: string;          // Request path
  waitUntil(promise: Promise<any>): void;  // Background tasks (non-blocking)
  passThroughOnException(): void;          // Fallback to static on error
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  env: Env;                      // Bindings, vars, secrets
  params: Record<string, string | string[]>;  // Route params ([user] or [[catchall]])
  data: any;                     // Middleware shared state
}
```

**TypeScript:** See [configuration.md](./configuration.md) for `wrangler types` setup

## Handlers

```typescript
// Generic (fallback for any method)
export async function onRequest(ctx: EventContext): Promise<Response> {
  return new Response('Any method');
}

// Method-specific (takes precedence over generic)
export async function onRequestGet(ctx: EventContext): Promise<Response> {
  return Response.json({ message: 'GET' });
}

export async function onRequestPost(ctx: EventContext): Promise<Response> {
  const body = await ctx.request.json();
  return Response.json({ received: body });
}
// Also: onRequestPut, onRequestPatch, onRequestDelete, onRequestHead, onRequestOptions
```

## Bindings Reference

| Binding Type | Interface | Config Key | Use Case |
|--------------|-----------|------------|----------|
| KV | `KVNamespace` | `kv_namespaces` | Key-value cache, sessions, config |
| D1 | `D1Database` | `d1_databases` | Relational data, SQL queries |
| R2 | `R2Bucket` | `r2_buckets` | Large files, user uploads, assets |
| Durable Objects | `DurableObjectNamespace` | `durable_objects.bindings` | Stateful coordination, websockets |
| Workers AI | `Ai` | `ai.binding` | LLM inference, embeddings |
| Vectorize | `VectorizeIndex` | `vectorize` | Vector search, embeddings |
| Service Binding | `Fetcher` | `services` | Worker-to-worker RPC |
| Analytics Engine | `AnalyticsEngineDataset` | `analytics_engine_datasets` | Event logging, metrics |
| Environment Vars | `string` | `vars` | Non-sensitive config |

See [configuration.md](./configuration.md) for wrangler.jsonc examples.

## Bindings

### KV

```typescript
interface Env { KV: KVNamespace; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  await ctx.env.KV.put('key', 'value', { expirationTtl: 3600 });
  const val = await ctx.env.KV.get('key', { type: 'json' });
  const keys = await ctx.env.KV.list({ prefix: 'user:' });
  return Response.json({ val });
};
```

### D1

```typescript
interface Env { DB: D1Database; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const user = await ctx.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(123).first();
  return Response.json(user);
};
```

### R2

```typescript
interface Env { BUCKET: R2Bucket; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const obj = await ctx.env.BUCKET.get('file.txt');
  if (!obj) return new Response('Not found', { status: 404 });
  await ctx.env.BUCKET.put('file.txt', ctx.request.body);
  return new Response(obj.body);
};
```

### Durable Objects

```typescript
interface Env { COUNTER: DurableObjectNamespace; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const stub = ctx.env.COUNTER.get(ctx.env.COUNTER.idFromName('global'));
  return stub.fetch(ctx.request);
};
```

### Workers AI

```typescript
interface Env { AI: Ai; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const resp = await ctx.env.AI.run('@cf/meta/llama-3.1-8b-instruct', { prompt: 'Hello' });
  return Response.json(resp);
};
```

### Service Bindings & Env Vars

```typescript
interface Env { AUTH: Fetcher; API_KEY: string; }
export const onRequest: PagesFunction<Env> = async (ctx) => {
  // Service binding: forward to another Worker
  return ctx.env.AUTH.fetch(ctx.request);
  
  // Environment variable
  return Response.json({ key: ctx.env.API_KEY });
};
```

## Advanced Mode (env.ASSETS)

When using `_worker.js`, access static assets via `env.ASSETS.fetch()`:

```typescript
interface Env { ASSETS: Fetcher; KV: KVNamespace; }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ data: await env.KV.get('key') });
    }
    return env.ASSETS.fetch(request); // Fallback to static
  }
} satisfies ExportedHandler<Env>;
```

**See also:** [configuration.md](./configuration.md) for TypeScript setup and wrangler.jsonc | [patterns.md](./patterns.md) for middleware and auth patterns
