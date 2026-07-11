## Routing Patterns

### Session Affinity (Stateful)

```typescript
export class SessionBackend extends Container {
  defaultPort = 3000;
  sleepAfter = "30m";
}

export default {
  async fetch(request: Request, env: Env) {
    const sessionId = request.headers.get("X-Session-ID") || crypto.randomUUID();
    const container = env.SESSION_BACKEND.getByName(sessionId);
    await container.startAndWaitForPorts();
    return container.fetch(request);
  }
};
```

**Use:** User sessions, WebSocket, stateful games, per-user caching.

### Load Balancing (Stateless)

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const container = env.STATELESS_API.getRandom();
    await container.startAndWaitForPorts();
    return container.fetch(request);
  }
};
```

**Use:** Stateless HTTP APIs, CPU-intensive work, read-only queries.

### Singleton Pattern

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const container = env.GLOBAL_SERVICE.getByName("singleton");
    await container.startAndWaitForPorts();
    return container.fetch(request);
  }
};
```

**Use:** Global cache, centralized coordinator, single source of truth.

## WebSocket Forwarding

```typescript
export default {
  async fetch(request: Request, env: Env) {
    if (request.headers.get("Upgrade") === "websocket") {
      const sessionId = request.headers.get("X-Session-ID") || crypto.randomUUID();
      const container = env.WS_BACKEND.getByName(sessionId);
      await container.startAndWaitForPorts();
      
      // ⚠️ MUST use fetch(), not containerFetch()
      return container.fetch(request);
    }
    return new Response("Not a WebSocket request", { status: 400 });
  }
};
```

**⚠️ Critical:** Always use `fetch()` for WebSocket.

## Graceful Shutdown

```typescript
export class GracefulContainer extends Container {
  private connections = new Set<WebSocket>();

  onStop() {
    // SIGTERM received, 15 minutes until SIGKILL
    for (const ws of this.connections) {
      ws.close(1001, "Server shutting down");
    }
    this.ctx.storage.put("shutdown-time", Date.now());
  }

  onActivityExpired(): boolean {
    return this.connections.size > 0;  // Keep alive if connections
  }
}
```

## Concurrent Request Handling

```typescript
export class SafeContainer extends Container {
  private initialized = false;

  async fetch(request: Request) {
    await this.ctx.blockConcurrencyWhile(async () => {
      if (!this.initialized) {
        await this.startAndWaitForPorts();
        this.initialized = true;
      }
    });
    return super.fetch(request);
  }
}
```

**Use:** One-time initialization, preventing concurrent startup.

## Activity Timeout Renewal

```typescript
export class LongRunningContainer extends Container {
  sleepAfter = "5m";

  async processLongJob(data: unknown) {
    const interval = setInterval(() => {
      this.ctx.storage.put("keepalive", Date.now());
    }, 60000);

    try {
      await this.doLongWork(data);
    } finally {
      clearInterval(interval);
    }
  }
}
```

**Use:** Long operations exceeding `sleepAfter`.

## Multiple Port Routing

```typescript
export class MultiPortContainer extends Container {
  requiredPorts = [8080, 8081, 9090];

  async fetch(request: Request) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/grpc")) this.switchPort(8081);
    else if (path.startsWith("/metrics")) this.switchPort(9090);
    return super.fetch(request);
  }
}
```

**Use:** Multi-protocol services (HTTP + gRPC), separate metrics endpoints.

## Workflow Integration

```typescript
import { WorkflowEntrypoint } from "cloudflare:workers";

export class ProcessingWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const container = this.env.PROCESSOR.getByName(event.payload.jobId);
    
    await step.do("start", async () => {
      await container.startAndWaitForPorts();
    });
    
    const result = await step.do("process", async () => {
      return container.fetch("/process", {
        method: "POST",
        body: JSON.stringify(event.payload.data)
      }).then(r => r.json());
    });
    
    return result;
  }
}
```

**Use:** Orchestrating multi-step container operations, durable execution.

## Queue Consumer Integration

```typescript
export default {
  async queue(batch, env) {
    for (const msg of batch.messages) {
      try {
        const container = env.PROCESSOR.getByName(msg.body.jobId);
        await container.startAndWaitForPorts();
        
        const response = await container.fetch("/process", {
          method: "POST",
          body: JSON.stringify(msg.body)
        });
        
        response.ok ? msg.ack() : msg.retry();
      } catch (err) {
        console.error("Queue processing error:", err);
        msg.retry();
      }
    }
  }
};
```

**Use:** Asynchronous job processing, batch operations, event-driven execution.
