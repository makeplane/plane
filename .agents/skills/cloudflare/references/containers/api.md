## Container Class API

```typescript
import { Container } from "@cloudflare/containers";

export class MyContainer extends Container {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "30m";
  enableInternet = true;
  pingEndpoint = "/health";
  envVars = {};
  entrypoint = [];

  onStart() { /* container started */ }
  onStop() { /* container stopping */ }
  onError(error: Error) { /* container error */ }
  onActivityExpired(): boolean { /* timeout, return true to stay alive */ }
  async alarm() { /* scheduled task */ }
}
```

## Routing

**getByName(id)** - Named instance for session affinity, per-user state
**getRandom()** - Random instance for load balancing stateless services

```typescript
const container = env.MY_CONTAINER.getByName("user-123");
const container = env.MY_CONTAINER.getRandom();
```

## Startup Methods

### start() - Basic start (8s timeout)

```typescript
await container.start();
await container.start({ envVars: { KEY: "value" } });
```

Returns when **process starts**, NOT when ports ready. Use for fire-and-forget.

### startAndWaitForPorts() - Recommended (20s timeout)

```typescript
await container.startAndWaitForPorts();  // Uses requiredPorts
await container.startAndWaitForPorts({ ports: [8080, 9090] });
await container.startAndWaitForPorts({ 
  ports: [8080],
  startOptions: { envVars: { KEY: "value" } }
});
```

Returns when **ports listening**. Use before HTTP/TCP requests.

**Port resolution:** explicit ports → requiredPorts → defaultPort → port 33

### waitForPort() - Wait for specific port

```typescript
await container.waitForPort(8080);
await container.waitForPort(8080, { timeout: 30000 });
```

## Communication

### fetch() - HTTP with WebSocket support

```typescript
// ✅ Supports WebSocket upgrades
const response = await container.fetch(request);
const response = await container.fetch("http://container/api", {
  method: "POST",
  body: JSON.stringify({ data: "value" })
});
```

**Use for:** All HTTP, especially WebSocket.

### containerFetch() - HTTP only (no WebSocket)

```typescript
// ❌ No WebSocket support
const response = await container.containerFetch(request);
```

**⚠️ Critical:** Use `fetch()` for WebSocket, not `containerFetch()`.

### TCP Connections

```typescript
const port = this.ctx.container.getTcpPort(8080);
const conn = port.connect();
await conn.opened;

if (request.body) await request.body.pipeTo(conn.writable);
return new Response(conn.readable);
```

### switchPort() - Change default port

```typescript
this.switchPort(8081);  // Subsequent fetch() uses this port
```

## Lifecycle Hooks

### onStart()

Called when container process starts (ports may not be ready). Runs in `blockConcurrencyWhile` - no concurrent requests.

```typescript
onStart() {
  console.log("Container starting");
}
```

### onStop()

Called when SIGTERM received. 15 minutes until SIGKILL. Use for graceful shutdown.

```typescript
onStop() {
  // Save state, close connections, flush logs
}
```

### onError()

Called when container crashes or fails to start.

```typescript
onError(error: Error) {
  console.error("Container error:", error);
}
```

### onActivityExpired()

Called when `sleepAfter` timeout reached. Return `true` to stay alive, `false` to stop.

```typescript
onActivityExpired(): boolean {
  if (this.hasActiveConnections()) return true;  // Keep alive
  return false;  // OK to stop
}
```

## Scheduling

```typescript
export class ScheduledContainer extends Container {
  async fetch(request: Request) {
    await this.schedule(Date.now() + 60000);  // 1 minute
    await this.schedule("2026-01-28T00:00:00Z");  // ISO string
    return new Response("Scheduled");
  }

  async alarm() {
    // Called when schedule fires (SQLite-backed, survives restarts)
  }
}
```

**⚠️ Don't override `alarm()` directly when using `schedule()` helper.**

## State Inspection

### External state check

```typescript
const state = await container.getState();
// state.status: "starting" | "running" | "stopping" | "stopped"
```

### Internal state check

```typescript
export class MyContainer extends Container {
  async fetch(request: Request) {
    if (this.ctx.container.running) { ... }
  }
}
```

**⚠️ Use `getState()` for external checks, `ctx.container.running` for internal.**
