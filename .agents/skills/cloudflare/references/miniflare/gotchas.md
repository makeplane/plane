# Gotchas & Troubleshooting

## Miniflare Limitations

**Not supported:**
- Analytics Engine (use mocks)
- Cloudflare Images/Stream
- Browser Rendering API
- Tail Workers
- Workers for Platforms (partial support)

**Behavior differences from production:**
- Runs workerd locally, not Cloudflare edge
- Storage is local (filesystem/memory), not distributed
- `Request.cf` is cached/mocked, not real edge data
- Performance differs from edge
- Caching implementation may vary slightly

## Common Errors

### "Cannot find module"
**Cause:** Module path wrong or `modulesRules` not configured  
**Solution:**
```js
new Miniflare({
  modules: true,
  modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
});
```

### "Data not persisting"
**Cause:** Persist paths are files, not directories  
**Solution:**
```js
kvPersist: "./data/kv",  // Directory, not file
```

### "Cannot run TypeScript"
**Cause:** Miniflare doesn't transpile TypeScript  
**Solution:** Build first with esbuild/tsc, then run compiled JS

### "`request.cf` is undefined"
**Cause:** CF data not configured  
**Solution:**
```js
new Miniflare({ cf: true }); // Or cf: "./cf.json"
```

### "EADDRINUSE" port conflict
**Cause:** Multiple instances using same port  
**Solution:** Use `dispatchFetch()` (no HTTP server) or `port: 0` for auto-assign

### "Durable Object not found"
**Cause:** Class export doesn't match config name  
**Solution:**
```js
export class Counter {} // Must match
new Miniflare({ durableObjects: { COUNTER: "Counter" } });
```

## Debugging

**Enable verbose logging:**
```js
import { Log, LogLevel } from "miniflare";
new Miniflare({ log: new Log(LogLevel.DEBUG) });
```

**Chrome DevTools:**
```js
const url = await mf.getInspectorURL();
console.log(`DevTools: ${url}`); // Open in Chrome
```

**Inspect bindings:**
```js
const env = await mf.getBindings();
console.log(Object.keys(env));
```

**Verify storage:**
```js
const ns = await mf.getKVNamespace("TEST");
const { keys } = await ns.list();
```

## Best Practices

**✓ Do:**
- Use `dispatchFetch()` for tests (no HTTP server)
- In-memory storage for CI (omit persist options)
- New instances per test for isolation
- Type-safe bindings with interfaces
- `await mf.dispose()` in cleanup

**✗ Avoid:**
- HTTP server in tests
- Shared instances without cleanup
- Old compatibility dates (use 2026+)

## Migration Guides

### From Miniflare 2.x to 3+

Breaking changes in v3+:

| v2 | v3+ |
|----|-----|
| `getBindings()` sync | `getBindings()` returns Promise |
| `ready` is void | `ready` returns `Promise<URL>` |
| service-worker-mock | Built on workerd |
| Different options | Restructured constructor |

**Example migration:**
```js
// v2
const bindings = mf.getBindings();
mf.ready; // void

// v3+
const bindings = await mf.getBindings();
const url = await mf.ready; // Promise<URL>
```

### From unstable_dev to Miniflare

```js
// Old (deprecated)
import { unstable_dev } from "wrangler";
const worker = await unstable_dev("src/index.ts");

// New
import { Miniflare } from "miniflare";
const mf = new Miniflare({ scriptPath: "src/index.ts" });
```

### From Wrangler Dev

Miniflare doesn't auto-read `wrangler.toml`:

```js
// Translate manually:
new Miniflare({
  scriptPath: "dist/worker.js",
  compatibilityDate: "2026-01-01",
  kvNamespaces: ["KV"],
  bindings: { API_KEY: process.env.API_KEY },
});
```

## Resource Limits

| Limit | Value | Notes |
|-------|-------|-------|
| CPU time | 30s default | Configurable via `scriptTimeout` |
| Storage | Filesystem | Performance varies by disk |
| Memory | System dependent | No artificial limits |
| Request.cf | Cached/mocked | Not live edge data |

See [patterns.md](./patterns.md) for testing examples.
