# Tail Workers Configuration

## Setup Steps

### 1. Create Tail Worker

Create a Worker with a `tail()` handler:

```typescript
export default {
  async tail(events, env, ctx) {
    // Process events from producer Worker
    ctx.waitUntil(
      fetch(env.LOG_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(events),
      })
    );
  }
};
```

### 2. Configure Producer Worker

In producer's `wrangler.jsonc`:

```jsonc
{
  "name": "my-producer-worker",
  "tail_consumers": [
    {
      "service": "my-tail-worker"
    }
  ]
}
```

### 3. Deploy Both Workers

```bash
# Deploy Tail Worker first
cd tail-worker
wrangler deploy

# Then deploy producer Worker
cd ../producer-worker
wrangler deploy
```

## Wrangler Configuration

### Single Tail Consumer

```jsonc
{
  "name": "producer-worker",
  "tail_consumers": [
    {
      "service": "logging-tail-worker"
    }
  ]
}
```

### Multiple Tail Consumers

```jsonc
{
  "name": "producer-worker",
  "tail_consumers": [
    {
      "service": "logging-tail-worker"
    },
    {
      "service": "metrics-tail-worker"
    }
  ]
}
```

**Note:** Each consumer receives ALL events independently.

### Remove Tail Consumer

```jsonc
{
  "tail_consumers": []
}
```

Then redeploy producer Worker.

## Environment Variables

Tail Workers use same binding syntax as regular Workers:

```jsonc
{
  "name": "my-tail-worker",
  "vars": {
    "LOG_ENDPOINT": "https://logs.example.com/ingest"
  },
  "kv_namespaces": [
    {
      "binding": "LOGS_KV",
      "id": "abc123..."
    }
  ]
}
```

## Testing & Development

### Local Testing

**Tail Workers cannot be fully tested with `wrangler dev`.** Deploy to staging environment for testing.

### Testing Strategy

1. Deploy producer Worker to staging
2. Deploy Tail Worker to staging
3. Configure `tail_consumers` in producer
4. Trigger producer Worker requests
5. Verify Tail Worker receives events (check destination logs/storage)

### Wrangler Tail Command

```bash
# Stream logs to terminal (NOT Tail Workers)
wrangler tail my-producer-worker
```

**This is different from Tail Workers:**
- `wrangler tail` streams logs to your terminal
- Tail Workers are Workers that process events programmatically

## Deployment Checklist

- [ ] Tail Worker has `tail()` handler
- [ ] Tail Worker deployed before producer
- [ ] Producer's `wrangler.jsonc` has correct `tail_consumers`
- [ ] Environment variables configured
- [ ] Tested with staging environment
- [ ] Monitoring configured for Tail Worker itself

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max tail consumers per producer | 10 | Each receives all events independently |
| Events batch size | Up to 100 events per invocation | Larger batches split across invocations |
| Tail Worker CPU time | Same as regular Workers | 10ms (free), 30s default / 5min max (paid) |
| Pricing tier | Workers Paid or Enterprise | Not available on free plan |
| Request body size | 100 MB max | When sending to external endpoints |
| Event retention | None | Events not retried if tail handler fails |

## Workers for Platforms

For dynamic dispatch Workers, both dispatch and user Worker events sent to tail consumer:

```jsonc
{
  "name": "dispatch-worker",
  "tail_consumers": [
    {
      "service": "platform-tail-worker"
    }
  ]
}
```

Tail Worker receives TWO `TraceItem` elements per request:
1. Dynamic dispatch Worker event
2. User Worker event

See [patterns.md](patterns.md) for handling.
