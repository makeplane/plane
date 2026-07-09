# Tail Workers Gotchas & Debugging

## Critical Pitfalls

### 1. Not Using `ctx.waitUntil()`

**Problem:** Async work doesn't complete or tail Worker times out  
**Cause:** Handlers exit immediately; awaiting blocks processing  
**Solution:**

```typescript
// ❌ WRONG - fire and forget
export default {
  async tail(events) {
    fetch(endpoint, { body: JSON.stringify(events) });
  }
};

// ❌ WRONG - blocking await
export default {
  async tail(events, env, ctx) {
    await fetch(endpoint, { body: JSON.stringify(events) });
  }
};

// ✅ CORRECT
export default {
  async tail(events, env, ctx) {
    ctx.waitUntil(
      (async () => {
        await fetch(endpoint, { body: JSON.stringify(events) });
        await processMore();
      })()
    );
  }
};
```

### 2. Missing `tail()` Handler

**Problem:** Producer deployment fails  
**Cause:** Worker in `tail_consumers` doesn't export `tail()` handler  
**Solution:** Ensure `export default { async tail(events, env, ctx) { ... } }`

### 3. Outcome vs HTTP Status

**Problem:** Filtering by wrong status  
**Cause:** `outcome` is script execution status, not HTTP status

```typescript
// ❌ WRONG
if (event.outcome === 500) { /* never matches */ }

// ✅ CORRECT
if (event.outcome === 'exception') { /* script threw */ }
if (event.event?.response?.status === 500) { /* HTTP 500 */ }
```

### 4. Timestamp Units

**Problem:** Dates off by 1000x  
**Cause:** Timestamps are epoch milliseconds, not seconds

```typescript
// ❌ WRONG: const date = new Date(event.eventTimestamp * 1000);
// ✅ CORRECT: const date = new Date(event.eventTimestamp);
```

### 5. Type Name Mismatch

**Problem:** Using `TailItem` type  
**Cause:** Old docs used `TailItem`, SDK uses `TraceItem`

```typescript
import type { TraceItem } from '@cloudflare/workers-types';
export default {
  async tail(events: TraceItem[], env, ctx) { /* ... */ }
};
```

### 6. Excessive Logging Volume

**Problem:** Unexpected high costs  
**Cause:** Invoked on EVERY producer request  
**Solution:** Sample events

```typescript
export default {
  async tail(events, env, ctx) {
    if (Math.random() > 0.1) return;  // 10% sample
    ctx.waitUntil(sendToEndpoint(events));
  }
};
```

### 7. Serialization Issues

**Problem:** `JSON.stringify()` fails  
**Cause:** `log.message` is `unknown[]` with non-serializable values  
**Solution:**

```typescript
const safePayload = events.map(e => ({
  ...e,
  logs: e.logs.map(log => ({
    ...log,
    message: log.message.map(m => {
      try { return JSON.parse(JSON.stringify(m)); }
      catch { return String(m); }
    })
  }))
}));
```

### 8. Missing Error Handling

**Problem:** Tail Worker silently fails  
**Cause:** No try/catch  
**Solution:**

```typescript
ctx.waitUntil((async () => {
  try {
    await fetch(env.ENDPOINT, { body: JSON.stringify(events) });
  } catch (error) {
    console.error("Tail error:", error);
    await env.FALLBACK_KV.put(`failed:${Date.now()}`, JSON.stringify(events));
  }
})());
```

### 9. Deployment Order

**Problem:** Producer deployment fails  
**Cause:** Tail consumer not deployed yet  
**Solution:** Deploy tail consumer FIRST

```bash
cd tail-worker && wrangler deploy
cd ../producer && wrangler deploy
```

### 10. No Event Retry

**Problem:** Events lost when handler fails  
**Cause:** Failed invocations NOT retried  
**Solution:** Implement fallback storage (see #8)

## Debugging

**View logs:** `wrangler tail my-tail-worker`

**Incremental testing:**
1. Verify receipt: `console.log('Events:', events.length)`
2. Inspect structure: `console.log(JSON.stringify(events[0], null, 2))`
3. Add external call with `ctx.waitUntil()`

**Monitor dashboard:** Check invocation count (matches producer?), error rate, CPU time

## Testing

Add test endpoint to producer:

```typescript
export default {
  async fetch(request) {
    if (request.url.includes('/test')) {
      console.log('Test log');
      throw new Error('Test error');
    }
    return new Response('OK');
  }
};
```

Trigger: `curl https://producer.example.workers.dev/test`

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Tail consumer not found" | Not deployed | Deploy tail Worker first |
| "No tail handler" | Missing `tail()` | Add to default export |
| "waitUntil is not a function" | Missing `ctx` | Add `ctx` parameter |
| Timeout | Blocking await | Use `ctx.waitUntil()` |

## Performance Notes

- Max 100 events per invocation
- Each consumer receives all events independently
- CPU limits same as regular Workers
- For high volume, use Durable Objects batching
