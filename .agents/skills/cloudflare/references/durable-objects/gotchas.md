# Durable Objects Gotchas

## Common Errors

### "Hibernation Cleared My In-Memory State"

**Problem:** Variables lost after hibernation  
**Cause:** DO auto-hibernates when idle; in-memory state not persisted  
**Solution:** Use `ctx.storage` for critical data, `ws.serializeAttachment()` for per-connection metadata

```typescript
// ❌ Wrong - lost on hibernation
private userCount = 0;
async webSocketMessage(ws: WebSocket, msg: string) {
  this.userCount++;  // Lost!
}

// ✅ Right - persisted
async webSocketMessage(ws: WebSocket, msg: string) {
  const count = this.ctx.storage.kv.get("userCount") || 0;
  this.ctx.storage.kv.put("userCount", count + 1);
}
```

### "setTimeout Didn't Fire After Restart"

**Problem:** Scheduled work lost on eviction  
**Cause:** `setTimeout` in-memory only; eviction clears timers  
**Solution:** Use `ctx.storage.setAlarm()` for reliable scheduling

```typescript
// ❌ Wrong - lost on eviction
setTimeout(() => this.cleanup(), 3600000);

// ✅ Right - survives eviction
await this.ctx.storage.setAlarm(Date.now() + 3600000);
async alarm() { await this.cleanup(); }
```

### "Constructor Runs on Every Wake"

**Problem:** Expensive init logic slows all requests  
**Cause:** Constructor runs on every wake (first request after eviction OR after hibernation)  
**Solution:** Lazy initialization or cache in storage

**Critical understanding:** Constructor runs in two scenarios:
1. **Cold start** - DO evicted from memory, first request creates new instance
2. **Wake from hibernation** - DO with WebSockets hibernated, message/alarm wakes it

```typescript
// ❌ Wrong - expensive on every wake
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.heavyData = this.loadExpensiveData();  // Slow!
}

// ✅ Right - lazy load
private heavyData?: HeavyData;
private getHeavyData() {
  if (!this.heavyData) this.heavyData = this.loadExpensiveData();
  return this.heavyData;
}
```

### "Durable Object Overloaded (503 errors)"

**Problem:** 503 errors under load  
**Cause:** Single DO exceeding ~1K req/s throughput limit  
**Solution:** Shard across multiple DOs (see [Patterns: Sharding](./patterns.md))

### "Storage Quota Exceeded (Write failures)"

**Problem:** Write operations failing  
**Cause:** DO storage exceeding 10GB limit or account quota  
**Solution:** Cleanup with alarms, use `deleteAll()` for old data, upgrade plan

### "CPU Time Exceeded (Terminated)"

**Problem:** Request terminated mid-execution  
**Cause:** Processing exceeding 30s CPU time default limit  
**Solution:** Increase `limits.cpu_ms` in wrangler.jsonc (max 300s) or chunk work

### "WebSockets Disconnect on Eviction"

**Problem:** Connections drop unexpectedly  
**Cause:** DO evicted from memory without hibernation API  
**Solution:** Use WebSocket hibernation handlers + client reconnection logic

### "Migration Failed (Deploy error)"

**Cause:** Non-unique tags, non-sequential tags, or invalid class names in migration  
**Solution:** Check tag uniqueness/sequential ordering and verify class names are correct

### "RPC Method Not Found"

**Cause:** compatibility_date < 2024-04-03 preventing RPC usage  
**Solution:** Update compatibility_date to >= 2024-04-03 or use fetch() instead of RPC

### "Only One Alarm Allowed"

**Cause:** Need multiple scheduled tasks but only one alarm supported per DO  
**Solution:** Use event queue pattern to schedule multiple tasks with single alarm

### "Race Condition Despite Single-Threading"

**Problem:** Concurrent requests see inconsistent state  
**Cause:** Async operations allow request interleaving (await = yield point)  
**Solution:** Use `blockConcurrencyWhile()` for critical sections or atomic storage ops

```typescript
// ❌ Wrong - race condition
async incrementCounter() {
  const count = await this.ctx.storage.get("count") || 0;
  // ⚠️ Another request could execute here during await
  await this.ctx.storage.put("count", count + 1);
}

// ✅ Right - atomic operation
async incrementCounter() {
  return this.ctx.storage.sql.exec(
    "INSERT INTO counters (id, value) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET value = value + 1 RETURNING value"
  ).one().value;
}

// ✅ Right - explicit locking
async criticalOperation() {
  await this.ctx.blockConcurrencyWhile(async () => {
    const count = await this.ctx.storage.get("count") || 0;
    await this.ctx.storage.put("count", count + 1);
  });
}
```

### "Migration Rollback Not Supported"

**Cause:** Attempting to rollback a migration after deployment  
**Solution:** Test with `--dry-run` before deploying; migrations cannot be rolled back

### "deleted_classes Destroys Data"

**Problem:** Migration deleted all data  
**Cause:** `deleted_classes` migration immediately destroys all DO instances and data  
**Solution:** Test with `--dry-run`; use `transferred_classes` to preserve data during moves

### "Cold Starts Are Slow"

**Problem:** First request after eviction takes longer  
**Cause:** DO constructor + initial storage access on cold start  
**Solution:** Expected behavior; optimize constructor, use connection pooling in clients, consider warming strategy for critical DOs

```typescript
// Warming strategy (periodically ping critical DOs)
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const criticalIds = ["auth", "sessions", "locks"];
    await Promise.all(criticalIds.map(name => {
      const id = env.MY_DO.idFromName(name);
      const stub = env.MY_DO.get(id);
      return stub.ping();  // Keep warm
    }));
  }
};
```

## Limits

| Limit | Free | Paid | Notes |
|-------|------|------|-------|
| SQLite storage per DO | 10 GB | 10 GB | Per Durable Object instance |
| SQLite total storage | 5 GB | Unlimited | Account-wide quota |
| Key+value size | 2 MB | 2 MB | Single KV pair (SQLite/async) |
| CPU time default | 30s | 30s | Per request; configurable |
| CPU time max | 300s | 300s | Set via `limits.cpu_ms` |
| DO classes | 100 | 500 | Distinct DO class definitions |
| SQL columns | 100 | 100 | Per table |
| SQL statement size | 100 KB | 100 KB | Max SQL query size |
| WebSocket message size | 32 MiB | 32 MiB | Per message |
| Request throughput | ~1K req/s | ~1K req/s | Per DO (soft limit - shard for more) |
| Alarms per DO | 1 | 1 | Use queue pattern for multiple events |
| Total DOs | Unlimited | Unlimited | Create as many instances as needed |
| WebSockets | Unlimited | Unlimited | Within 128MB memory limit per DO |
| Memory per DO | 128 MB | 128 MB | In-memory state + WebSocket buffers |

## Hibernation Caveats

1. **Memory cleared** - All in-memory variables lost; reconstruct from storage or `deserializeAttachment()`
2. **Constructor reruns** - Runs on wake; avoid expensive operations, use lazy initialization
3. **No guarantees** - DO may evict instead of hibernate; design for both
4. **Attachment limit** - `serializeAttachment()` data must be JSON-serializable, keep small
5. **Alarm wakes DO** - Alarm prevents hibernation until handler completes
6. **WebSocket state not automatic** - Must explicitly persist with `serializeAttachment()` or storage

## See Also

- **[Patterns](./patterns.md)** - Workarounds for common limitations
- **[API](./api.md)** - Storage limits and quotas
- **[Configuration](./configuration.md)** - Setting CPU limits
