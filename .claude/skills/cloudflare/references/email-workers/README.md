# Cloudflare Email Workers

Process incoming emails programmatically using Cloudflare Workers runtime.

## Overview

Email Workers enable custom email processing logic at the edge. Build spam filters, auto-responders, ticket systems, notification handlers, and more using the same Workers runtime you use for HTTP requests.

**Key capabilities**:
- Process inbound emails with full message access
- Forward to verified destinations
- Send replies with proper threading
- Parse MIME content and attachments
- Integrate with KV, R2, D1, and external APIs

## Quick Start

### Minimal ES Modules Handler

```typescript
export default {
  async email(message, env, ctx) {
    // Reject spam
    if (message.from.includes('spam.com')) {
      message.setReject('Blocked');
      return;
    }
    
    // Forward to inbox
    await message.forward('inbox@example.com');
  }
};
```

### Core Operations

| Operation | Method | Use Case |
|-----------|--------|----------|
| Forward | `message.forward(to, headers?)` | Route to verified destination |
| Reject | `message.setReject(reason)` | Block with SMTP error |
| Reply | `message.reply(emailMessage)` | Auto-respond with threading |
| Parse | postal-mime library | Extract subject, body, attachments |

## Reading Order

For comprehensive understanding, read files in this order:

1. **README.md** (this file) - Overview and quick start
2. **configuration.md** - Setup, deployment, bindings
3. **api.md** - Complete API reference
4. **patterns.md** - Real-world implementation examples
5. **gotchas.md** - Critical pitfalls and debugging

## In This Reference

| File | Description | Key Topics |
|------|-------------|------------|
| [api.md](./api.md) | Complete API reference | ForwardableEmailMessage, SendEmail bindings, reply() method, postal-mime/mimetext APIs |
| [configuration.md](./configuration.md) | Setup and configuration | wrangler.jsonc, bindings, deployment, dependencies |
| [patterns.md](./patterns.md) | Real-world examples | Allowlists from KV, auto-reply with threading, attachment extraction, webhook notifications |
| [gotchas.md](./gotchas.md) | Pitfalls and debugging | Stream consumption, ctx.waitUntil errors, security, limits |

## Architecture

```
Incoming Email → Email Routing → Email Worker
                                    ↓
                              Process + Decide
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
                Forward          Reply          Reject
```

**Event flow**:
1. Email arrives at your domain
2. Email Routing matches route (e.g., `support@example.com`)
3. Bound Email Worker receives `ForwardableEmailMessage`
4. Worker processes and takes action (forward/reply/reject)
5. Email delivered or rejected based on worker logic

## Key Concepts

### Envelope vs Headers

- **Envelope addresses** (`message.from`, `message.to`): SMTP transport addresses (trusted)
- **Header addresses** (parsed from body): Display addresses (can be spoofed)

Use envelope addresses for security decisions.

### Single-Use Streams

`message.raw` is a ReadableStream that can only be read once. Buffer to ArrayBuffer for multiple uses.

```typescript
// Buffer first
const buffer = await new Response(message.raw).arrayBuffer();
const email = await PostalMime.parse(buffer);
```

See [gotchas.md](./gotchas.md#readablestream-can-only-be-consumed-once) for details.

### Verified Destinations

`forward()` only works with addresses verified in the Cloudflare Email Routing dashboard. Add destinations before deployment.

## Use Cases

- **Spam filtering**: Block based on sender, content, or reputation
- **Auto-responders**: Send acknowledgment replies with threading
- **Ticket creation**: Parse emails and create support tickets
- **Email archival**: Store in KV, R2, or D1
- **Notification routing**: Forward to Slack, Discord, or webhooks
- **Attachment processing**: Extract files to R2 storage
- **Multi-tenant routing**: Route based on recipient subdomain
- **Size filtering**: Reject oversized attachments

## Limits

| Limit | Value |
|-------|-------|
| Max message size | 25 MiB |
| Max routing rules | 200 |
| Max destinations | 200 |
| CPU time (free tier) | 10ms |
| CPU time (paid tier) | 30s (default), 5min (max) |

See [gotchas.md](./gotchas.md#limits-reference) for complete limits table.

## Prerequisites

Before deploying Email Workers:

1. **Enable Email Routing** in Cloudflare dashboard for your domain
2. **Verify destination addresses** for forwarding
3. **Configure DMARC/SPF** for sending domains (required for replies)
4. **Set up wrangler.jsonc** with SendEmail binding

See [configuration.md](./configuration.md) for detailed setup.

## Service Worker Syntax (Deprecated)

Modern projects should use ES modules format shown above. Service Worker syntax (`addEventListener('email', ...)`) is deprecated but still supported.

## See Also

- [Email Routing Documentation](https://developers.cloudflare.com/email-routing/)
- [Workers Platform](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [postal-mime on npm](https://www.npmjs.com/package/postal-mime)
- [mimetext on npm](https://www.npmjs.com/package/mimetext)
