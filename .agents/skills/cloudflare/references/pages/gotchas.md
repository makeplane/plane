# Gotchas

## Functions Not Running

**Problem**: Function endpoints return 404 or don't execute  
**Causes**: `_routes.json` excludes path; wrong file extension (`.jsx`/`.tsx`); Functions dir not at output root  
**Solution**: Check `_routes.json`, rename to `.ts`/`.js`, verify build output structure

## 404 on Static Assets

**Problem**: Static files not serving  
**Causes**: Build output dir misconfigured; Functions catching requests; Advanced mode missing `env.ASSETS.fetch()`  
**Solution**: Verify output dir, add exclusions to `_routes.json`, call `env.ASSETS.fetch()` in `_worker.js`

## Bindings Not Working

**Problem**: `env.BINDING` undefined or errors  
**Causes**: wrangler.jsonc syntax error; wrong binding IDs; missing `.dev.vars`; out-of-sync types  
**Solution**: Validate config, verify IDs, create `.dev.vars`, run `npx wrangler types`

## Build Failures

**Problem**: Deployment fails during build  
**Causes**: Wrong build command/output dir; Node version incompatibility; missing env vars; 20min timeout; OOM  
**Solution**: Check Dashboard → Deployments → Build log; verify settings; add `.nvmrc`; optimize build

## Middleware Not Running

**Problem**: Middleware doesn't execute  
**Causes**: Wrong filename (not `_middleware.ts`); missing `onRequest` export; didn't call `next()`  
**Solution**: Rename file with underscore prefix; export handler; call `next()` or return Response

## Headers/Redirects Not Working

**Problem**: `_headers` or `_redirects` not applying  
**Causes**: Only work for static assets; Functions override; syntax errors; exceeded limits  
**Solution**: Set headers in Response object for Functions; verify syntax; check limits (100 headers, 2,100 redirects)

## TypeScript Errors

**Problem**: Type errors in Functions code  
**Causes**: Types not generated; Env interface doesn't match wrangler.jsonc  
**Solution**: Run `npx wrangler types --path='./functions/types.d.ts'`; update Env interface

## Local Dev Issues

**Problem**: Dev server errors or bindings don't work  
**Causes**: Port conflict; bindings not passed; local vs HTTPS differences  
**Solution**: Use `--port=3000`; pass bindings via CLI or wrangler.jsonc; account for HTTP/HTTPS differences

## Performance Issues

**Problem**: Slow responses or CPU limit errors  
**Causes**: Functions invoked for static assets; cold starts; 10ms CPU limit (free) / 30s default (paid); large bundle  
**Solution**: Exclude static via `_routes.json`; optimize hot paths; keep bundle < 1MB

## Framework-Specific

### ⚠️ Deprecated Frameworks

**Next.js**: Official adapter (`@cloudflare/next-on-pages`) **deprecated** and unmaintained.
- **Problem**: No updates since 2024; incompatible with Next.js 15+; missing App Router features
- **Cause**: Cloudflare discontinued official support; community fork exists but limited
- **Solutions**:
  1. **Recommended**: Use Vercel (official Next.js host)
  2. **Advanced**: Self-host on Workers using custom adapter (complex, unsupported)
  3. **Migration**: Switch to SvelteKit/Nuxt (similar DX, full Pages support)

**Remix**: Official adapter (`@remix-run/cloudflare-pages`) **deprecated**.
- **Problem**: No maintenance from Remix team; compatibility issues with Remix v2+
- **Cause**: Remix team deprecated all framework adapters
- **Solutions**:
  1. **Recommended**: Migrate to SvelteKit (similar file-based routing, better DX)
  2. **Alternative**: Use Astro (static-first with optional SSR)
  3. **Workaround**: Continue using deprecated adapter (no future support)

### ✅ Supported Frameworks

**SvelteKit**:
- Use `@sveltejs/adapter-cloudflare`
- Access bindings via `platform.env` in server load functions
- Set `platform: 'cloudflare'` in `svelte.config.js`

**Astro**:
- Built-in Cloudflare adapter
- Access bindings via `Astro.locals.runtime.env`

**Nuxt**:
- Set `nitro.preset: 'cloudflare-pages'` in `nuxt.config.ts`
- Access bindings via `event.context.cloudflare.env`

**Qwik, Solid Start**:
- Built-in or official Cloudflare adapters available
- Check respective framework docs for binding access

## Debugging

```typescript
// Log request details
console.log('Request:', { method: request.method, url: request.url });
console.log('Env:', Object.keys(env));
console.log('Params:', params);
```

**View logs**: `npx wrangler pages deployment tail --project-name=my-project`

## Smart Placement Issues

### Increased Cold Start Latency

**Problem**: First requests slower after enabling Smart Placement  
**Cause**: Initial optimization period while system learns traffic patterns  
**Solution**: Expected behavior during first 24-48 hours; monitor latency trends over time

### Inconsistent Response Times

**Problem**: Latency varies significantly across requests during initial deployment  
**Cause**: Smart Placement testing different execution locations to find optimal placement  
**Solution**: Normal during learning phase; stabilizes after traffic patterns emerge (1-2 days)

### No Performance Improvement

**Problem**: Smart Placement enabled but no latency reduction observed  
**Cause**: Traffic evenly distributed globally, or no data locality constraints  
**Solution**: Smart Placement most effective with centralized data (D1/DO) or regional traffic; disable if no benefit

## Remote Bindings Issues

### Accidentally Modified Production Data

**Problem**: Local dev with `--remote` altered production database/KV  
**Cause**: Remote bindings connect directly to production resources; writes are real  
**Solution**: 
- Use `--remote` only for read-heavy debugging
- Create separate preview environments for testing
- Never use `--remote` for write operations during development

### Remote Binding Auth Errors

**Problem**: `npx wrangler pages dev --remote` fails with "Unauthorized" or auth error  
**Cause**: Not logged in, session expired, or insufficient account permissions  
**Solution**: 
1. Run `npx wrangler login` to re-authenticate
2. Verify account has access to project and bindings
3. Check binding IDs match production configuration

### Slow Local Dev with Remote Bindings

**Problem**: Local dev server slow when using `--remote`  
**Cause**: Every request makes network calls to production bindings  
**Solution**: Use local bindings for development; reserve `--remote` for final validation

## Common Errors

### "Module not found"
**Cause**: Dependencies not bundled or build output incorrect  
**Solution**: Check build output directory, ensure dependencies bundled

### "Binding not found"
**Cause**: Binding not configured or types out of sync  
**Solution**: Verify wrangler.jsonc, run `npx wrangler types`

### "Request exceeded CPU limit"
**Cause**: Code execution too slow or heavy compute  
**Solution**: Optimize hot paths, upgrade to Workers Paid

### "Script too large"
**Cause**: Bundle size exceeds limit  
**Solution**: Tree-shake, use dynamic imports, code-split

### "Too many subrequests"
**Cause**: Exceeded 50 subrequest limit  
**Solution**: Batch or reduce fetch calls

### "KV key not found"
**Cause**: Key doesn't exist or wrong namespace  
**Solution**: Check namespace matches environment

### "D1 error"
**Cause**: Wrong database_id or missing migrations  
**Solution**: Verify config, run `wrangler d1 migrations list`

## Limits Reference (Jan 2026)

| Resource | Free | Paid |
|----------|------|------|
| Functions Requests | 100k/day | Unlimited |
| CPU Time | 10ms/req | 30s default, 5min max |
| Memory | 128MB | 128MB |
| Script Size | 1MB | 10MB |
| Subrequests | 50/req | 10,000/req |
| Deployments | 500/month | 5,000/month |

**Tip**: Hitting CPU limit? Optimize hot paths or upgrade to Workers Paid plan.

[Full limits](https://developers.cloudflare.com/pages/platform/limits/)

## Getting Help

1. Check [Pages Docs](https://developers.cloudflare.com/pages/)
2. Search [Discord #functions](https://discord.com/channels/595317990191398933/910978223968518144)
3. Review [Workers Examples](https://developers.cloudflare.com/workers/examples/)
4. Check framework-specific docs/adapters
