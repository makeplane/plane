# Wrangler Programmatic API

Node.js APIs for testing and development.

## startWorker (Testing)

Starts Worker with real local bindings for integration tests. Stable API (replaces `unstable_startWorker`).

```typescript
import { startWorker } from "wrangler";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

describe("worker", () => {
  let worker;
  
  before(async () => {
    worker = await startWorker({
      config: "wrangler.jsonc",
      environment: "development"
    });
  });
  
  after(async () => {
    await worker.dispose();
  });
  
  it("responds with 200", async () => {
    const response = await worker.fetch("http://example.com");
    assert.strictEqual(response.status, 200);
  });
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `config` | `string` | Path to wrangler.jsonc |
| `environment` | `string` | Environment name from config |
| `persist` | `boolean \| { path: string }` | Enable persistent state |
| `bundle` | `boolean` | Enable bundling (default: true) |
| `remote` | `false \| true \| "minimal"` | Remote mode: `false` (local), `true` (full remote), `"minimal"` (remote bindings only) |

### Remote Mode

```typescript
// Local mode (default) - fast, simulated
const worker = await startWorker({ config: "wrangler.jsonc" });

// Full remote mode - production-like, slower
const worker = await startWorker({ 
  config: "wrangler.jsonc",
  remote: true 
});

// Minimal remote mode - remote bindings, local Worker
const worker = await startWorker({ 
  config: "wrangler.jsonc",
  remote: "minimal"
});
```

## getPlatformProxy

Emulate bindings in Node.js without starting Worker.

```typescript
import { getPlatformProxy } from "wrangler";

const { env, dispose, caches } = await getPlatformProxy<Env>({
  configPath: "wrangler.jsonc",
  environment: "production",
  persist: { path: ".wrangler/state" }
});

// Use bindings
const value = await env.MY_KV.get("key");
await env.DB.prepare("SELECT * FROM users").all();
await env.ASSETS.put("file.txt", "content");

// Platform APIs
await caches.default.put("https://example.com", new Response("cached"));

await dispose();
```

Use for unit tests (test functions, not full Worker) or scripts that need bindings.

## Type Generation

Generate types from config: `wrangler types` → creates `worker-configuration.d.ts`

## Event System

Listen to Worker lifecycle events for advanced workflows.

```typescript
import { startWorker } from "wrangler";

const worker = await startWorker({
  config: "wrangler.jsonc",
  bundle: true
});

// Bundle events
worker.on("bundleStart", (details) => {
  console.log("Bundling started:", details.config);
});

worker.on("bundleComplete", (details) => {
  console.log("Bundle ready:", details.duration);
});

// Reconfiguration events
worker.on("reloadStart", () => {
  console.log("Worker reloading...");
});

worker.on("reloadComplete", () => {
  console.log("Worker reloaded");
});

await worker.dispose();
```

### Dynamic Reconfiguration

```typescript
import { startWorker } from "wrangler";

const worker = await startWorker({ config: "wrangler.jsonc" });

// Replace entire config
await worker.setConfig({
  config: "wrangler.staging.jsonc",
  environment: "staging"
});

// Patch specific fields
await worker.patchConfig({
  vars: { DEBUG: "true" }
});

await worker.dispose();
```

## unstable_dev (Deprecated)

Use `startWorker` instead.

## Multi-Worker Registry

Test multiple Workers with service bindings.

```typescript
import { startWorker } from "wrangler";

const auth = await startWorker({ config: "./auth/wrangler.jsonc" });
const api = await startWorker({
  config: "./api/wrangler.jsonc",
  bindings: { AUTH: auth }  // Service binding
});

const response = await api.fetch("http://example.com/api/login");
// API Worker calls AUTH Worker via env.AUTH.fetch()

await api.dispose();
await auth.dispose();
```

## Best Practices

- Use `startWorker` for integration tests (tests full Worker)
- Use `getPlatformProxy` for unit tests (tests individual functions)
- Use `remote: true` when debugging production-specific issues
- Use `remote: "minimal"` for faster tests with real bindings
- Enable `persist: true` for debugging (state survives runs)
- Run `wrangler types` after config changes
- Always `dispose()` to prevent resource leaks
- Listen to bundle events for build monitoring
- Use multi-worker registry for testing service bindings

## See Also

- [README.md](./README.md) - CLI commands
- [configuration.md](./configuration.md) - Config
- [patterns.md](./patterns.md) - Testing patterns
