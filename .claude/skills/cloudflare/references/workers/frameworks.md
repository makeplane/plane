# Workers Frameworks

## Hono (Recommended)

Workers-native web framework with excellent TypeScript support and middleware ecosystem.

```bash
npm install hono
```

### Basic Setup

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello World!'));
app.post('/api/users', async (c) => {
  const body = await c.req.json();
  return c.json({ id: 1, ...body }, 201);
});

export default app;
```

### Typed Environment

```typescript
import type { Env } from './.wrangler/types/runtime';

const app = new Hono<{ Bindings: Env }>();

app.get('/data', async (c) => {
  const value = await c.env.MY_KV.get('key');  // Fully typed
  return c.text(value || 'Not found');
});
```

### Middleware

```typescript
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

app.use('*', logger());
app.use('/api/*', cors({ origin: '*' }));

// Custom middleware
app.use('/protected/*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.text('Unauthorized', 401);
  await next();
});
```

### Request Validation (Zod)

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post('/users', zValidator('json', schema), async (c) => {
  const validated = c.req.valid('json');  // Type-safe, validated data
  return c.json({ id: 1, ...validated });
});
```

**Error handling**: Automatic 400 response with validation errors

### Route Groups

```typescript
const api = new Hono().basePath('/api');

api.get('/users', (c) => c.json([]));
api.post('/users', (c) => c.json({ id: 1 }));

app.route('/', api);  // Mounts at /api/*
```

### Error Handling

```typescript
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

app.notFound((c) => c.json({ error: 'Not Found' }, 404));
```

### Accessing ExecutionContext

```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};

// In route handlers:
app.get('/log', (c) => {
  c.executionCtx.waitUntil(logRequest(c.req));
  return c.text('OK');
});
```

### OpenAPI/Swagger (Hono OpenAPI)

```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

const route = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'User found', content: { 'application/json': { schema: z.object({ id: z.string() }) } } },
  },
});

app.openapi(route, (c) => {
  const { id } = c.req.valid('param');
  return c.json({ id });
});

app.doc('/openapi.json', { openapi: '3.0.0', info: { version: '1.0.0', title: 'API' } });
```

### Testing with Hono

```typescript
import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('API', () => {
  it('GET /', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello World!');
  });
});
```

## Other Frameworks

### itty-router (Minimalist)

```typescript
import { Router } from 'itty-router';

const router = Router();

router.get('/users/:id', ({ params }) => new Response(params.id));

export default { fetch: router.handle };
```

**Use case**: Tiny bundle size (~500 bytes), simple routing needs

### Worktop (Advanced)

```typescript
import { Router } from 'worktop';

const router = new Router();

router.add('GET', '/users/:id', (req, res) => {
  res.send(200, { id: req.params.id });
});

router.listen();
```

**Use case**: Advanced routing, built-in CORS/cache utilities

## Framework Comparison

| Framework | Bundle Size | TypeScript | Middleware | Validation | Best For |
|-----------|-------------|------------|------------|------------|----------|
| Hono | ~12KB | Excellent | Rich | Zod | Production apps |
| itty-router | ~500B | Good | Basic | Manual | Minimal APIs |
| Worktop | ~8KB | Good | Advanced | Manual | Complex routing |

## See Also

- [Patterns](./patterns.md) - Common workflows
- [API](./api.md) - Runtime APIs
- [Gotchas](./gotchas.md) - Framework-specific issues
