# Email Workers Configuration

## wrangler.jsonc

```jsonc
{
  "name": "email-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-27",
  "send_email": [
    { "name": "EMAIL" },                                    // Unrestricted
    { "name": "EMAIL_LOGS", "destination_address": "logs@example.com" },  // Single dest
    { "name": "EMAIL_TEAM", "allowed_destination_addresses": ["a@ex.com", "b@ex.com"] },
    { "name": "EMAIL_NOREPLY", "allowed_sender_addresses": ["noreply@ex.com"] }
  ],
  "kv_namespaces": [{ "binding": "ARCHIVE", "id": "xxx" }],
  "r2_buckets": [{ "binding": "ATTACHMENTS", "bucket_name": "email-attachments" }],
  "vars": { "WEBHOOK_URL": "https://hooks.example.com" }
}
```

## TypeScript Types

```typescript
interface Env {
  EMAIL: SendEmail;
  ARCHIVE: KVNamespace;
  ATTACHMENTS: R2Bucket;
  WEBHOOK_URL: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {}
};
```

## Dependencies

```bash
npm install postal-mime mimetext
npm install -D @cloudflare/workers-types wrangler typescript
```

Use postal-mime v2.x, mimetext v3.x.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ES2022", "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "bundler", "strict": true
  }
}
```

## Local Development

```bash
npx wrangler dev

# Test receiving
curl --request POST 'http://localhost:8787/cdn-cgi/handler/email' \
  --url-query 'from=sender@example.com' --url-query 'to=recipient@example.com' \
  --header 'Content-Type: text/plain' --data-raw 'Subject: Test\n\nHello'
```

Sent emails write to local `.eml` files.

## Deployment Checklist

- [ ] Enable Email Routing in dashboard
- [ ] Verify destination addresses
- [ ] Configure DMARC/SPF/DKIM for sending
- [ ] Create KV/R2 resources if needed
- [ ] Update wrangler.jsonc with production IDs

```bash
npx wrangler deploy
npx wrangler deployments list
```

## Dashboard Setup

1. **Email Routing:** Domain → Email → Enable Email Routing
2. **Verify addresses:** Email → Destination addresses → Add & verify
3. **Bind Worker:** Email → Email Workers → Create route → Select pattern & Worker
4. **DMARC:** Add TXT `_dmarc.domain.com`: `v=DMARC1; p=quarantine;`

## Secrets

```bash
npx wrangler secret put API_KEY
# Access: env.API_KEY
```

## Monitoring

```bash
npx wrangler tail
npx wrangler tail --status error
npx wrangler tail --format json
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Binding not found" | Check `send_email` name matches code |
| "Invalid destination" | Verify in Email Routing dashboard |
| Type errors | Install `@cloudflare/workers-types` |
