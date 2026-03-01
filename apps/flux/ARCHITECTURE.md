# Flux Service Architecture

This document explains the architecture and Effect patterns used in the flux service.

## Overview

The flux service provides two main functionalities:

1. **WebSocket Flux Server** - Enables horizontal scaling through Redis pub/sub. When a client broadcasts a message, it's published to Redis and all server instances relay it to their connected clients.

2. **AMQP Event Consumer** - Listens to events from RabbitMQ's `plane.event_stream` exchange for processing backend events.

## Tech Stack

- **Effect**: Functional effect system for TypeScript
- **ws**: WebSocket server library
- **ioredis**: Redis client for pub/sub
- **amqplib**: RabbitMQ/AMQP client for event consumption

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── consumer.ts           # AMQP consumer entry point
├── server.ts             # WebSocket + HTTP server logic
├── handlers/
│   ├── index.ts          # Handler exports
│   ├── message.ts        # WebSocket message handlers
│   └── health.ts         # Health check endpoint handlers
├── schema/
│   ├── index.ts          # Schema exports
│   ├── messages.ts       # WebSocket message validation schemas
│   └── errors.ts         # Error type definitions
└── services/
    ├── index.ts          # Service exports
    ├── config.ts         # Environment configuration
    ├── redis.ts          # Redis client and pub/sub service
    └── amqp.ts           # AMQP connection and consumer service
```

## Entry Points

### Main Server (`index.ts`)

The main entry point starts the WebSocket flux server with HTTP health endpoints.

```bash
pnpm dev        # Development with hot reload
pnpm start      # Production
```

### AMQP Consumer (`consumer.ts`)

Separate entry point for consuming events from RabbitMQ.

```bash
pnpm dev:consumer    # Development with hot reload
```

## HTTP Endpoints

The server exposes HTTP endpoints for health checks and Kubernetes probes:

| Endpoint           | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `GET /flux/health` | Full health status with connections and Redis status |
| `GET /flux/ready`  | Readiness probe - checks Redis connection            |
| `GET /flux/live`   | Liveness probe - always returns alive                |
| `GET /flux/`       | Service info (name, version, base path)              |

All endpoints are also available without the `/flux` prefix for direct access.

## Effect Patterns Explained

### 1. Services and Layers

Effect uses a dependency injection pattern through Services and Layers. Instead of importing singletons or passing dependencies manually, we declare what a piece of code needs and Effect wires it together.

**Defining a Service (`services/config.ts`):**

```typescript
export class AppConfig extends Effect.Service<AppConfig>()("AppConfig", {
  effect: Effect.gen(function* () {
    const port = yield* Config.number("PORT").pipe(Config.withDefault(3004));
    const redisUrl = yield* Config.redacted("REDIS_URL");
    const amqpUrl = yield* Config.string("AMQP_URL");
    // ...
    return { port, redisUrl, amqpUrl /* ... */ };
  }),
}) {}
```

- `Effect.Service` creates a tagged service that can be required by other effects
- `Effect.gen` is a generator-based syntax for sequencing effects (like async/await)
- `yield*` extracts values from effects (similar to `await`)
- `Config.number("PORT")` reads from environment variables with type safety

**Using a Service (`server.ts`):**

```typescript
const config = yield * AppConfig; // Dependency injection
console.log(config.port);
```

**Providing Layers (`index.ts`):**

```typescript
const MainLive = Layer.mergeAll(AppConfigLive, RedisPubSubLive, FluxServerLive);

const program = Effect.gen(function* () {
  const server = yield* FluxServer;
  yield* server.start;
});

program.pipe(Effect.provide(MainLive));
```

Layers are "recipes" for building services. `Effect.provide` connects them.

### 2. Resource Management

Effect handles resource cleanup automatically through `Scope`.

**In `services/redis.ts`:**

```typescript
yield *
  Effect.addFinalizer(() =>
    Effect.promise(() => client.quit()).pipe(Effect.tap(() => Effect.log("Redis client disconnected")))
  );
```

When the program shuts down (SIGTERM, SIGINT, or scope closes), finalizers run in reverse order. No manual cleanup code needed.

**In `server.ts`:**

```typescript
yield *
  Effect.addFinalizer(() =>
    Effect.async<void>((resume) => {
      wss.close(() => {
        httpServer.close(() => resume(Effect.void));
      });
    })
  );
```

### 3. Handler Organization

Handlers are organized by concern in the `handlers/` directory:

**Message Handlers (`handlers/message.ts`):**

```typescript
export const handleMessage = (ctx: HandlerContext, clientId: ClientId, message: IncomingMessage): Effect.Effect<void> =>
  Effect.gen(function* () {
    switch (message.type) {
      case "subscribe":
        yield* handleSubscribe(ctx, clientId, message.channel);
        break;
      // ...
    }
  });
```

**Health Handlers (`handlers/health.ts`):**

```typescript
export const handleHealthRequest = <T, U>(
  ctx: HealthContext<T, U>,
  _req: IncomingMessage,
  res: ServerResponse
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const health = yield* getHealthStatus(ctx);
    res.writeHead(health.status === "ok" ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health));
  });
```

### 4. Schema Validation

Effect Schema provides runtime validation with TypeScript types derived automatically.

**In `schema/messages.ts`:**

```typescript
export const SubscribeMessage = Schema.Struct({
  type: Schema.Literal("subscribe"),
  channel: Schema.String,
});

export const IncomingMessage = Schema.Union(SubscribeMessage, UnsubscribeMessage, BroadcastMessage, PingMessage);

export type IncomingMessage = typeof IncomingMessage.Type;
```

**Usage:**

```typescript
const message = yield * decodeIncoming(parsed); // Validates and narrows type

switch (message.type) {
  case "subscribe": // TypeScript knows message.channel exists
  // ...
}
```

### 5. AMQP Consumer Pattern

The AMQP service manages connection lifecycle with automatic reconnection:

**In `services/amqp.ts`:**

```typescript
export class AmqpService extends Effect.Service<AmqpService>()("AmqpService", {
  scoped: makeAmqpService,
  dependencies: [AppConfig.Default],
}) {}
```

**Consumer usage (`consumer.ts`):**

```typescript
const processMessage = Effect.fn("processMessage")(
  (message: AmqpMessage): Effect.Effect<void> =>
    Effect.gen(function* () {
      const event = yield* parseEventMessage(message.content);
      yield* Effect.logInfo("CONSUMER: Received event", event);
      yield* message.ack;
    })
);

const main = Effect.gen(function* () {
  const amqp = yield* AmqpService;
  const consumerFiber = yield* amqp.subscribe(processMessage);
  yield* Fiber.join(consumerFiber);
});
```

### 6. Immutable Data Structures

Effect provides persistent (immutable) data structures optimized for functional programming.

**HashMap and HashSet (`handlers/message.ts`):**

```typescript
const clients = yield * Ref.make<HashMap.HashMap<ClientId, ClientState>>(HashMap.empty());

// Update immutably
yield * Ref.update(clients, (map) => HashMap.set(map, clientId, { ws, channels: HashSet.empty() }));

// Read
const clientMap = yield * Ref.get(clients);
const client = HashMap.get(clientMap, clientId); // Returns Option<ClientState>
```

- `Ref` is a mutable reference to an immutable value (like React's useState)
- `HashMap.get` returns `Option` (Some/None) instead of undefined
- Updates create new instances, no mutation

### 7. Concurrent Effect Execution

**Running effects in parallel:**

```typescript
yield *
  Effect.all(
    channels.map((channel) => unsubscribeClient(clientId, channel)),
    { concurrency: "unbounded" }
  );
```

**Forking background fibers:**

```typescript
yield *
  Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        const msg = yield* messages.take;
        yield* broadcastToChannel(msg.channel, msg.payload);
      })
    )
  );
```

### 8. Runtime for Callbacks

WebSocket and HTTP events are callback-based. We capture the Effect runtime to run effects from callbacks:

```typescript
const runtime = yield * Effect.runtime<never>();

const runFork = <A, E>(effect: Effect.Effect<A, E, never>) => {
  Runtime.runFork(runtime)(effect);
};

const runPromise = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => {
  return Runtime.runPromise(runtime)(effect);
};

// In callback
wss.on("connection", (ws) => {
  runFork(handleConnection(ws)); // Run effect from callback
});

// For HTTP handlers that need to complete
const handleHttpRequest = (req, res) => {
  runPromise(handleHealthRequest(ctx, req, res));
};
```

## Data Flow

### WebSocket Flux Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client                                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ WebSocket (/flux/ws)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FluxServer                                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │   clients   │  │channelSubscribers│  │   handleMessage   │   │
│  │  Ref<Map>   │  │    Ref<Map>      │  │                   │   │
│  └─────────────┘  └──────────────────┘  └─────────┬─────────┘   │
│                                                    │             │
│                                         ┌──────────▼──────────┐  │
│                                         │  subscribe/unsub/  │  │
│                                         │     broadcast      │  │
│                                         └──────────┬─────────┘  │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RedisPubSub                                │
│  ┌──────────────┐              ┌──────────────┐                  │
│  │  publisher   │──publish────▶│    Redis     │                  │
│  └──────────────┘              └──────┬───────┘                  │
│  ┌──────────────┐                     │                          │
│  │  subscriber  │◀────subscribe───────┘                          │
│  └──────┬───────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │  messageHub  │──────▶ broadcast to local clients              │
│  │   PubSub     │                                                │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### AMQP Consumer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Django API                                 │
│                    (Event Publisher)                             │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Publish to Exchange
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RabbitMQ                                   │
│              plane.event_stream (fanout exchange)                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Consume from Queue
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AMQP Consumer                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ AmqpService  │  │  processMessage  │  │   EventMessage    │  │
│  │  (scoped)    │──▶│    handler       │──▶│    Schema        │  │
│  └──────────────┘  └──────────────────┘  └───────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Auto-reconnect with exponential backoff (max 5 retries) │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Why Effect?

Effect adds complexity but provides:

1. **Dependency Injection**: Services are explicit, testable, and swappable
2. **Resource Safety**: Automatic cleanup prevents leaks
3. **Type-Safe Errors**: Errors are tracked in the type system
4. **Structured Concurrency**: Fibers are managed, interruption is handled
5. **Observability**: Built-in logging, tracing, metrics

For a simple service, this may be overkill. The choice was made for consistency with the `live` app which uses Effect extensively.

## Testing

To test services in isolation, provide mock layers:

```typescript
const MockRedis = Layer.succeed(RedisPubSub, {
  publish: () => Effect.succeed(1),
  subscribe: () => Effect.void,
  // ...
});

const testProgram = myEffect.pipe(Effect.provide(MockRedis));
```
