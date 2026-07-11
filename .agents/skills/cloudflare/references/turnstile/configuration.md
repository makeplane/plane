# Configuration

## Script Loading

### Basic (Implicit Rendering)
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```
Automatically renders widgets with `class="cf-turnstile"` on page load.

### Explicit Rendering
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
```
Manual control over when/where widgets render via `window.turnstile.render()`.

### With Load Callback
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=myCallback"></script>
<script>
function myCallback() {
  // API ready
  window.turnstile.render('#container', { sitekey: 'YOUR_SITE_KEY' });
}
</script>
```

### Compatibility Mode
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha"></script>
```
Provides `grecaptcha` API for Google reCAPTCHA drop-in replacement.

## Widget Configuration

### Complete Options Object

```javascript
{
  // Required
  sitekey: 'YOUR_SITE_KEY',        // Widget sitekey from dashboard

  // Callbacks
  callback: (token) => {},          // Success - token ready
  'error-callback': (code) => {},   // Error occurred
  'expired-callback': () => {},     // Token expired (>5min)
  'timeout-callback': () => {},     // Challenge timeout
  'before-interactive-callback': () => {}, // Before showing checkbox
  'after-interactive-callback': () => {},  // After user interacts
  'unsupported-callback': () => {}, // Browser doesn't support Turnstile

  // Appearance
  theme: 'auto',                    // 'light' | 'dark' | 'auto'
  size: 'normal',                   // 'normal' | 'compact' | 'flexible'
  tabindex: 0,                      // Tab order (accessibility)
  language: 'auto',                 // ISO 639-1 code or 'auto'

  // Behavior
  execution: 'render',              // 'render' (auto) | 'execute' (manual)
  appearance: 'always',             // 'always' | 'execute' | 'interaction-only'
  retry: 'auto',                    // 'auto' | 'never'
  'retry-interval': 8000,           // Retry interval (ms), default 8000
  'refresh-expired': 'auto',        // 'auto' | 'manual' | 'never'

  // Form Integration
  'response-field': true,           // Add hidden input (default: true)
  'response-field-name': 'cf-turnstile-response', // Hidden input name

  // Analytics & Data
  action: 'login',                  // Action name (for analytics)
  cData: 'user-session-123',        // Custom data (returned in siteverify)
}
```

### Key Options Explained

**`execution`:**
- `'render'` (default): Challenge starts immediately on render
- `'execute'`: Wait for `turnstile.execute()` call

**`appearance`:**
- `'always'` (default): Widget always visible
- `'execute'`: Hidden until `execute()` called
- `'interaction-only'`: Hidden until user interaction needed

**`refresh-expired`:**
- `'auto'` (default): Auto-refresh expired tokens
- `'manual'`: App must call `reset()` after expiry
- `'never'`: No refresh, expired-callback triggered

**`retry`:**
- `'auto'` (default): Auto-retry failed challenges
- `'never'`: Don't retry, trigger error-callback

## HTML Data Attributes

For implicit rendering, use data attributes on `<div class="cf-turnstile">`:

| JavaScript Property | HTML Data Attribute | Example |
|---------------------|---------------------|---------|
| `sitekey` | `data-sitekey` | `data-sitekey="YOUR_KEY"` |
| `action` | `data-action` | `data-action="login"` |
| `cData` | `data-cdata` | `data-cdata="session-123"` |
| `callback` | `data-callback` | `data-callback="onSuccess"` |
| `error-callback` | `data-error-callback` | `data-error-callback="onError"` |
| `expired-callback` | `data-expired-callback` | `data-expired-callback="onExpired"` |
| `timeout-callback` | `data-timeout-callback` | `data-timeout-callback="onTimeout"` |
| `theme` | `data-theme` | `data-theme="dark"` |
| `size` | `data-size` | `data-size="compact"` |
| `tabindex` | `data-tabindex` | `data-tabindex="0"` |
| `response-field` | `data-response-field` | `data-response-field="false"` |
| `response-field-name` | `data-response-field-name` | `data-response-field-name="token"` |
| `retry` | `data-retry` | `data-retry="never"` |
| `retry-interval` | `data-retry-interval` | `data-retry-interval="5000"` |
| `language` | `data-language` | `data-language="en"` |
| `execution` | `data-execution` | `data-execution="execute"` |
| `appearance` | `data-appearance` | `data-appearance="interaction-only"` |
| `refresh-expired` | `data-refresh-expired` | `data-refresh-expired="manual"` |

**Example:**
```html
<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"
     data-theme="dark"
     data-callback="onTurnstileSuccess"
     data-error-callback="onTurnstileError"></div>
```

## Content Security Policy

Add these directives to CSP header/meta tag:

```
script-src https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
```

**Full Example:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://challenges.cloudflare.com; 
               frame-src https://challenges.cloudflare.com;">
```

## Framework-Specific Setup

### React
```bash
npm install @marsidev/react-turnstile
```
```jsx
import Turnstile from '@marsidev/react-turnstile';

<Turnstile
  siteKey="YOUR_SITE_KEY"
  onSuccess={(token) => console.log(token)}
/>
```

### Vue
```bash
npm install vue-turnstile
```
```vue
<template>
  <VueTurnstile site-key="YOUR_SITE_KEY" @success="onSuccess" />
</template>
<script setup>
import VueTurnstile from 'vue-turnstile';
</script>
```

### Svelte
```bash
npm install svelte-turnstile
```
```svelte
<script>
import Turnstile from 'svelte-turnstile';
</script>
<Turnstile siteKey="YOUR_SITE_KEY" on:turnstile-callback={handleToken} />
```

### Next.js (App Router)
```tsx
// app/components/TurnstileWidget.tsx
'use client';
import { useEffect, useRef } from 'react';

export default function TurnstileWidget({ sitekey, onSuccess }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current && window.turnstile) {
      const widgetId = window.turnstile.render(ref.current, {
        sitekey,
        callback: onSuccess
      });
      return () => window.turnstile.remove(widgetId);
    }
  }, [sitekey, onSuccess]);
  
  return <div ref={ref} />;
}
```

## Cloudflare Pages Plugin

```bash
npm install @cloudflare/pages-plugin-turnstile
```

```typescript
// functions/_middleware.ts
import turnstilePlugin from '@cloudflare/pages-plugin-turnstile';

export const onRequest = turnstilePlugin({
  secret: 'YOUR_SECRET_KEY',
  onError: () => new Response('CAPTCHA failed', { status: 403 })
});
```