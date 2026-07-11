## Best Practices

### 1. Use Selective Worker-First Routing

Instead of `run_worker_first = true`, use array patterns:

```jsonc
{
  "assets": {
    "run_worker_first": [
      "/api/*",           // API routes
      "/admin/*",         // Admin area
      "!/admin/assets/*"  // Except admin assets
    ]
  }
}
```

**Benefits:**
- Reduces Worker invocations
- Lowers costs
- Improves asset delivery performance

### 2. Leverage Navigation Request Optimization

For SPAs, use `compatibility_date = "2025-04-01"` or later:

```jsonc
{
  "compatibility_date": "2025-04-01",
  "assets": {
    "not_found_handling": "single-page-application"
  }
}
```

Navigation requests skip Worker invocation, reducing costs.

### 3. Type Safety with Bindings

Always type your environment:

```typescript
interface Env {
  ASSETS: Fetcher;
}
```

## Common Errors

### "Asset not found"

**Cause:** Asset not in assets directory, wrong path, or assets not deployed  
**Solution:** Verify asset exists, check path case-sensitivity, redeploy if needed

### "Worker not invoked for asset"

**Cause:** Asset served directly, `run_worker_first` not configured  
**Solution:** Configure `run_worker_first` patterns to include asset routes (see configuration.md:66-106)

### "429 Too Many Requests on free tier"

**Cause:** `run_worker_first` patterns invoke Worker for many requests, hitting free tier limits (100k req/day)  
**Solution:** Use more selective patterns with negative exclusions, or upgrade to paid plan

### "Smart Placement increases latency"

**Cause:** `run_worker_first=true` + Smart Placement routes all requests through single smart-placed location  
**Solution:** Use selective patterns (array syntax) or disable Smart Placement for asset-heavy apps

### "CF-Cache-Status header unreliable"

**Cause:** Header is probabilistically added for privacy reasons  
**Solution:** Don't rely on `CF-Cache-Status` for critical routing logic. Use other signals (ETag, age).

### "JWT expired during deployment"

**Cause:** Large asset deployments exceed JWT token lifetime  
**Solution:** Update to Wrangler 4.34.0+ (automatic token refresh), or reduce asset count

### "Cannot use 'assets' with 'site'"

**Cause:** Legacy `site` config conflicts with new `assets` config  
**Solution:** Migrate from `site` to `assets` (see configuration.md). Remove `site` key from wrangler.jsonc.

### "Assets not updating after deployment"

**Cause:** Browser or CDN cache serving old assets  
**Solution:** 
- Hard refresh browser (Cmd+Shift+R / Ctrl+F5)
- Use cache-busting (hashed filenames)
- Verify deployment completed: `wrangler tail`

## Limits

| Resource/Limit | Free | Paid | Notes |
|----------------|------|------|-------|
| Max asset size | 25 MiB | 25 MiB | Per file |
| Total assets | 20,000 | **100,000** | Requires Wrangler 4.34.0+ (Sep 2025) |
| Worker invocations | 100k/day | 10M/month | Optimize with `run_worker_first` patterns |
| Asset storage | Unlimited | Unlimited | Included |

### Version Requirements

| Feature | Minimum Wrangler Version |
|---------|--------------------------|
| 100k file limit (paid) | 4.34.0 |
| Vite plugin | 4.0.0 + @cloudflare/vite-plugin 1.0.0 |
| Navigation optimization | 4.0.0 + compatibility_date: "2025-04-01" |

## Performance Tips

### 1. Use Hashed Filenames

Enable long-term caching with content-hashed filenames:

```
app.a3b2c1d4.js
styles.e5f6g7h8.css
```

Most bundlers (Vite, Webpack, Parcel) do this automatically.

### 2. Minimize Worker Invocations

Serve assets directly when possible:

```jsonc
{
  "assets": {
    // Only invoke Worker for dynamic routes
    "run_worker_first": ["/api/*", "/auth/*"]
  }
}
```

### 3. Leverage Browser Cache

Set appropriate `Cache-Control` headers:

```typescript
// Versioned assets
'Cache-Control': 'public, max-age=31536000, immutable'

// HTML (revalidate often)
'Cache-Control': 'public, max-age=0, must-revalidate'
```

See patterns.md:169-189 for implementation.

### 4. Use .assetsignore

Reduce upload time by excluding unnecessary files:

```
*.map
*.md
.DS_Store
node_modules/
```

See configuration.md:107-126 for details.
