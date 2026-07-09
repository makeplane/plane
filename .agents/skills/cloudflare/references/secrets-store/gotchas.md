# Gotchas

## Common Errors

### ".get() Throws on Error"

**Cause:** Assuming `.get()` returns null on failure instead of throwing  
**Solution:** Always wrap `.get()` calls in try/catch blocks to handle errors gracefully

```typescript
try {
  const key = await env.API_KEY.get();
} catch (error) {
  return new Response("Configuration error", { status: 500 });
}
```

### "Logging Secret Values"

**Cause:** Accidentally logging secret values in console or error messages  
**Solution:** Only log metadata (e.g., "Retrieved API_KEY") never the actual secret value

### "Module-Level Secret Access"

**Cause:** Attempting to access secrets during module initialization before env is available  
**Solution:** Cache secrets in request scope only, not at module level

### "Secret not found in store"

**Cause:** Secret name doesn't exist, case mismatch, missing workers scope, or incorrect store_id  
**Solution:** Verify secret exists with `wrangler secrets-store secret list <store-id> --remote`, check name matches exactly (case-sensitive), ensure secret has `workers` scope, and verify correct store_id

### "Scope Mismatch"

**Cause:** Secret exists but missing `workers` scope (only has `ai-gateway` scope)  
**Solution:** Update secret scopes: `wrangler secrets-store secret update <store-id> --name SECRET --scopes workers --remote` or add via Dashboard

### "JSON Parsing Failure"

**Cause:** Storing invalid JSON in secret, then failing to parse during runtime  
**Solution:** Validate JSON before storing:

```bash
# Validate before storing
echo '{"key":"value"}' | jq . && \
  echo '{"key":"value"}' | wrangler secrets-store secret create <store-id> \
    --name CONFIG --scopes workers --remote
```

Runtime parsing with error handling:

```typescript
try {
  const configStr = await env.CONFIG.get();
  const config = JSON.parse(configStr);
} catch (error) {
  console.error("Invalid config JSON:", error);
  return new Response("Invalid configuration", { status: 500 });
}
```

### "Cannot access secret in local dev"

**Cause:** Attempting to access production secrets in local development environment  
**Solution:** Create local-only secrets (without `--remote` flag) for development: `wrangler secrets-store secret create <store-id> --name API_KEY --scopes workers`

### "Property 'get' does not exist"

**Cause:** Missing TypeScript type definition for secret binding  
**Solution:** Define interface with get method: `interface Env { API_KEY: { get(): Promise<string> }; }`

### "Binding already exists"

**Cause:** Duplicate binding in dashboard or conflict between wrangler.jsonc and dashboard  
**Solution:** Remove duplicate from dashboard Settings → Bindings, check for conflicts, or delete old Worker secret with `wrangler secret delete API_KEY`

### "Account secret quota exceeded"

**Cause:** Account has reached 100 secret limit (beta)  
**Solution:** Check quota with `wrangler secrets-store quota --remote`, delete unused secrets, consolidate duplicates, or contact Cloudflare for increase

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max secrets per account | 100 | Beta limit |
| Max stores per account | 1 | Beta limit |
| Max secret size | 1024 bytes | Per secret |
| Local secrets | Don't count toward limit | Only production secrets count |
| Scopes available | `workers`, `ai-gateway` | Must have correct scope for access |
| Scope | Account-level | Can be reused across multiple Workers |
| Access method | `await env.BINDING.get()` | Async only, throws on error |
| Management | Centralized | Via secrets-store commands |
| Local dev | Separate local secrets | Use without `--remote` flag |
| Regional availability | Global except China Network | Unavailable in China Network |

See: [configuration.md](./configuration.md), [api.md](./api.md), [patterns.md](./patterns.md)
