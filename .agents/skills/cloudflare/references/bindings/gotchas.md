# Binding Gotchas and Troubleshooting

## Critical: Global Scope Mutation

### ❌ THE #1 GOTCHA: Caching env in Global Scope

```typescript
// ❌ DANGEROUS - env cached at deploy time
const apiKey = env.API_KEY;  // ERROR: env not available in global scope

export default {
  async fetch(request: Request, env: Env) {
    // Uses undefined or stale value!
  }
}
```

**Why it breaks:**
- `env` not available in global scope
- If using workarounds, secrets may not update without redeployment
- Leads to "Cannot read property 'X' of undefined" errors

**✅ Always access env per-request:**
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const apiKey = env.API_KEY;  // Fresh every request
  }
}
```

## Common Errors

### "env.MY_KV is undefined"

**Cause:** Name mismatch or not configured  
**Solution:** Check wrangler.jsonc (case-sensitive), run `npx wrangler types`, verify `npx wrangler kv namespace list`

### "Property 'MY_KV' does not exist on type 'Env'"

**Cause:** Types not generated  
**Solution:** `npx wrangler types`

### "preview_id is required for --remote"

**Cause:** Missing preview binding  
**Solution:** Add `"preview_id": "dev-id"` or use `npx wrangler dev` (local mode)

### "Secret updated but Worker still uses old value"

**Cause:** Cached in global scope or not redeployed  
**Solution:** Avoid global caching, redeploy after secret change

### "KV get() returns null for existing key"

**Cause:** Eventual consistency (60s), wrong namespace, wrong environment  
**Solution:**
```bash
# Check key exists
npx wrangler kv key get --binding=MY_KV "your-key"

# Verify namespace ID
npx wrangler kv namespace list

# Check environment
npx wrangler deployments list
```

### "D1 database not found"

**Solution:** `npx wrangler d1 list`, verify ID in wrangler.jsonc

### "Service binding returns 'No such service'"

**Cause:** Target Worker not deployed, name mismatch, environment mismatch  
**Solution:**
```bash
# List deployed Workers
npx wrangler deployments list --name=target-worker

# Check service binding config
cat wrangler.jsonc | grep -A2 services

# Deploy target first
cd ../target-worker && npx wrangler deploy
```

### "Rate limit exceeded" on KV writes

**Cause:** >1 write/second per key  
**Solution:** Use different keys, Durable Objects, or Queues

## Type Safety Gotchas

### Missing @cloudflare/workers-types

**Error:** `Cannot find name 'Request'`  
**Solution:** `npm install -D @cloudflare/workers-types`, add to tsconfig.json `"types"`

### Binding Type Mismatches

```typescript
// ❌ Wrong - KV returns string | null
const value: string = await env.MY_KV.get('key');

// ✅ Handle null
const value = await env.MY_KV.get('key');
if (!value) return new Response('Not found', { status: 404 });
```

## Environment Gotchas

### Wrong Environment Deployed

**Solution:** Check `npx wrangler deployments list`, use `--env` flag

### Secrets Not Per-Environment

**Solution:** Set per environment: `npx wrangler secret put API_KEY --env staging`

## Development Gotchas

**wrangler dev vs deploy:**
- dev: Uses `preview_id` or local bindings, secrets not available
- deploy: Uses production `id`, secrets available

**Access secrets in dev:** `npx wrangler dev --remote`  
**Persist local data:** `npx wrangler dev --persist`

## Performance Gotchas

### Sequential Binding Calls

```typescript
// ❌ Slow
const user = await env.DB.prepare('...').first();
const config = await env.MY_KV.get('config');

// ✅ Parallel
const [user, config] = await Promise.all([
  env.DB.prepare('...').first(),
  env.MY_KV.get('config')
]);
```

## Security Gotchas

**❌ Secrets in logs:** `console.log('Key:', env.API_KEY)` - visible in dashboard  
**✅** `console.log('Key:', env.API_KEY ? '***' : 'missing')`

**❌ Exposing env:** `return Response.json(env)` - exposes all bindings  
**✅** Never return env object in responses

## Limits Reference

| Resource | Limit | Impact | Plan |
|----------|-------|--------|------|
| **Bindings per Worker** | 64 total | All binding types combined | All |
| **Environment variables** | 64 max, 5KB each | Per Worker | All |
| **Secret size** | 1KB | Per secret | All |
| **KV key size** | 512 bytes | UTF-8 encoded | All |
| **KV value size** | 25 MB | Per value | All |
| **KV writes per key** | 1/second | Per key; exceeding = 429 error | All |
| **KV list() results** | 1000 keys | Per call; use cursor for more | All |
| **KV operations** | 1000 reads/day | Free tier only | Free |
| **R2 object size** | 5 TB | Per object | All |
| **R2 operations** | 1M Class A/month free | Writes | All |
| **D1 database size** | 10 GB | Per database | All |
| **D1 rows per query** | 100,000 | Result set limit | All |
| **D1 databases** | 10 | Free tier | Free |
| **Queue batch size** | 100 messages | Per consumer batch | All |
| **Queue message size** | 128 KB | Per message | All |
| **Service binding calls** | Unlimited | Counts toward CPU time | All |
| **Durable Objects** | 1M requests/month free | First 1M | Free |

## Debugging Tips

```bash
# Check configuration
npx wrangler deploy --dry-run       # Validate config without deploying
npx wrangler kv namespace list      # List KV namespaces
npx wrangler secret list            # List secrets (not values)
npx wrangler deployments list       # Recent deployments

# Inspect bindings
npx wrangler kv key list --binding=MY_KV
npx wrangler kv key get --binding=MY_KV "key-name"
npx wrangler r2 object get my-bucket/file.txt
npx wrangler d1 execute my-db --command="SELECT * FROM sqlite_master"

# Test locally
npx wrangler dev                  # Local mode
npx wrangler dev --remote         # Production bindings
npx wrangler dev --persist        # Persist data across restarts

# Verify types
npx wrangler types
cat .wrangler/types/runtime.d.ts | grep "interface Env"

# Debug specific binding issues
npx wrangler tail                 # Stream logs in real-time
npx wrangler tail --format=pretty # Formatted logs
```

## See Also

- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Wrangler Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
