# Miniflare

Local simulator for Cloudflare Workers development/testing. Runs Workers in workerd sandbox implementing runtime APIs - no internet required.

## Features

- Full-featured: KV, Durable Objects, R2, D1, WebSockets, Queues
- Fully-local: test without internet, instant reload
- TypeScript-native: detailed logging, source maps
- Advanced testing: dispatch events without HTTP, simulate Worker connections

## When to Use

**Decision tree for testing Workers:**

```
Need to test Workers?
│
├─ Unit tests for business logic only?
│  └─ getPlatformProxy (Vitest/Jest) → [patterns.md](./patterns.md#getplatformproxy)
│     Fast, no HTTP, direct binding access
│
├─ Integration tests with full runtime?
│  ├─ Single Worker?
│  │  └─ Miniflare API → [Quick Start](#quick-start)
│  │     Full control, programmatic access
│  │
│  ├─ Multiple Workers + service bindings?
│  │  └─ Miniflare workers array → [configuration.md](./configuration.md#multiple-workers)
│  │     Shared storage, inter-worker calls
│  │
│  └─ Vitest test runner integration?
│     └─ vitest-pool-workers → [patterns.md](./patterns.md#vitest-pool-workers)
│        Full Workers env in Vitest
│
└─ Local dev server?
   └─ wrangler dev (not Miniflare)
      Hot reload, automatic config
```

**Use Miniflare for:**
- Integration tests with full Worker runtime
- Testing bindings/storage locally
- Multiple Workers with service bindings
- Programmatic event dispatch (fetch, queue, scheduled)

**Use getPlatformProxy for:**
- Fast unit tests of business logic
- Testing without HTTP overhead
- Vitest/Jest environments

**Use Wrangler for:**
- Local development workflow
- Production deployments

## Setup

```bash
npm i -D miniflare
```

Requires ES modules in `package.json`:
```json
{"type": "module"}
```

## Quick Start

```js
import { Miniflare } from "miniflare";

const mf = new Miniflare({
  modules: true,
  script: `
    export default {
      async fetch(request, env, ctx) {
        return new Response("Hello Miniflare!");
      }
    }
  `,
});

const res = await mf.dispatchFetch("http://localhost:8787/");
console.log(await res.text()); // Hello Miniflare!
await mf.dispose();
```

## Reading Order

**New to Miniflare?** Start here:
1. [Quick Start](#quick-start) - Running in 2 minutes
2. [When to Use](#when-to-use) - Choose your testing approach
3. [patterns.md](./patterns.md) - Testing patterns (getPlatformProxy, Vitest, node:test)
4. [configuration.md](./configuration.md) - Configure bindings, storage, multiple workers

**Troubleshooting:**
- [gotchas.md](./gotchas.md) - Common errors and debugging

**API reference:**
- [api.md](./api.md) - Complete method reference

## See Also
- [wrangler](../wrangler/) - CLI tool that embeds Miniflare for `wrangler dev`
- [workerd](../workerd/) - Runtime that powers Miniflare
- [workers](../workers/) - Workers runtime API documentation
