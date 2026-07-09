# Patterns

## API Routes

```typescript
// functions/api/todos/[id].ts
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const todo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(params.id).first();
  if (!todo) return new Response('Not found', { status: 404 });
  return Response.json(todo);
};

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  const body = await request.json();
  await env.DB.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?')
    .bind(body.title, body.completed, params.id).run();
  return Response.json({ success: true });
};
// Also: onRequestDelete, onRequestPost
```

## Auth Middleware

```typescript
// functions/_middleware.ts
const auth: PagesFunction<Env> = async (context) => {
  if (context.request.url.includes('/public/')) return context.next();
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const payload = await verifyJWT(authHeader.substring(7), context.env.JWT_SECRET);
    context.data.user = payload;
    return context.next();
  } catch (err) {
    return new Response('Invalid token', { status: 401 });
  }
};
export const onRequest = [auth];
```

## CORS

```typescript
// functions/api/_middleware.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {headers: corsHeaders});
  }
  const response = await context.next();
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
};
```

## Form Handling

```typescript
// functions/api/contact.ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData();
  await env.QUEUE.send({name: formData.get('name'), email: formData.get('email')});
  return new Response('<h1>Thanks!</h1>', { headers: { 'Content-Type': 'text/html' } });
};
```

## Background Tasks

```typescript
export const onRequestPost: PagesFunction = async ({ request, waitUntil }) => {
  const data = await request.json();
  waitUntil(fetch('https://api.example.com/webhook', {
    method: 'POST', body: JSON.stringify(data)
  }));
  return Response.json({ queued: true });
};
```

## Error Handling

```typescript
// functions/_middleware.ts
const errorHandler: PagesFunction = async (context) => {
  try {
    return await context.next();
  } catch (error) {
    console.error('Error:', error);
    if (context.request.url.includes('/api/')) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return new Response(`<h1>Error</h1><p>${error.message}</p>`, { 
      status: 500, headers: { 'Content-Type': 'text/html' } 
    });
  }
};
export const onRequest = [errorHandler];
```

## Caching

```typescript
// functions/api/data.ts
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const cacheKey = `data:${new URL(request.url).pathname}`;
  const cached = await env.KV.get(cacheKey, 'json');
  if (cached) return Response.json(cached, { headers: { 'X-Cache': 'HIT' } });
  
  const data = await env.DB.prepare('SELECT * FROM data').first();
  await env.KV.put(cacheKey, JSON.stringify(data), {expirationTtl: 3600});
  return Response.json(data, {headers: {'X-Cache': 'MISS'}});
};
```

## Smart Placement for Database Apps

Enable Smart Placement for apps with D1 or centralized data sources:

```jsonc
// wrangler.jsonc
{
  "name": "global-app",
  "placement": {
    "mode": "smart"
  },
  "d1_databases": [{
    "binding": "DB",
    "database_id": "your-db-id"
  }]
}
```

```typescript
// functions/api/data.ts
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  // Smart Placement optimizes execution location over time
  // Balances user location vs database location
  const data = await env.DB.prepare('SELECT * FROM products LIMIT 10').all();
  return Response.json(data);
};
```

**Best for**: Read-heavy apps with D1/Durable Objects in specific regions.  
**Not needed**: Apps without data locality constraints or with evenly distributed traffic.

## Framework Integration

**Supported** (2026): SvelteKit, Astro, Nuxt, Qwik, Solid Start

```bash
npm create cloudflare@latest my-app -- --framework=svelte
```

### SvelteKit
```typescript
// src/routes/+page.server.ts
export const load = async ({ platform }) => {
  const todos = await platform.env.DB.prepare('SELECT * FROM todos').all();
  return { todos: todos.results };
};
```

### Astro
```astro
---
const { DB } = Astro.locals.runtime.env;
const todos = await DB.prepare('SELECT * FROM todos').all();
---
<ul>{todos.results.map(t => <li>{t.title}</li>)}</ul>
```

### Nuxt
```typescript
// server/api/todos.get.ts
export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env;
  return await DB.prepare('SELECT * FROM todos').all();
});
```

**⚠️ Framework Status** (2026):
- ✅ **Supported**: SvelteKit, Astro, Nuxt, Qwik, Solid Start
- ❌ **Deprecated**: Next.js (`@cloudflare/next-on-pages`), Remix (`@remix-run/cloudflare-pages`)

For deprecated frameworks, see [gotchas.md](./gotchas.md#framework-specific) for migration options.

[Framework Guides](https://developers.cloudflare.com/pages/framework-guides/)

## Monorepo

Dashboard → Settings → Build → Root directory. Set to subproject (e.g., `apps/web`).

## Best Practices

**Performance**: Exclude static via `_routes.json`; cache with KV; keep bundle < 1MB  
**Security**: Use secrets (not vars); validate inputs; rate limit with KV/DO  
**Workflow**: Preview per branch; local dev with `wrangler pages dev`; instant rollbacks in Dashboard
