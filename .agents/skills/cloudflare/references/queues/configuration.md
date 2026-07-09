# Queues Configuration

## Create Queue

```bash
wrangler queues create my-queue
wrangler queues create my-queue --retention-period-hours=336  # 14 days
wrangler queues create my-queue --delivery-delay-secs=300
```

## Producer Binding

**wrangler.jsonc:**
```jsonc
{
  "queues": {
    "producers": [
      {
        "queue": "my-queue-name",
        "binding": "MY_QUEUE",
        "delivery_delay": 60  // Optional: default delay in seconds
      }
    ]
  }
}
```

## Consumer Configuration (Push-based)

**wrangler.jsonc:**
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue-name",
        "max_batch_size": 10,           // 1-100, default 10
        "max_batch_timeout": 5,         // 0-60s, default 5
        "max_retries": 3,               // default 3, max 100
        "dead_letter_queue": "my-dlq",  // optional
        "retry_delay": 300              // optional: delay retries in seconds
      }
    ]
  }
}
```

## Consumer Configuration (Pull-based)

**wrangler.jsonc:**
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue-name",
        "type": "http_pull",
        "visibility_timeout_ms": 5000,  // default 30000, max 12h
        "max_retries": 5,
        "dead_letter_queue": "my-dlq"
      }
    ]
  }
}
```

## TypeScript Types

```typescript
interface Env {
  MY_QUEUE: Queue<MessageBody>;
  ANALYTICS_QUEUE: Queue<AnalyticsEvent>;
}

interface MessageBody {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, any>;
}

export default {
  async queue(batch: MessageBatch<MessageBody>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      console.log(msg.body.action);
      msg.ack();
    }
  }
} satisfies ExportedHandler<Env>;
```

## Content Type Selection

Choose content type based on consumer type and data requirements:

| Content Type | Use When | Readable By | Supports | Size |
|--------------|----------|-------------|----------|------|
| `json` | Pull consumers, dashboard visibility, simple objects | All (push/pull/dashboard) | JSON-serializable types only | Medium |
| `v8` | Push consumers only, complex JS objects | Push consumers only | Date, Map, Set, BigInt, typed arrays | Small |
| `text` | String-only payloads | All | Strings only | Smallest |
| `bytes` | Binary data (images, files) | All | ArrayBuffer, Uint8Array | Variable |

**Decision tree:**
1. Need to view in dashboard or use pull consumer? → Use `json`
2. Need Date, Map, Set, or other V8 types? → Use `v8` (push consumers only)
3. Just strings? → Use `text`
4. Binary data? → Use `bytes`

```typescript
// JSON: Good for simple objects, pull consumers, dashboard visibility
await env.QUEUE.send({ id: 123, name: 'test' }, { contentType: 'json' });

// V8: Good for Date, Map, Set (push consumers only)
await env.QUEUE.send({ 
  created: new Date(), 
  tags: new Set(['a', 'b']) 
}, { contentType: 'v8' });

// Text: Simple strings
await env.QUEUE.send('process-user-123', { contentType: 'text' });

// Bytes: Binary data
await env.QUEUE.send(imageBuffer, { contentType: 'bytes' });
```

**Default behavior:** If not specified, Cloudflare auto-selects `json` for JSON-serializable objects and `v8` for complex types.

**IMPORTANT:** `v8` messages cannot be read by pull consumers or viewed in the dashboard. Use `json` if you need visibility or pull-based consumption.

## CLI Commands

```bash
# Consumer management
wrangler queues consumer add my-queue my-worker --batch-size=50 --max-retries=5
wrangler queues consumer http add my-queue
wrangler queues consumer worker remove my-queue my-worker
wrangler queues consumer http remove my-queue

# Queue operations
wrangler queues list
wrangler queues pause my-queue
wrangler queues resume my-queue
wrangler queues purge my-queue
wrangler queues delete my-queue
```
