# Cloudflare Workers Runtime APIs

Key runtime APIs for Workers development.

## Fetch API

```typescript
// Subrequest
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
  cf: {
    cacheTtl: 3600,
    cacheEverything: true
  }
});

const data = await response.json();
```

## Headers API

```typescript
// Read headers
const userAgent = request.headers.get('User-Agent');

// Cloudflare-specific
const country = request.cf?.country;
const colo = request.cf?.colo;
const clientIP = request.headers.get('CF-Connecting-IP');

// Set headers
const headers = new Headers();
headers.set('Content-Type', 'application/json');
headers.append('X-Custom-Header', 'value');
```

## HTMLRewriter

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);

    return new HTMLRewriter()
      .on('title', {
        element(element) {
          element.setInnerContent('New Title');
        }
      })
      .on('a[href]', {
        element(element) {
          const href = element.getAttribute('href');
          element.setAttribute('href', href.replace('http://', 'https://'));
        }
      })
      .transform(response);
  }
};
```

## WebSockets

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    server.addEventListener('message', (event) => {
      server.send(`Echo: ${event.data}`);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
```

## Streams API

```typescript
const { readable, writable } = new TransformStream();

const writer = writable.getWriter();
writer.write(new TextEncoder().encode('chunk 1'));
writer.write(new TextEncoder().encode('chunk 2'));
writer.close();

return new Response(readable, {
  headers: { 'Content-Type': 'text/plain' }
});
```

## Web Crypto API

```typescript
// Generate hash
const data = new TextEncoder().encode('message');
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

// HMAC signature
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode('secret'),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

const signature = await crypto.subtle.sign('HMAC', key, data);
const valid = await crypto.subtle.verify('HMAC', key, signature, data);

// Random values
const randomBytes = crypto.getRandomValues(new Uint8Array(32));
const uuid = crypto.randomUUID();
```

## Encoding APIs

```typescript
// TextEncoder
const encoder = new TextEncoder();
const bytes = encoder.encode('Hello');

// TextDecoder
const decoder = new TextDecoder();
const text = decoder.decode(bytes);

// Base64
const base64 = btoa('Hello');
const decoded = atob(base64);
```

## URL API

```typescript
const url = new URL(request.url);
const hostname = url.hostname;
const pathname = url.pathname;
const search = url.search;

// Query parameters
const name = url.searchParams.get('name');
url.searchParams.set('page', '2');
url.searchParams.delete('old');
```

## FormData API

```typescript
// Parse form data
const formData = await request.formData();
const name = formData.get('name');
const file = formData.get('file');

// Create form data
const form = new FormData();
form.append('name', 'value');
form.append('file', blob, 'filename.txt');
```

## Response Types

```typescript
// Text
return new Response('Hello');

// JSON
return Response.json({ message: 'Hello' });

// Stream
return new Response(readable);

// Redirect
return Response.redirect('https://example.com', 302);

// Error
return new Response('Not Found', { status: 404 });
```

## Request Cloning

```typescript
// Clone for multiple reads
const clone = request.clone();
const body1 = await request.json();
const body2 = await clone.json();
```

## AbortController

```typescript
const controller = new AbortController();
const { signal } = controller;

setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('https://slow-api.com', { signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
}
```

## Scheduling APIs

```typescript
// setTimeout
const timeoutId = setTimeout(() => {
  console.log('Delayed');
}, 1000);

// setInterval
const intervalId = setInterval(() => {
  console.log('Repeated');
}, 1000);

// Clear
clearTimeout(timeoutId);
clearInterval(intervalId);
```

## Console API

```typescript
console.log('Info message');
console.error('Error message');
console.warn('Warning message');
console.debug('Debug message');

// Structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'Request processed',
  url: request.url,
  timestamp: new Date().toISOString()
}));
```

## Performance API

```typescript
const start = performance.now();
await processRequest();
const duration = performance.now() - start;
console.log(`Processed in ${duration}ms`);
```

## Bindings Reference

### KV Operations
```typescript
await env.KV.put(key, value, { expirationTtl: 3600, metadata: { userId: '123' } });
const value = await env.KV.get(key, 'json');
const { value, metadata } = await env.KV.getWithMetadata(key);
await env.KV.delete(key);
const list = await env.KV.list({ prefix: 'user:' });
```

### D1 Operations
```typescript
const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
const { results } = await env.DB.prepare('SELECT * FROM users').all();
await env.DB.prepare('INSERT INTO users (name) VALUES (?)').bind(name).run();
await env.DB.batch([stmt1, stmt2, stmt3]);
```

### R2 Operations
```typescript
await env.R2.put(key, value, { httpMetadata: { contentType: 'image/jpeg' } });
const object = await env.R2.get(key);
await env.R2.delete(key);
const list = await env.R2.list({ prefix: 'uploads/' });
const multipart = await env.R2.createMultipartUpload(key);
```

### Queue Operations
```typescript
await env.QUEUE.send({ type: 'email', to: 'user@example.com' });
await env.QUEUE.sendBatch([{ body: msg1 }, { body: msg2 }]);
```

### Workers AI
```typescript
const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [{ role: 'user', content: 'What is edge computing?' }]
});
```

## Resources

- Runtime APIs: https://developers.cloudflare.com/workers/runtime-apis/
- Web Standards: https://developers.cloudflare.com/workers/runtime-apis/web-standards/
- Bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/
