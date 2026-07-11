# Testing Patterns

## Choosing a Testing Approach

| Approach | Use Case | Speed | Setup | Runtime |
|----------|----------|-------|-------|---------|
| **getPlatformProxy** | Unit tests, logic testing | Fast | Low | Miniflare |
| **Miniflare API** | Integration tests, full control | Medium | Medium | Miniflare |
| **vitest-pool-workers** | Vitest runner integration | Medium | Medium | workerd |

**Quick guide:**
- Unit tests → getPlatformProxy
- Integration tests → Miniflare API
- Vitest workflows → vitest-pool-workers

## getPlatformProxy

Lightweight unit testing - provides bindings without full Worker runtime.

```js
// vitest.config.js
export default { test: { environment: "node" } };
```

```js
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Business logic", () => {
  it("processes data with KV", async () => {
    await env.KV.put("test", "value");
    expect(await env.KV.get("test")).toBe("value");
  });
});
```

**Pros:** Fast, simple  
**Cons:** No full runtime, can't test fetch handler

## vitest-pool-workers

Full Workers runtime in Vitest. Reads `wrangler.toml`.

```bash
npm i -D @cloudflare/vitest-pool-workers
```

```js
// vitest.config.js
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: { workers: { wrangler: { configPath: "./wrangler.toml" } } },
  },
});
```

```js
import { env, SELF } from "cloudflare:test";
import { it, expect } from "vitest";

it("handles fetch", async () => {
  const res = await SELF.fetch("http://example.com/");
  expect(res.status).toBe(200);
});
```

**Pros:** Full runtime, uses wrangler.toml  
**Cons:** Requires Wrangler config

## Miniflare API (node:test)

```js
import assert from "node:assert";
import test, { after, before } from "node:test";
import { Miniflare } from "miniflare";

let mf;
before(() => {
  mf = new Miniflare({ scriptPath: "src/index.js", kvNamespaces: ["TEST_KV"] });
});

test("fetch", async () => {
  const res = await mf.dispatchFetch("http://localhost/");
  assert.strictEqual(await res.text(), "Hello");
});

after(() => mf.dispose());
```

## Testing Durable Objects & Events

```js
// Durable Objects
const ns = await mf.getDurableObjectNamespace("COUNTER");
const stub = ns.get(ns.idFromName("test-counter"));
await stub.fetch("http://localhost/increment");

// Direct storage
const storage = await mf.getDurableObjectStorage(ns.idFromName("test-counter"));
const count = await storage.get("count");

// Queue
const worker = await mf.getWorker();
await worker.queue("my-queue", [
  { id: "msg1", timestamp: new Date(), body: { userId: 123 }, attempts: 1 },
]);

// Scheduled
await worker.scheduled({ cron: "0 0 * * *" });
```

## Test Isolation & Mocking

```js
// Per-test isolation
beforeEach(() => { mf = new Miniflare({ kvNamespaces: ["TEST"] }); });
afterEach(() => mf.dispose());

// Mock external APIs
new Miniflare({
  workers: [
    { name: "main", serviceBindings: { API: "mock-api" }, script: `...` },
    { name: "mock-api", script: `export default { async fetch() { return Response.json({mock: true}); } }` },
  ],
});
```

## Type Safety

```ts
import type { KVNamespace } from "@cloudflare/workers-types";

interface Env {
  KV: KVNamespace;
  API_KEY: string;
}

const env = await mf.getBindings<Env>();
await env.KV.put("key", "value"); // Typed!

export default {
  async fetch(req: Request, env: Env) {
    return new Response(await env.KV.get("key"));
  }
} satisfies ExportedHandler<Env>;
```

## WebSocket Testing

```js
const res = await mf.dispatchFetch("http://localhost/ws", {
  headers: { Upgrade: "websocket" },
});
assert.strictEqual(res.status, 101);
```

## Migration from unstable_dev

```js
// Old (deprecated)
import { unstable_dev } from "wrangler";
const worker = await unstable_dev("src/index.ts");

// New
import { Miniflare } from "miniflare";
const mf = new Miniflare({ scriptPath: "src/index.ts" });
```

## CI/CD Tips

```js
// In-memory storage (faster)
new Miniflare({ kvNamespaces: ["TEST"] }); // No persist = in-memory

// Use dispatchFetch (no port conflicts)
await mf.dispatchFetch("http://localhost/");
```

See [gotchas.md](./gotchas.md) for troubleshooting.
