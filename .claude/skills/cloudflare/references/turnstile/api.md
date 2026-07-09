# API Reference

## Client-Side JavaScript API

The Turnstile JavaScript API is available at `window.turnstile` after loading the script.

### `turnstile.render(container, options)`

Renders a Turnstile widget into a container element.

**Parameters:**
- `container` (string | HTMLElement): CSS selector or DOM element
- `options` (TurnstileOptions): Configuration object (see [configuration.md](configuration.md))

**Returns:** `string` - Widget ID for use with other API methods

**Example:**
```javascript
const widgetId = window.turnstile.render('#my-container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => console.log('Success:', token),
  'error-callback': (code) => console.error('Error:', code)
});
```

### `turnstile.reset(widgetId)`

Resets a widget (clears token, resets challenge state). Useful when form validation fails.

**Parameters:**
- `widgetId` (string): Widget ID from `render()`, or container element

**Returns:** `void`

**Example:**
```javascript
// Reset on form error
if (!validateForm()) {
  window.turnstile.reset(widgetId);
}
```

### `turnstile.remove(widgetId)`

Removes a widget from the DOM completely.

**Parameters:**
- `widgetId` (string): Widget ID from `render()`

**Returns:** `void`

**Example:**
```javascript
// Cleanup on navigation
window.turnstile.remove(widgetId);
```

### `turnstile.getResponse(widgetId)`

Gets the current token from a widget (if challenge completed).

**Parameters:**
- `widgetId` (string): Widget ID from `render()`, or container element

**Returns:** `string | undefined` - Token string, or undefined if not ready

**Example:**
```javascript
const token = window.turnstile.getResponse(widgetId);
if (token) {
  submitForm(token);
}
```

### `turnstile.isExpired(widgetId)`

Checks if a widget's token has expired (>5 minutes old).

**Parameters:**
- `widgetId` (string): Widget ID from `render()`

**Returns:** `boolean` - True if expired

**Example:**
```javascript
if (window.turnstile.isExpired(widgetId)) {
  window.turnstile.reset(widgetId);
}
```

## Callback Signatures

```typescript
type TurnstileCallback = (token: string) => void;
type ErrorCallback = (errorCode: string) => void;
type TimeoutCallback = () => void;
type ExpiredCallback = () => void;
type BeforeInteractiveCallback = () => void;
type AfterInteractiveCallback = () => void;
type UnsupportedCallback = () => void;
```

## Siteverify API (Server-Side)

**Endpoint:** `https://challenges.cloudflare.com/turnstile/v0/siteverify`

### Request

**Method:** POST  
**Content-Type:** `application/json` or `application/x-www-form-urlencoded`

```typescript
interface SiteverifyRequest {
  secret: string;    // Your secret key (never expose client-side)
  response: string;  // Token from cf-turnstile-response
  remoteip?: string; // User's IP (optional but recommended)
  idempotency_key?: string; // Unique key for idempotent validation
}
```

**Example:**
```javascript
// Cloudflare Workers
const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: env.TURNSTILE_SECRET,
    response: token,
    remoteip: request.headers.get('CF-Connecting-IP')
  })
});
const data = await result.json();
```

### Response

```typescript
interface SiteverifyResponse {
  success: boolean;           // Validation result
  challenge_ts?: string;      // ISO timestamp of challenge
  hostname?: string;          // Hostname where widget was solved
  'error-codes'?: string[];   // Error codes if success=false
  action?: string;            // Action name from widget config
  cdata?: string;             // Custom data from widget config
}
```

**Example Success:**
```json
{
  "success": true,
  "challenge_ts": "2024-01-15T10:30:00Z",
  "hostname": "example.com",
  "action": "login",
  "cdata": "user123"
}
```

**Example Failure:**
```json
{
  "success": false,
  "error-codes": ["timeout-or-duplicate"]
}
```

## Error Codes

| Code | Cause | Solution |
|------|-------|----------|
| `missing-input-secret` | Secret key not provided | Include `secret` in request |
| `invalid-input-secret` | Secret key is wrong | Check secret key in dashboard |
| `missing-input-response` | Token not provided | Include `response` token |
| `invalid-input-response` | Token is invalid/malformed | Verify token from widget |
| `timeout-or-duplicate` | Token expired (>5min) or reused | Generate new token, validate once |
| `internal-error` | Cloudflare server error | Retry with exponential backoff |
| `bad-request` | Malformed request | Check JSON/form encoding |

## TypeScript Types

```typescript
interface TurnstileOptions {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  'unsupported-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  tabindex?: number;
  'response-field'?: boolean;
  'response-field-name'?: string;
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  language?: string;
  execution?: 'render' | 'execute';
  appearance?: 'always' | 'execute' | 'interaction-only';
  'refresh-expired'?: 'auto' | 'manual' | 'never';
}

interface Turnstile {
  render(container: string | HTMLElement, options: TurnstileOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
  getResponse(widgetId: string): string | undefined;
  isExpired(widgetId: string): boolean;
  execute(container?: string | HTMLElement, options?: TurnstileOptions): void;
}

declare global {
  interface Window {
    turnstile: Turnstile;
    onloadTurnstileCallback?: () => void;
  }
}
```

## Script Loading

```html
<!-- Standard -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- Explicit render mode -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>

<!-- With load callback -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"></script>
<script>
window.onloadTurnstileCallback = () => {
  window.turnstile.render('#container', { sitekey: 'YOUR_SITE_KEY' });
};
</script>
```