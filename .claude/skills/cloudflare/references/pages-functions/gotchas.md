# Gotchas & Debugging

## Error Diagnosis

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| **Function not invoking** | Wrong `/functions` location, wrong extension, or `_routes.json` excludes path | Check `pages_build_output_dir`, use `.js`/`.ts`, verify `_routes.json` |
| **`ctx.env.BINDING` undefined** | Binding not configured or name mismatch | Add to `wrangler.jsonc`, verify exact name (case-sensitive), redeploy |
| **TypeScript errors on `ctx.env`** | Missing type definition | Run `wrangler types` or define `interface Env {}` |
| **Middleware not running** | Wrong filename/location or missing `ctx.next()` | Name exactly `_middleware.js`, export `onRequest`, call `ctx.next()` |
| **Secrets missing in production** | `.dev.vars` not deployed | `.dev.vars` is local only - set production secrets via dashboard or `wrangler secret put` |
| **Type mismatch on binding** | Wrong interface type | See [api.md](./api.md) bindings table for correct types |
| **"KV key not found" but exists** | Key in wrong namespace or env | Verify namespace binding, check preview vs production env |
| **Function times out** | Synchronous wait or missing `await` | All I/O must be async/await, use `ctx.waitUntil()` for background tasks |

## Common Errors

### TypeScript type errors

**Problem:** `ctx.env.MY_BINDING` shows type error  
**Cause:** No type definition for `Env`  
**Solution:** Run `npx wrangler types` or manually define:
```typescript
interface Env { MY_BINDING: KVNamespace; }
export const onRequest: PagesFunction<Env> = async (ctx) => { /* ... */ };
```

### Secrets not available in production

**Problem:** `ctx.env.SECRET_KEY` is undefined in production  
**Cause:** `.dev.vars` is local-only, not deployed  
**Solution:** Set production secrets:
```bash
echo "value" | npx wrangler pages secret put SECRET_KEY --project-name=my-app
```

## Debugging

```typescript
// Console logging
export async function onRequest(ctx) {
  console.log('Request:', ctx.request.method, ctx.request.url);
  const res = await ctx.next();
  console.log('Status:', res.status);
  return res;
}
```

```bash
# Stream real-time logs
npx wrangler pages deployment tail
npx wrangler pages deployment tail --status error
```

```jsonc
// Source maps (wrangler.jsonc)
{ "upload_source_maps": true }
```

## Limits

| Resource | Free | Paid |
|----------|------|------|
| CPU time | 10ms | 30s (default), 5min (max) |
| Memory | 128 MB | 128 MB |
| Script size | 10 MB compressed | 10 MB compressed |
| Env vars | 5 KB per var, 64 max | 5 KB per var, 64 max |
| Requests | 100k/day | Unlimited ($0.50/million) |

## Best Practices

**Performance:** Minimize deps (cold start), use KV for cache/D1 for relational/R2 for large files, set `Cache-Control` headers, batch DB ops, handle errors gracefully

**Security:** Never commit secrets (use `.dev.vars` + gitignore), validate input, sanitize before DB, implement auth middleware, set CORS headers, rate limit per-IP

## Migration

**Workers → Pages Functions:**
- `export default { fetch(req, env) {} }` → `export function onRequest(ctx) { const { request, env } = ctx; }`
- Use `_worker.js` for complex routing: `env.ASSETS.fetch(request)` for static files

**Other platforms → Pages:**
- File-based routing: `/functions/api/users.js` → `/api/users`
- Dynamic routes: `[param]` not `:param`
- Replace Node.js deps with Workers APIs or add `nodejs_compat` flag

## Resources

- [Official Docs](https://developers.cloudflare.com/pages/functions/)
- [Workers APIs](https://developers.cloudflare.com/workers/runtime-apis/)
- [Examples](https://github.com/cloudflare/pages-example-projects)
- [Discord](https://discord.gg/cloudflaredev)

**See also:** [configuration.md](./configuration.md) for TypeScript setup | [patterns.md](./patterns.md) for middleware/auth | [api.md](./api.md) for bindings
