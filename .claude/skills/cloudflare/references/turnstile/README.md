# Cloudflare Turnstile Implementation Skill Reference

Expert guidance for implementing Cloudflare Turnstile - a smart CAPTCHA alternative that protects websites from bots without showing traditional CAPTCHA puzzles.

## Overview

Turnstile is a user-friendly CAPTCHA alternative that runs challenges in the background without user interaction. It validates visitors automatically using signals like browser behavior, device fingerprinting, and machine learning.

## Widget Types

| Type | Interaction | Use Case |
|------|-------------|----------|
| **Managed** (default) | Shows checkbox when needed | Forms, logins - balance UX and security |
| **Non-Interactive** | Invisible, runs automatically | Frictionless UX, low-risk actions |
| **Invisible** | Hidden, triggered programmatically | Pre-clearance, API calls, headless |

## Quick Start

### Implicit Rendering (HTML-based)
```html
<!-- 1. Add script -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- 2. Add widget to form -->
<form action="/submit" method="POST">
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
  <button type="submit">Submit</button>
</form>
```

### Explicit Rendering (JavaScript-based)
```html
<div id="turnstile-container"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>
<script>
window.turnstile.render('#turnstile-container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => console.log('Token:', token)
});
</script>
```

### Server Validation (Required)
```javascript
// Cloudflare Workers
export default {
  async fetch(request) {
    const formData = await request.formData();
    const token = formData.get('cf-turnstile-response');
    
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP')
      })
    });
    
    const validation = await result.json();
    if (!validation.success) {
      return new Response('Invalid CAPTCHA', { status: 400 });
    }
    // Process form...
  }
}
```

## Testing Keys

**Critical for development/testing:**

| Type | Key | Behavior |
|------|-----|----------|
| **Site Key (Always Passes)** | `1x00000000000000000000AA` | Widget succeeds, token validates |
| **Site Key (Always Blocks)** | `2x00000000000000000000AB` | Widget fails visibly |
| **Site Key (Force Challenge)** | `3x00000000000000000000FF` | Always shows interactive challenge |
| **Secret Key (Testing)** | `1x0000000000000000000000000000000AA` | Validates test tokens |

**Note:** Test keys work on `localhost` and any domain. Do NOT use in production.

## Key Constraints

- **Token expiry:** 5 minutes after generation
- **Single-use:** Each token can only be validated once
- **Server validation required:** Client-side checks are insufficient

## Reading Order

1. **[configuration.md](configuration.md)** - Setup, widget options, script loading
2. **[api.md](api.md)** - JavaScript API, siteverify endpoints, TypeScript types
3. **[patterns.md](patterns.md)** - Form integration, framework examples, validation patterns
4. **[gotchas.md](gotchas.md)** - Common errors, debugging, limitations

## See Also

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
