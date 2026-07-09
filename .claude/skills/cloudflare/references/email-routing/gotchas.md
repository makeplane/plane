# Gotchas & Troubleshooting

## Critical Pitfalls

### Stream Consumption (MOST COMMON)

**Problem:** "stream already consumed" or worker hangs

**Cause:** `message.raw` is `ReadableStream` - consume once only

**Solution:**
```typescript
// ❌ WRONG
const email1 = await parser.parse(await message.raw.arrayBuffer());
const email2 = await parser.parse(await message.raw.arrayBuffer()); // FAILS

// ✅ CORRECT
const raw = await message.raw.arrayBuffer();
const email = await parser.parse(raw);
```

Consume `message.raw` immediately before any async operations.

### Destination Verification

**Problem:** Emails not forwarding

**Cause:** Destination unverified

**Solution:** Add destination, check inbox for verification email, click link. Verify status: `GET /zones/{id}/email/routing/addresses`

### Mail Authentication

**Problem:** Legitimate emails rejected

**Cause:** Missing SPF/DKIM/DMARC on sender domain

**Solution:** Configure sender DNS:
```dns
example.com. IN TXT "v=spf1 include:_spf.example.com ~all"
selector._domainkey.example.com. IN TXT "v=DKIM1; k=rsa; p=..."
_dmarc.example.com. IN TXT "v=DMARC1; p=quarantine"
```

### Envelope vs Header

**Problem:** Filtering on wrong address

**Solution:**
```typescript
// Routing/auth: envelope
if (message.from === "trusted@example.com") { }

// Display: headers
const display = message.headers.get("from");
```

### SendEmail Limits

| Issue | Limit | Solution |
|-------|-------|----------|
| From domain | Must own | Use Email Routing domain |
| Volume | ~100/min Free | Upgrade or throttle |
| Attachments | Not supported | Link to R2 |
| Type | Transactional | No bulk |

## Common Errors

### CPU Time Exceeded

**Cause:** Heavy parsing, large emails

**Solution:**
```typescript
const size = parseInt(message.headers.get("content-length") || "0") / 1024 / 1024;
if (size > 20) {
  message.setReject("Too large");
  return;
}

ctx.waitUntil(expensiveWork());
await message.forward("dest@example.com");
```

### Rule Not Triggering

**Causes:** Priority conflict, matcher error, catch-all override

**Solution:** Check priority (lower=first), verify exact match, confirm destination verified

### Undefined Property

**Cause:** Missing header

**Solution:**
```typescript
// ❌ WRONG
const subj = message.headers.get("subject").toLowerCase();

// ✅ CORRECT
const subj = message.headers.get("subject")?.toLowerCase() || "";
```

## Limits

| Resource | Free | Paid |
|----------|------|------|
| Email size | 25 MB | 25 MB |
| Rules | 200 | 200 |
| Destinations | 200 | 200 |
| CPU time | 10ms | 30s (default), 5min (max) |
| SendEmail | ~100/min | Higher |

## Debugging

### Local

```bash
npx wrangler dev

curl -X POST 'http://localhost:8787/__email' \
  --header 'content-type: message/rfc822' \
  --data 'From: test@example.com
To: you@yourdomain.com
Subject: Test

Body'
```

### Production

```bash
npx wrangler tail
```

### Pattern

```typescript
export default {
  async email(message, env, ctx) {
    try {
      console.log("From:", message.from);
      await process(message, env);
    } catch (err) {
      console.error(err);
      message.setReject(err.message);
    }
  }
} satisfies ExportedHandler;
```

## Auth Troubleshooting

### Check Status

```typescript
const auth = message.headers.get("authentication-results") || "";
console.log({
  spf: auth.includes("spf=pass"),
  dkim: auth.includes("dkim=pass"),
  dmarc: auth.includes("dmarc=pass")
});

if (!auth.includes("pass")) {
  message.setReject("Failed auth");
  return;
}
```

### SPF Issues

**Causes:** Forwarding breaks SPF, too many lookups (>10), missing includes

**Solution:**
```dns
; ✅ Good
example.com. IN TXT "v=spf1 include:_spf.google.com ~all"

; ❌ Bad - too many
example.com. IN TXT "v=spf1 include:a.com include:b.com ... ~all"
```

### DMARC Alignment

**Cause:** From domain must match SPF/DKIM domain

## Best Practices

1. Consume `message.raw` immediately
2. Verify destinations
3. Handle missing headers (`?.`)
4. Use envelope for routing
5. Check spam scores
6. Test locally first
7. Use `ctx.waitUntil` for background work
8. Size-check early
