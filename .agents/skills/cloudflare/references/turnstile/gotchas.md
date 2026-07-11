# Troubleshooting & Gotchas

## Critical Rules

### ❌ Skipping Server-Side Validation
**Problem:** Client-only validation is easily bypassed.

**Solution:** Always validate on server.
```javascript
// CORRECT - Server validates token
app.post('/submit', async (req, res) => {
  const token = req.body['cf-turnstile-response'];
  const validation = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: JSON.stringify({ secret: SECRET, response: token })
  }).then(r => r.json());
  
  if (!validation.success) return res.status(403).json({ error: 'CAPTCHA failed' });
});
```

### ❌ Exposing Secret Key
**Problem:** Secret key leaked in client-side code.

**Solution:** Server-side validation only. Never send secret to client.

### ❌ Reusing Tokens (Single-Use Rule)
**Problem:** Tokens are single-use. Revalidation fails with `timeout-or-duplicate`.

**Solution:** Generate new token for each submission. Reset widget on error.
```javascript
if (!response.ok) window.turnstile.reset(widgetId);
```

### ❌ Not Handling Token Expiry
**Problem:** Tokens expire after 5 minutes.

**Solution:** Handle expiry callback or use auto-refresh.
```javascript
window.turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  'refresh-expired': 'auto', // or 'manual' with expired-callback
  'expired-callback': () => window.turnstile.reset(widgetId)
});
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| **Widget not rendering** | Incorrect sitekey, CSP blocking, file:// protocol | Check sitekey, add CSP for challenges.cloudflare.com, use http:// |
| **timeout-or-duplicate** | Token expired (>5min) or reused | Generate fresh token, don't cache >5min |
| **invalid-input-secret** | Wrong secret key | Verify secret from dashboard, check env vars |
| **missing-input-response** | Token not sent | Check form field name is 'cf-turnstile-response' |

## Framework Gotchas

### React: Widget Re-mounting
**Problem:** Widget re-renders on state change, losing token.

**Solution:** Control lifecycle with useRef.
```tsx
function TurnstileWidget({ onToken }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: 'YOUR_SITE_KEY',
        callback: onToken
      });
    }
    return () => {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);
  
  return <div ref={containerRef} />;
}
```

### React StrictMode: Double Render
**Problem:** Widget renders twice in dev due to StrictMode.

**Solution:** Use cleanup function.
```tsx
useEffect(() => {
  const widgetId = window.turnstile.render('#container', { sitekey });
  return () => window.turnstile.remove(widgetId);
}, []);
```

### Next.js: SSR Hydration
**Problem:** `window.turnstile` undefined during SSR.

**Solution:** Use `'use client'` or dynamic import with `ssr: false`.
```tsx
'use client';
export default function Turnstile() { /* component */ }
```

### SPA: Navigation Without Cleanup
**Problem:** Navigating leaves orphaned widgets.

**Solution:** Remove widget in cleanup.
```javascript
// Vue
onBeforeUnmount(() => window.turnstile.remove(widgetId));

// React
useEffect(() => () => window.turnstile.remove(widgetId), []);
```

## Network & Security

### CSP Blocking
**Problem:** Content Security Policy blocks script/iframe.

**Solution:** Add CSP directives.
```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://challenges.cloudflare.com; 
               frame-src https://challenges.cloudflare.com;">
```

### IP Address Forwarding
**Problem:** Server receives proxy IP instead of client IP.

**Solution:** Use correct header.
```javascript
// Cloudflare Workers
const ip = request.headers.get('CF-Connecting-IP');

// Behind proxy
const ip = request.headers.get('X-Forwarded-For')?.split(',')[0];
```

### CORS (Siteverify)
**Problem:** CORS error calling siteverify from browser.

**Solution:** Never call siteverify client-side. Call your backend, backend calls siteverify.

## Limits & Constraints

| Limit | Value | Impact |
|-------|-------|--------|
| Token validity | 5 minutes | Must regenerate after expiry |
| Token use | Single-use | Cannot revalidate same token |
| Widget size | 300x65px (normal), 130x120px (compact) | Plan layout |

## Debugging

### Console Logging
```javascript
window.turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => console.log('✓ Token:', token),
  'error-callback': (code) => console.error('✗ Error:', code),
  'expired-callback': () => console.warn('⏱ Expired'),
  'timeout-callback': () => console.warn('⏱ Timeout')
});
```

### Check Token State
```javascript
const token = window.turnstile.getResponse(widgetId);
console.log('Token:', token || 'NOT READY');
console.log('Expired:', window.turnstile.isExpired(widgetId));
```

### Test Keys (Use First)
Always develop with test keys before production:
- Site: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`

### Network Tab
- Verify `api.js` loads (200 OK)
- Check siteverify request/response
- Look for 4xx/5xx errors

## Misconfigurations

### Wrong Key Pairing
**Problem:** Site key from one widget, secret from another.

**Solution:** Verify site key and secret are from same widget in dashboard.

### Test Keys in Production
**Problem:** Using test keys in production.

**Solution:** Environment-based keys.
```javascript
const SITE_KEY = process.env.NODE_ENV === 'production'
  ? process.env.TURNSTILE_SITE_KEY
  : '1x00000000000000000000AA';
```

### Missing Environment Variables
**Problem:** Secret undefined on server.

**Solution:** Check .env and verify loading.
```bash
# .env
TURNSTILE_SECRET=your_secret_here

# Verify
console.log('Secret loaded:', !!process.env.TURNSTILE_SECRET);
```

## Reference

- [Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
- [Error Codes](https://developers.cloudflare.com/turnstile/troubleshooting/)
