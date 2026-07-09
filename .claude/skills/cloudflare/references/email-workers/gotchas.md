# Email Workers Gotchas

## Critical Issues

### ReadableStream Single-Use

```typescript
// ❌ WRONG: Stream consumed twice
const email = await PostalMime.parse(await new Response(message.raw).arrayBuffer());
const rawText = await new Response(message.raw).text(); // EMPTY!

// ✅ CORRECT: Buffer first
const buffer = await new Response(message.raw).arrayBuffer();
const email = await PostalMime.parse(buffer);
const rawText = new TextDecoder().decode(buffer);
```

### ctx.waitUntil() Errors Silent

```typescript
// ❌ Errors dropped silently
ctx.waitUntil(fetch(webhookUrl, { method: 'POST', body: data }));

// ✅ Catch and log
ctx.waitUntil(
  fetch(webhookUrl, { method: 'POST', body: data })
    .catch(err => env.ERROR_LOG.put(`error:${Date.now()}`, err.message))
);
```

## Security

### Envelope vs Header From (Spoofing)

```typescript
const envelopeFrom = message.from;               // SMTP MAIL FROM (trusted)
const headerFrom = (await PostalMime.parse(buffer)).from?.address; // (untrusted)
// Use envelope for security decisions
```

### Input Validation

```typescript
if (message.rawSize > 5_000_000) { message.setReject('Too large'); return; }
if ((message.headers.get('Subject') || '').length > 1000) {
  message.setReject('Invalid subject'); return;
}
```

### DMARC for Replies

Replies fail silently without DMARC. Verify: `dig TXT _dmarc.example.com`

## Parsing

### Address Parsing

```typescript
const email = await PostalMime.parse(buffer);
const fromAddress = email.from?.address || 'unknown';
const toAddresses = Array.isArray(email.to) ? email.to.map(t => t.address) : [email.to?.address];
```

### Character Encoding

Let postal-mime handle decoding - `email.subject`, `email.text`, `email.html` are UTF-8.

## API Behavior

### setReject() vs throw

```typescript
// setReject() for SMTP rejection
if (blockList.includes(message.from)) { message.setReject('Blocked'); return; }

// throw for worker errors
if (!env.KV) throw new Error('KV not configured');
```

### forward() Only X-* Headers

```typescript
headers.set('X-Processed-By', 'worker');  // ✅ Works
headers.set('Subject', 'Modified');        // ❌ Dropped
```

### Reply Requires Verified Domain

```typescript
// Use same domain as receiving address
const receivingDomain = message.to.split('@')[1];
await message.reply(new EmailMessage(`noreply@${receivingDomain}`, message.from, rawMime));
```

## Performance

### CPU Limit

```typescript
// Skip parsing large emails
if (message.rawSize > 5_000_000) {
  await message.forward('inbox@example.com');
  return;
}
```

Monitor: `npx wrangler tail`

## Limits

| Limit | Value |
|-------|-------|
| Max message size | 25 MiB |
| Max rules/zone | 200 |
| CPU time (free/paid) | 10ms / 30s default, 5min max |
| Reply References | 100 |

## Common Errors

| Error | Fix |
|-------|-----|
| "Address not verified" | Add in Email Routing dashboard |
| "Exceeded CPU time" | Use `ctx.waitUntil()` or upgrade |
| "Stream is locked" | Buffer `message.raw` first |
| Silent reply failure | Check DMARC records |
