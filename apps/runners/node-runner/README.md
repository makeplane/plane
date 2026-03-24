# Node Runner

Sandboxed execution host for running user-authored JS/TS automation scripts within Plane. It exposes an HTTP API that builds, validates, and executes code in an isolated Node.js `vm` context with strict security controls.

## How It Works

1. **Build** — User code is written to a temp directory, bundled with esbuild into an IIFE, and returned as a string.
2. **Validate** — AST-based security analysis (via acorn) blocks dangerous patterns (`eval`, `require`, `process.exit`, prototype manipulation, infinite loops, etc.), followed by a trial build to catch compilation errors.
3. **Execute** — The bundle runs inside a `vm.createContext` sandbox with a hardened global scope. Only safe standard globals, a domain-restricted `fetch`, an initialized `PlaneClient` instance, environment/execution variables, and a `Functions` library are injected. Execution is subject to a configurable timeout.

## API Endpoints

| Method | Path             | Description                                                     |
| ------ | ---------------- | --------------------------------------------------------------- |
| GET    | `/health`        | Health check — returns `{ status: "ok" }`                       |
| POST   | `/build`         | Bundles code and returns the build artifact + detected function names |
| POST   | `/validate`      | Security validation + trial build; returns `{ valid, errors }`  |
| POST   | `/execute-sync`  | Builds (or accepts a pre-built bundle) and executes code synchronously |

## Project Structure

```
src/
  index.ts              # Entrypoint — starts the Express server
  server.ts             # Express app with route handlers
  env.ts                # Environment variable validation (zod)
  config.ts             # Per-request runner config types
  types.ts              # Shared types (events, execution context, functions)
  code-validator.ts     # AST-based security validation
  npm-installer.ts      # Temp-dir bundling with esbuild
  isolate-executor.ts   # vm sandbox setup and script execution
  ts-parser.ts          # Acorn + TypeScript plugin parser
  tracer.ts             # Datadog APM tracing init
tests/
  code-validator.test.ts
  isolate-executor.test.ts
```

## Environment Variables

| Variable               | Default      | Description                              |
| ---------------------- | ------------ | ---------------------------------------- |
| `PORT`                 | `3000`       | HTTP server port                         |
| `API_BASE_URL`         | *(required)* | Plane API URL passed to `PlaneClient`    |
| `EXECUTION_TIMEOUT_MS` | `10000`      | Max execution time per script (ms)       |
| `INIT_TIMEOUT_MS`      | `5000`       | Max time for script initialization (ms)  |
| `ISOLATE_MEMORY_MB`    | `128`        | Memory limit for the isolate (MB)        |
| `NODE_ENV`             | `production` | Node environment                         |
| `ALLOWED_DOMAINS`      | `[]`          | Allowed domains for `fetch`              |

Copy `.env.example` to `.env` and fill in the required values for local development.

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start in watch mode (port 3300)
pnpm --filter=plane-runner-host dev

# Run tests
pnpm --filter=plane-runner-host test

# Build for production
pnpm --filter=plane-runner-host build
```

## Security Model

User scripts run inside a `vm.createContext` sandbox that **only** exposes:

- Safe JS built-ins (`JSON`, `Math`, `Date`, `Array`, `Map`, `Set`, `Promise`, etc.)
- URL/encoding utilities (`URL`, `URLSearchParams`, `atob`, `btoa`, etc.)
- Timers (`setTimeout`, `setInterval` — string arguments are blocked)
- `console` (proxied to structured logging)
- `fetch` (restricted to explicitly allowed domains)
- `Plane` (pre-initialized `PlaneClient` instance)
- `Functions` (reusable function library built from definitions)
- `ENV` / `variables` (user-defined environment and execution variables)

**Blocked:** `require`, `module`, `eval`, `Function`, `process.*` dangerous methods, `__proto__`/`constructor`/`prototype` access, `with` statements, and obvious infinite loops (`while(true)`, `for(;;)`).
