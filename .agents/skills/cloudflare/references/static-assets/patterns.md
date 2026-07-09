### Common Patterns

**1. Forward request to assets:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  }
};
```

**2. Fetch specific asset by path:**

```typescript
const response = await env.ASSETS.fetch("https://assets.local/logo.png");
```

**3. Modify request before fetching asset:**

```typescript
const url = new URL(request.url);
url.pathname = "/index.html";
return env.ASSETS.fetch(new Request(url, request));
```

**4. Transform asset response:**

```typescript
const response = await env.ASSETS.fetch(request);
const modifiedResponse = new Response(response.body, response);
modifiedResponse.headers.set("X-Custom-Header", "value");
modifiedResponse.headers.set("Cache-Control", "public, max-age=3600");
return modifiedResponse;
```

**5. Conditional asset serving:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return env.ASSETS.fetch('/index.html');
    }
    return env.ASSETS.fetch(request);
  }
};
```

**6. SPA with API routes:**

Most common full-stack pattern - static SPA with backend API:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request: Request, env: Env): Promise<Response> {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Config:** Set `run_worker_first: ["/api/*"]` (see configuration.md:66-106)

**7. Auth gating for protected assets:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/admin/')) {
      const session = await validateSession(request, env);
      if (!session) {
        return Response.redirect('/login', 302);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
```

**Config:** Set `run_worker_first: ["/admin/*"]`

**8. Custom headers for security:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    const secureResponse = new Response(response.body, response);
    secureResponse.headers.set('X-Frame-Options', 'DENY');
    secureResponse.headers.set('X-Content-Type-Options', 'nosniff');
    secureResponse.headers.set('Content-Security-Policy', "default-src 'self'");
    return secureResponse;
  }
};
```

**9. A/B testing via cookies:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cookies = request.headers.get('Cookie') || '';
    const variant = cookies.includes('variant=b') ? 'b' : 'a';
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return env.ASSETS.fetch(`/index-${variant}.html`);
    }
    return env.ASSETS.fetch(request);
  }
};
```

**10. Locale-based routing:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const locale = request.headers.get('Accept-Language')?.split(',')[0] || 'en';
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return env.ASSETS.fetch(`/${locale}/index.html`);
    }
    if (!url.pathname.startsWith(`/${locale}/`)) {
      url.pathname = `/${locale}${url.pathname}`;
    }
    return env.ASSETS.fetch(url);
  }
};
```

**11. OAuth callback handling:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      if (code) {
        const session = await exchangeCode(code, env);
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/',
            'Set-Cookie': `session=${session}; HttpOnly; Secure; SameSite=Lax`
          }
        });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
```

**Config:** Set `run_worker_first: ["/auth/*"]`

**12. Cache control override:**

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    // Immutable assets (hashed filenames)
    if (/\.[a-f0-9]{8,}\.(js|css|png|jpg)$/.test(url.pathname)) {
      return new Response(response.body, {
        ...response,
        headers: {
          ...Object.fromEntries(response.headers),
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    return response;
  }
};
```
