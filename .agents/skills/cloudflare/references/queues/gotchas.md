# Queues Gotchas & Troubleshooting

## CRITICAL: Top Production Mistakes

### 1. "Entire Batch Retried After Single Error"

**Problem:** Throwing uncaught error in queue handler retries the entire batch, not just the failed message  
**Cause:** Uncaught exceptions propagate to the runtime, triggering batch-level retry  
**Solution:** Always wrap individual message processing in try/catch and call `msg.retry()` explicitly

```typescript
// ❌ BAD: Throws error, retries entire batch
async queue(batch: MessageBatch): Promise<void> {
  for (const msg of batch.messages) {
    await riskyOperation(msg.body); // If this throws, entire batch retries
    msg.ack();
  }
}

// ✅ GOOD: Catch per message, handle individually
async queue(batch: MessageBatch): Promise<void> {
  for (const msg of batch.messages) {
    try {
      await riskyOperation(msg.body);
      msg.ack();
    } catch (error) {
      msg.retry({ delaySeconds: 60 });
    }
  }
}
```

### 2. "Messages Retry Forever"

**Problem:** Messages not explicitly ack'd or retry'd will auto-retry indefinitely  
**Cause:** Runtime default behavior retries unhandled messages until `max_retries` reached  
**Solution:** Always call `msg.ack()` or `msg.retry()` for each message. Never leave messages unhandled.

```typescript
// ❌ BAD: Skipped messages auto-retry forever
async queue(batch: MessageBatch): Promise<void> {
  for (const msg of batch.messages) {
    if (shouldProcess(msg.body)) {
      await process(msg.body);
      msg.ack();
    }
    // Missing: msg.ack() for skipped messages - they will retry!
  }
}

// ✅ GOOD: Explicitly handle all messages
async queue(batch: MessageBatch): Promise<void> {
  for (const msg of batch.messages) {
    if (shouldProcess(msg.body)) {
      await process(msg.body);
      msg.ack();
    } else {
      msg.ack(); // Explicitly ack even if not processing
    }
  }
}
```

## Common Errors

### "Duplicate Message Processing"

**Problem:** Same message processed multiple times  
**Cause:** At-least-once delivery guarantee means duplicates are possible during retries  
**Solution:** Design consumers to be idempotent by tracking processed message IDs in KV with expiration TTL

```typescript
async queue(batch: MessageBatch, env: Env): Promise<void> {
  for (const msg of batch.messages) {
    const processed = await env.PROCESSED_KV.get(msg.id);
    if (processed) {
      msg.ack();
      continue;
    }
    
    await processMessage(msg.body);
    await env.PROCESSED_KV.put(msg.id, '1', { expirationTtl: 86400 });
    msg.ack();
  }
}
```

### "Pull Consumer Can't Decode Messages"

**Problem:** Pull consumer or dashboard shows unreadable message bodies  
**Cause:** Messages sent with `v8` content type are only decodable by Workers push consumers  
**Solution:** Use `json` content type for pull consumers or dashboard visibility

```typescript
// Use json for pull consumers
await env.MY_QUEUE.send(data, { contentType: 'json' });

// Use v8 only for push consumers with complex JS types
await env.MY_QUEUE.send({ date: new Date(), tags: new Set() }, { contentType: 'v8' });
```

### "Messages Not Being Delivered"

**Problem:** Messages sent but consumer not processing  
**Cause:** Queue paused, consumer not configured, or consumer errors  
**Solution:** Check queue status with `wrangler queues list`, verify consumer configured with `wrangler queues consumer add`, and check logs with `wrangler tail`

### "High Dead Letter Queue Rate"

**Problem:** Many messages ending up in DLQ  
**Cause:** Consumer repeatedly failing to process messages after max retries  
**Solution:** Review consumer error logs, check external dependency availability, verify message format matches expectations, or increase retry delay

## Error Classification Patterns

Classify errors to decide whether to retry or DLQ:

```typescript
async queue(batch: MessageBatch, env: Env): Promise<void> {
  for (const msg of batch.messages) {
    try {
      await processMessage(msg.body);
      msg.ack();
    } catch (error) {
      // Transient errors: retry with backoff
      if (isRetryable(error)) {
        const delay = Math.min(30 * (2 ** msg.attempts), 43200);
        msg.retry({ delaySeconds: delay });
      } 
      // Permanent errors: ack to avoid infinite retries
      else {
        console.error('Permanent error, sending to DLQ:', error);
        await env.ERROR_LOG.put(msg.id, JSON.stringify({ msg: msg.body, error: String(error) }));
        msg.ack(); // Prevent further retries
      }
    }
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Response) {
    // Retry: rate limits, timeouts, server errors
    return error.status === 429 || error.status >= 500;
  }
  if (error instanceof Error) {
    // Don't retry: validation, auth, not found
    return !error.message.includes('validation') && 
           !error.message.includes('unauthorized') &&
           !error.message.includes('not found');
  }
  return false; // Unknown errors don't retry
}
```

### "CPU Time Exceeded in Consumer"

**Problem:** Consumer fails with CPU time limit exceeded  
**Cause:** Consumer processing exceeding 30s default CPU time limit  
**Solution:** Increase CPU limit in wrangler.jsonc: `{ "limits": { "cpu_ms": 300000 } }` (5 minutes max)

## Content Type Decision Guide

**When to use each content type:**

| Content Type | Use When | Readable By | Supports |
|--------------|----------|-------------|----------|
| `json` (default) | Pull consumers, dashboard visibility, simple objects | All (push/pull/dashboard) | JSON-serializable types only |
| `v8` | Push consumers only, complex JS objects | Push consumers only | Date, Map, Set, BigInt, typed arrays |
| `text` | String-only payloads | All | Strings only |
| `bytes` | Binary data (images, files) | All | ArrayBuffer, Uint8Array |

**Decision tree:**
1. Need to view in dashboard or use pull consumer? → Use `json`
2. Need Date, Map, Set, or other V8 types? → Use `v8` (push consumers only)
3. Just strings? → Use `text`
4. Binary data? → Use `bytes`

```typescript
// Dashboard/pull: use json
await env.QUEUE.send({ id: 123, name: 'test' }, { contentType: 'json' });

// Complex JS types (push only): use v8
await env.QUEUE.send({ 
  created: new Date(), 
  tags: new Set(['a', 'b']) 
}, { contentType: 'v8' });
```

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max queues | 10,000 | Per account |
| Message size | 128 KB | Maximum per message |
| Batch size (consumer) | 100 messages | Maximum messages per batch |
| Batch size (sendBatch) | 100 msgs or 256 KB | Whichever limit reached first |
| Throughput | 5,000 msgs/sec | Per queue |
| Retention | 4-14 days | Configurable retention period |
| Max backlog | 25 GB | Maximum queue backlog size |
| Max delay | 12 hours (43,200s) | Maximum message delay |
| Max retries | 100 | Maximum retry attempts |
| CPU time default | 30s | Per consumer invocation |
| CPU time max | 300s (5 min) | Configurable via `limits.cpu_ms` |
| Operations per message | 3 (write + read + delete) | Base cost per message |
| Pricing | $0.40 per 1M operations | After 1M free operations |
| Message charging | Per 64 KB chunk | Messages charged in 64 KB increments |
