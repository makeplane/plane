# Cloudflare Email Routing Skill Reference

## Overview

Cloudflare Email Routing enables custom email addresses for your domain that route to verified destination addresses. It's free, privacy-focused (no storage/access), and includes Email Workers for programmatic email processing.

**Available to all Cloudflare customers using Cloudflare as authoritative nameserver.**

## Quick Start

```typescript
// Basic email handler
export default {
  async email(message, env, ctx) {
    // CRITICAL: Must consume stream before response
    const parser = new PostalMime.default();
    const email = await parser.parse(await message.raw.arrayBuffer());
    
    // Process email
    console.log(`From: ${message.from}, Subject: ${email.subject}`);
    
    // Forward or reject
    await message.forward("verified@destination.com");
  }
} satisfies ExportedHandler<Env>;
```

## Reading Order

**Start here based on your goal:**

1. **New to Email Routing?** → [configuration.md](configuration.md) → [patterns.md](patterns.md)
2. **Adding Workers?** → [api.md](api.md) § Worker Runtime API → [patterns.md](patterns.md)
3. **Sending emails?** → [api.md](api.md) § SendEmail Binding
4. **Managing via API?** → [api.md](api.md) § REST API Operations
5. **Debugging issues?** → [gotchas.md](gotchas.md)

## Decision Tree

```
Need to receive emails?
├─ Simple forwarding only? → Dashboard rules (configuration.md)
├─ Complex logic/filtering? → Email Workers (api.md + patterns.md)
└─ Parse attachments/body? → postal-mime library (patterns.md § Parse Email)

Need to send emails?
├─ From Worker? → SendEmail binding (api.md § SendEmail)
└─ From external app? → Use external SMTP/API service

Having issues?
├─ Email not arriving? → gotchas.md § Mail Authentication
├─ Worker crashing? → gotchas.md § Stream Consumption
└─ Forward failing? → gotchas.md § Destination Verification
```

## Key Concepts

**Routing Rules**: Pattern-based forwarding configured via Dashboard/API. Simple but limited.

**Email Workers**: Custom TypeScript handlers with full email access. Handles complex logic, parsing, storage, rejection.

**SendEmail Binding**: Outbound email API for Workers. Transactional email only (no marketing/bulk).

**ForwardableEmailMessage**: Runtime interface for incoming emails. Provides headers, raw stream, forward/reject methods.

## In This Reference

- **[configuration.md](configuration.md)** - Setup, deployment, wrangler config
- **[api.md](api.md)** - REST API + Worker runtime API + types
- **[patterns.md](patterns.md)** - Common patterns with working examples
- **[gotchas.md](gotchas.md)** - Critical pitfalls, troubleshooting, limits

## Architecture

```
Internet → MX Records → Cloudflare Email Routing
                            ├─ Routing Rules (dashboard)
                            └─ Email Worker (your code)
                                ├─ Forward to destination
                                ├─ Reject with reason
                                ├─ Store in R2/KV/D1
                                └─ Send outbound (SendEmail)
```

## See Also

- [Cloudflare Docs: Email Routing](https://developers.cloudflare.com/email-routing/)
- [Cloudflare Docs: Email Workers](https://developers.cloudflare.com/email-routing/email-workers/)
- [postal-mime npm package](https://www.npmjs.com/package/postal-mime)
