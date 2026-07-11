# Common Patterns

## Form Integration

### Basic Form (Implicit Rendering)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <form action="/submit" method="POST">
    <input type="email" name="email" required>
    <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

### Controlled Form (Explicit Rendering)

```javascript
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
<script>
let widgetId = window.turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => console.log('Token:', token)
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = window.turnstile.getResponse(widgetId);
  if (!token) return;
  
  const response = await fetch('/submit', {
    method: 'POST',
    body: JSON.stringify({ 'cf-turnstile-response': token })
  });
  
  if (!response.ok) window.turnstile.reset(widgetId);
});
</script>
```

## Framework Patterns

### React

```tsx
import { useState } from 'react';
import Turnstile from '@marsidev/react-turnstile';

export default function Form() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (!token) return;
      await fetch('/api/submit', { 
        method: 'POST',
        body: JSON.stringify({ 'cf-turnstile-response': token })
      });
    }}>
      <Turnstile siteKey="YOUR_SITE_KEY" onSuccess={setToken} />
      <button disabled={!token}>Submit</button>
    </form>
  );
}
```

### Vue / Svelte

```vue
<!-- Vue: npm install vue-turnstile -->
<VueTurnstile :site-key="SITE_KEY" @success="token = $event" />

<!-- Svelte: npm install svelte-turnstile -->
<Turnstile siteKey={SITE_KEY} on:turnstile-callback={(e) => token = e.detail.token} />
```

## Server Validation

### Cloudflare Workers

```typescript
interface Env {
  TURNSTILE_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const formData = await request.formData();
    const token = formData.get('cf-turnstile-response');
    
    if (!token) {
      return new Response('Missing token', { status: 400 });
    }
    
    // Validate token
    const ip = request.headers.get('CF-Connecting-IP');
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: ip
      })
    });
    
    const validation = await result.json();
    
    if (!validation.success) {
      return new Response('CAPTCHA validation failed', { status: 403 });
    }
    
    // Process form...
    return new Response('Success');
  }
};
```

### Pages Functions

```typescript
// functions/submit.ts - same pattern as Workers, use ctx.env and ctx.request
export const onRequestPost: PagesFunction<{ TURNSTILE_SECRET: string }> = async (ctx) => {
  const token = (await ctx.request.formData()).get('cf-turnstile-response');
  // Validate with ctx.env.TURNSTILE_SECRET (same as Workers pattern above)
};
```

## Advanced Patterns

### Pre-Clearance (Invisible)

```html
<div id="turnstile-precheck"></div>
<form id="protected-form" style="display: none;">
  <button type="submit">Submit</button>
</form>

<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
<script>
let cachedToken = null;

window.onload = () => {
  window.turnstile.render('#turnstile-precheck', {
    sitekey: 'YOUR_SITE_KEY',
    size: 'invisible',
    callback: (token) => {
      cachedToken = token;
      document.getElementById('protected-form').style.display = 'block';
    }
  });
};
</script>
```

### Token Refresh on Expiry

```javascript
let widgetId = window.turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  'refresh-expired': 'manual',
  'expired-callback': () => {
    console.log('Token expired, refreshing...');
    window.turnstile.reset(widgetId);
  }
});
```

## Testing

### Environment-Based Keys

```javascript
const SITE_KEY = process.env.NODE_ENV === 'production'
  ? 'YOUR_PRODUCTION_SITE_KEY'
  : '1x00000000000000000000AA'; // Always passes

const SECRET_KEY = process.env.NODE_ENV === 'production'
  ? process.env.TURNSTILE_SECRET
  : '1x0000000000000000000000000000000AA';
```
