# Configuration

## Script Loading

```js
// Inline
new Miniflare({ modules: true, script: `export default { ... }` });

// File-based
new Miniflare({ scriptPath: "worker.js" });

// Multi-module
new Miniflare({
  scriptPath: "src/index.js",
  modules: true,
  modulesRules: [
    { type: "ESModule", include: ["**/*.js"] },
    { type: "Text", include: ["**/*.txt"] },
  ],
});
```

## Compatibility

```js
new Miniflare({
  compatibilityDate: "2026-01-01", // Use recent date for latest features
  compatibilityFlags: [
    "nodejs_compat",        // Node.js APIs (process, Buffer, etc)
    "streams_enable_constructors", // Stream constructors
  ],
  upstream: "https://example.com", // Fallback for unhandled requests
});
```

**Critical:** Use `compatibilityDate: "2026-01-01"` or latest to match production runtime. Old dates limit available APIs.

## HTTP Server & Request.cf

```js
new Miniflare({
  port: 8787,              // Default: 8787
  host: "127.0.0.1",
  https: true,             // Self-signed cert
  liveReload: true,        // Auto-reload HTML
  
  cf: true,                // Fetch live Request.cf data (cached)
  // cf: "./cf.json",      // Or load from file
  // cf: { colo: "DFW" },  // Or inline mock
});
```

**Note:** For tests, use `dispatchFetch()` (no port conflicts).

## Storage Bindings

```js
new Miniflare({
  // KV
  kvNamespaces: ["TEST_NAMESPACE", "CACHE"],
  kvPersist: "./kv-data", // Optional: persist to disk
  
  // R2
  r2Buckets: ["BUCKET", "IMAGES"],
  r2Persist: "./r2-data",
  
  // Durable Objects
  modules: true,
  durableObjects: {
    COUNTER: "Counter", // className
    API_OBJECT: { className: "ApiObject", scriptName: "api-worker" },
  },
  durableObjectsPersist: "./do-data",
  
  // D1
  d1Databases: ["DB"],
  d1Persist: "./d1-data",
  
  // Cache
  cache: true, // Default
  cachePersist: "./cache-data",
});
```

## Bindings

```js
new Miniflare({
  // Environment variables
  bindings: {
    SECRET_KEY: "my-secret-value",
    API_URL: "https://api.example.com",
    DEBUG: true,
  },
  
  // Other bindings
  wasmBindings: { ADD_MODULE: "./add.wasm" },
  textBlobBindings: { TEXT: "./data.txt" },
  queueProducers: ["QUEUE"],
});
```

## Multiple Workers

```js
new Miniflare({
  workers: [
    {
      name: "main",
      kvNamespaces: { DATA: "shared" },
      serviceBindings: { API: "api-worker" },
      script: `export default { ... }`,
    },
    {
      name: "api-worker",
      kvNamespaces: { DATA: "shared" }, // Shared storage
      script: `export default { ... }`,
    },
  ],
});
```

**With routing:**
```js
workers: [
  { name: "api", scriptPath: "./api.js", routes: ["api.example.com/*"] },
  { name: "web", scriptPath: "./web.js", routes: ["example.com/*"] },
],
```

## Logging & Performance

```js
import { Log, LogLevel } from "miniflare";

new Miniflare({
  log: new Log(LogLevel.DEBUG), // DEBUG | INFO | WARN | ERROR | NONE
  scriptTimeout: 30000,         // CPU limit (ms)
  workersConcurrencyLimit: 10,  // Max concurrent workers
});
```

## Workers Sites

```js
new Miniflare({
  sitePath: "./public",
  siteInclude: ["**/*.html", "**/*.css"],
  siteExclude: ["**/*.map"],
});
```

## From wrangler.toml

Miniflare doesn't auto-read `wrangler.toml`:

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2026-01-01"
[[kv_namespaces]]
binding = "KV"
```

```js
// Miniflare equivalent
new Miniflare({
  scriptPath: "src/index.ts",
  compatibilityDate: "2026-01-01",
  kvNamespaces: ["KV"],
});
```
