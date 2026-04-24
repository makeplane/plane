# Cloudflare Workers Advanced Patterns

Advanced techniques for optimization, performance, and complex workflows.

## Session Reuse and Connection Pooling

### Durable Objects for Persistent Sessions
```typescript
export class Browser {
  state: DurableObjectState;
  browser: any;
  lastUsed: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.lastUsed = Date.now();
  }

  async fetch(request: Request, env: Env) {
    if (!this.browser) {
      this.browser = await puppeteer.launch(env.MYBROWSER);
    }

    this.lastUsed = Date.now();
    await this.state.storage.setAlarm(Date.now() + 10000);

    const page = await this.browser.newPage();
    await page.goto(new URL(request.url).searchParams.get('url'));
    const screenshot = await page.screenshot();
    await page.close();

    return new Response(screenshot);
  }

  async alarm() {
    if (Date.now() - this.lastUsed > 60000) {
      await this.browser?.close();
      this.browser = null;
    } else {
      await this.state.storage.setAlarm(Date.now() + 10000);
    }
  }
}
```

## Multi-Tier Caching Strategy

```typescript
const CACHE_TTL = 3600;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cache = caches.default;
    const cacheKey = new Request(request.url);

    // 1. Check edge cache
    let response = await cache.match(cacheKey);
    if (response) return response;

    // 2. Check KV cache
    const kvCached = await env.MY_KV.get(request.url);
    if (kvCached) {
      response = new Response(kvCached);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    // 3. Fetch from origin
    response = await fetch(request);

    // 4. Store in both caches
    ctx.waitUntil(Promise.all([
      cache.put(cacheKey, response.clone()),
      env.MY_KV.put(request.url, await response.clone().text(), {
        expirationTtl: CACHE_TTL
      })
    ]));

    return response;
  }
};
```

## WebSocket with Durable Objects

```typescript
export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    // Broadcast to all connected clients
    for (const session of this.sessions) {
      session.send(message);
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
  }
}
```

## Queue-Based Crawler

```typescript
export default {
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    const browser = await puppeteer.launch(env.MYBROWSER);

    for (const message of batch.messages) {
      const page = await browser.newPage();
      await page.goto(message.body.url);

      // Extract links
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href);
      });

      // Queue new links
      for (const link of links) {
        await env.QUEUE.send({ url: link });
      }

      await page.close();
      message.ack();
    }

    await browser.close();
  }
};
```

## Authentication Pattern

```typescript
import { sign, verify } from 'hono/jwt';

async function authenticate(request: Request, env: Env): Promise<any> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }

  const token = authHeader.substring(7);
  const payload = await verify(token, env.JWT_SECRET);

  return payload;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const user = await authenticate(request, env);
      return new Response(`Hello ${user.name}`);
    } catch (error) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
};
```

## Code Splitting

```typescript
// Lazy load large dependencies
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/heavy') {
      const { processHeavy } = await import('./heavy');
      return processHeavy(request);
    }

    return new Response('OK');
  }
};
```

## Batch Operations with D1

```typescript
// Efficient bulk inserts
const statements = users.map(user =>
  env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(user.name, user.email)
);

await env.DB.batch(statements);
```

## Stream Processing

```typescript
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    // Process chunk
    controller.enqueue(chunk);
  }
});

response.body.pipeTo(writable);
return new Response(readable);
```

## AI-Powered Web Scraper

```typescript
import { Ai } from '@cloudflare/ai';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Render page
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto('https://news.ycombinator.com');
    const content = await page.content();
    await browser.close();

    // Extract with AI
    const ai = new Ai(env.AI);
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'Extract top 5 article titles and URLs as JSON array'
        },
        { role: 'user', content: content }
      ]
    });

    return Response.json(response);
  }
};
```

## Performance Optimization

### Bundle Size
- Keep Workers <1MB bundled
- Remove unused dependencies
- Use code splitting
- Check with: `wrangler deploy --dry-run --outdir=dist`

### Cold Starts
- Minimize initialization code
- Use bindings over fetch
- Avoid large imports at top level

### Memory Management
- Close pages when done: `await page.close()`
- Disconnect browsers: `await browser.disconnect()`
- Implement cleanup alarms in Durable Objects

### Request Optimization
- Use server-side filtering with `--filter`
- Batch operations with D1 `.batch()`
- Stream large responses
- Implement proper caching

## Monitoring & Debugging

```bash
# Real-time logs
wrangler tail --format pretty

# Filter by status
wrangler tail --status error

# Check deployments
wrangler deployments list

# Rollback
wrangler rollback [version-id]
```

## Production Checklist

- [ ] Multi-stage error handling implemented
- [ ] Rate limiting configured
- [ ] Caching strategy in place
- [ ] Secrets managed with `wrangler secret`
- [ ] Health checks implemented
- [ ] Monitoring alerts configured
- [ ] Session reuse for browser rendering
- [ ] Resource cleanup (pages, browsers)
- [ ] Proper timeout configurations
- [ ] CI/CD pipeline set up

## Resources

- Advanced Patterns: https://developers.cloudflare.com/workers/examples/
- Durable Objects: https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
- Performance: https://developers.cloudflare.com/workers/platform/limits/
