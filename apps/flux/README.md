# Flux Service (Fast Live Unified Exchange) RealTime Hub

Flux service for horizontal scaling with Redis pub/sub. Enables real-time event broadcasting across multiple server instances. Also includes an AMQP consumer for processing backend events from RabbitMQ.

## Quick Start

### Prerequisites

- Node.js 22+
- Redis running locally or accessible via URL
- RabbitMQ running locally or accessible via URL (for consumer)
- pnpm 10.24.0+

### Setup

1. Install dependencies:

```bash
pnpm install --filter flux
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379
CHANNEL_PREFIX=flux

# Flux Base Path (for proxy deployment)
FLUX_BASE_PATH=/flux

# AMQP Configuration (for consumer)
AMQP_URL=amqp://localhost:5672
EVENT_STREAM_EXCHANGE=plane.event_stream
PREFETCH_COUNT=10
```

3. Start development server:

```bash
pnpm --filter flux dev
```

4. Start AMQP consumer (optional, separate process):

```bash
pnpm --filter flux dev:consumer
```

### Production

```bash
pnpm --filter flux build
pnpm --filter flux start
```

## Health Endpoints

The flux server exposes HTTP endpoints for health checks and Kubernetes probes:

| Endpoint           | Description                                   |
| ------------------ | --------------------------------------------- |
| `GET /flux/health` | Full health status with connections and Redis |
| `GET /flux/ready`  | Readiness probe - checks Redis connection     |
| `GET /flux/live`   | Liveness probe - always returns alive         |
| `GET /flux/`       | Service info (name, version, base path)       |

### Health Response Example

```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 3600000,
  "connections": {
    "total": 42,
    "channels": 5
  },
  "redis": {
    "connected": true
  }
}
```

## WebSocket Protocol

### Connecting

Connect to `ws://localhost:3004/flux/ws`. On connection, you'll receive:

```json
{
  "type": "connected",
  "payload": { "clientId": "uuid" },
  "timestamp": 1234567890
}
```

### Messages

**Subscribe to a channel:**

```json
{ "type": "subscribe", "channel": "workspace:123" }
```

**Unsubscribe from a channel:**

```json
{ "type": "unsubscribe", "channel": "workspace:123" }
```

**Broadcast to a channel:**

```json
{
  "type": "broadcast",
  "channel": "workspace:123",
  "payload": { "event": "issue.created", "data": {} }
}
```

**Ping/Pong (heartbeat):**

```json
{ "type": "ping" }
```

### Receiving Messages

When another client broadcasts to a channel you're subscribed to:

```json
{
  "type": "message",
  "channel": "workspace:123",
  "payload": { "event": "issue.created", "data": {} },
  "timestamp": 1234567890
}
```

## AMQP Consumer

The flux service includes an AMQP consumer that listens to events from RabbitMQ.

### Event Message Format

```json
{
  "event_type": "issue.created",
  "payload": {
    "data": { ... },
    "previous_attributes": { ... }
  },
  "timestamp": 1234567890,
  "publisher": "api",
  "workspace_id": "uuid",
  "project_id": "uuid",
  "entity_type": "issue",
  "entity_id": "uuid",
  "initiator_id": "uuid"
}
```

### Running the Consumer

```bash
# Development with hot reload
pnpm --filter flux dev:consumer

# Production (after build)
node --env-file=.env ./dist/consumer.mjs
```

## Horizontal Scaling

Run multiple instances behind a load balancer. Redis pub/sub ensures messages are delivered to all clients regardless of which instance they're connected to.

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Load Balancer│
                    └──────┬──────┘
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌──────▼──────┐
       │  Flux :1    │ │Flux:2 │ │  Flux :3    │
       └──────┬──────┘ └───┬───┘ └──────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    └─────────────┘
```

## Proxy Deployment

The flux service is designed to run behind a proxy at `/flux`. Configure the base path using the `FLUX_BASE_PATH` environment variable.

Example Caddy configuration:

```caddyfile
example.com {
    handle /flux/* {
        reverse_proxy flux:3004
    }
}
```

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── consumer.ts           # AMQP consumer entry point
├── server.ts             # WebSocket + HTTP server logic
├── handlers/
│   ├── index.ts          # Handler exports
│   ├── message.ts        # WebSocket message handlers
│   └── health.ts         # Health check handlers
├── schema/
│   ├── index.ts          # Schema exports
│   ├── messages.ts       # WebSocket message schemas
│   └── errors.ts         # Error types
└── services/
    ├── index.ts          # Service exports
    ├── config.ts         # Environment configuration
    ├── redis.ts          # Redis pub/sub service
    └── amqp.ts           # AMQP connection service
```

## Scripts

| Command                           | Description                    |
| --------------------------------- | ------------------------------ |
| `pnpm --filter flux dev`          | Start server with hot reload   |
| `pnpm --filter flux dev:consumer` | Start consumer with hot reload |
| `pnpm --filter flux build`        | Build for production           |
| `pnpm --filter flux start`        | Run production build           |
| `pnpm --filter flux check:types`  | Type check                     |
| `pnpm --filter flux check:lint`   | Lint                           |

## Environment Variables

| Variable                | Required | Default              | Description                     |
| ----------------------- | -------- | -------------------- | ------------------------------- |
| `PORT`                  | No       | `3004`               | Server port                     |
| `NODE_ENV`              | No       | `development`        | Environment mode                |
| `REDIS_URL`             | Yes      | -                    | Redis connection URL            |
| `CHANNEL_PREFIX`        | No       | `flux`               | Prefix for Redis channels       |
| `FLUX_BASE_PATH`        | No       | `/flux`              | Base path for HTTP/WS endpoints |
| `AMQP_URL`              | Yes\*    | -                    | RabbitMQ connection URL         |
| `EVENT_STREAM_EXCHANGE` | No       | `plane.event_stream` | AMQP exchange name              |
| `PREFETCH_COUNT`        | No       | `10`                 | AMQP prefetch count             |
