# Stream Configuration

Setup, environment variables, and wrangler configuration.

## Installation

```bash
# Official Cloudflare SDK (Node.js, Workers, Pages)
npm install cloudflare

# React component library
npm install @cloudflare/stream-react

# TUS resumable uploads (large files)
npm install tus-js-client
```

## Environment Variables

```bash
# Required
CF_ACCOUNT_ID=your-account-id
CF_API_TOKEN=your-api-token

# For signed URLs (high volume)
STREAM_KEY_ID=your-key-id
STREAM_JWK=base64-encoded-jwk

# For webhooks
WEBHOOK_SECRET=your-webhook-secret

# Customer subdomain (from dashboard)
STREAM_CUSTOMER_CODE=your-customer-code
```

## Wrangler Configuration

```jsonc
{
  "name": "stream-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01", // Use current date for new projects
  "vars": {
    "CF_ACCOUNT_ID": "your-account-id"
  }
  // Store secrets: wrangler secret put CF_API_TOKEN
  // wrangler secret put STREAM_KEY_ID
  // wrangler secret put STREAM_JWK
  // wrangler secret put WEBHOOK_SECRET
}
```

## Signing Keys (High Volume)

Create once for self-signing tokens (thousands of daily users).

**Create key**
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/keys" \
  -H "Authorization: Bearer <API_TOKEN>"

# Save `id` and `jwk` (base64) from response
```

**Store in secrets**
```bash
wrangler secret put STREAM_KEY_ID
wrangler secret put STREAM_JWK
```

## Webhooks

**Setup webhook URL**
```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/webhook" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notificationUrl": "https://your-worker.workers.dev/webhook"}'

# Save the returned `secret` for signature verification
```

**Store secret**
```bash
wrangler secret put WEBHOOK_SECRET
```

## Direct Upload / Live / Watermark Config

```typescript
// Direct upload
const uploadConfig = {
  maxDurationSeconds: 3600,
  expiry: new Date(Date.now() + 3600000).toISOString(),
  requireSignedURLs: true,
  allowedOrigins: ['https://yourdomain.com'],
  meta: { creator: 'user-123' }
};

// Live input
const liveConfig = {
  recording: { mode: 'automatic', timeoutSeconds: 30 },
  deleteRecordingAfterDays: 30
};

// Watermark
const watermark = {
  name: 'Logo', opacity: 0.7, padding: 20,
  position: 'lowerRight', scale: 0.15
};
```

## Access Rules & Player Config

```typescript
// Access rules: allow US/CA, block CN/RU, or IP allowlist
const geoRestrict = [
  { type: 'ip.geoip.country', action: 'allow', country: ['US', 'CA'] },
  { type: 'any', action: 'block' }
];

// Player params for iframe
const playerParams = new URLSearchParams({
  autoplay: 'true', muted: 'true', preload: 'auto', defaultTextTrack: 'en'
});
```

## In This Reference

- [README.md](./README.md) - Overview and quick start
- [api.md](./api.md) - On-demand video APIs
- [api-live.md](./api-live.md) - Live streaming APIs
- [patterns.md](./patterns.md) - Full-stack flows, best practices
- [gotchas.md](./gotchas.md) - Error codes, troubleshooting

## See Also

- [wrangler](../wrangler/) - Wrangler CLI and configuration
- [workers](../workers/) - Deploy Stream APIs in Workers
