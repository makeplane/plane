# Email Workers Patterns

## Parse Email

```typescript
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const buffer = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(buffer);
    console.log(email.from, email.subject, email.text, email.attachments.length);
    await message.forward('inbox@example.com');
  }
};
```

## Filtering

```typescript
// Allowlist from KV
const allowList = await env.ALLOWED_SENDERS.get('list', 'json') || [];
if (!allowList.includes(message.from)) {
  message.setReject('Not allowed');
  return;
}

// Size check (avoid parsing large emails)
if (message.rawSize > 5_000_000) {
  await message.forward('inbox@example.com'); // Forward without parsing
  return;
}
```

## Auto-Reply with Threading

```typescript
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

const msg = createMimeMessage();
msg.setSender({ addr: 'support@example.com' });
msg.setRecipient(message.from);
msg.setSubject(`Re: ${message.headers.get('Subject')}`);
msg.setHeader('In-Reply-To', message.headers.get('Message-ID') || '');
msg.addMessage({ contentType: 'text/plain', data: 'Thank you. We will respond.' });

await message.reply(new EmailMessage('support@example.com', message.from, msg.asRaw()));
```

## Rate-Limited Auto-Reply

```typescript
const rateKey = `rate:${message.from}`;
if (!await env.RATE_LIMIT.get(rateKey)) {
  // Send reply...
  ctx.waitUntil(env.RATE_LIMIT.put(rateKey, '1', { expirationTtl: 3600 }));
}
```

## Subject-Based Routing

```typescript
const subject = (message.headers.get('Subject') || '').toLowerCase();
if (subject.includes('billing')) await message.forward('billing@example.com');
else if (subject.includes('support')) await message.forward('support@example.com');
else await message.forward('general@example.com');
```

## Multi-Tenant Routing

```typescript
// support+tenant123@example.com → tenant123
const tenantId = message.to.split('@')[0].match(/\+(.+)$/)?.[1] || 'default';
const config = await env.TENANT_CONFIG.get(tenantId, 'json');
config?.forwardTo ? await message.forward(config.forwardTo) : message.setReject('Unknown');
```

## Archive & Extract Attachments

```typescript
// Archive to KV
ctx.waitUntil(env.ARCHIVE.put(`email:${Date.now()}`, JSON.stringify({
  from: message.from, subject: email.subject
})));

// Attachments to R2
for (const att of email.attachments) {
  ctx.waitUntil(env.R2.put(`${Date.now()}-${att.filename}`, att.content));
}
```

## Webhook Integration

```typescript
ctx.waitUntil(
  fetch(env.WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ from: message.from, subject: message.headers.get('Subject') })
  }).catch(err => console.error(err))
);
```
