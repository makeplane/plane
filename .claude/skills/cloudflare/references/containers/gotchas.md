## Critical Gotchas

### ⚠️ WebSocket: fetch() vs containerFetch()

**Problem:** WebSocket connections fail silently

**Cause:** `containerFetch()` doesn't support WebSocket upgrades

**Fix:** Always use `fetch()` for WebSocket

```typescript
// ❌ WRONG
return container.containerFetch(request);

// ✅ CORRECT
return container.fetch(request);
```

### ⚠️ startAndWaitForPorts() vs start()

**Problem:** "connection refused" after `start()`

**Cause:** `start()` returns when process starts, NOT when ports ready

**Fix:** Use `startAndWaitForPorts()` before requests

```typescript
// ❌ WRONG
await container.start();
return container.fetch(request);

// ✅ CORRECT
await container.startAndWaitForPorts();
return container.fetch(request);
```

### ⚠️ Activity Timeout on Long Operations

**Problem:** Container stops during long work

**Cause:** `sleepAfter` based on request activity, not internal work

**Fix:** Renew timeout by touching storage

```typescript
const interval = setInterval(() => {
  this.ctx.storage.put("keepalive", Date.now());
}, 60000);

try {
  await this.doLongWork(data);
} finally {
  clearInterval(interval);
}
```

### ⚠️ blockConcurrencyWhile for Startup

**Problem:** Race conditions during initialization

**Fix:** Use `blockConcurrencyWhile` for atomic initialization

```typescript
await this.ctx.blockConcurrencyWhile(async () => {
  if (!this.initialized) {
    await this.startAndWaitForPorts();
    this.initialized = true;
  }
});
```

### ⚠️ Lifecycle Hooks Block Requests

**Problem:** Container unresponsive during `onStart()`

**Cause:** Hooks run in `blockConcurrencyWhile` - no concurrent requests

**Fix:** Keep hooks fast, avoid long operations

### ⚠️ Don't Override alarm() When Using schedule()

**Problem:** Scheduled tasks don't execute

**Cause:** `schedule()` uses `alarm()` internally

**Fix:** Implement `alarm()` to handle scheduled tasks

## Common Errors

### "Container start timeout"

**Cause:** Container took >8s (`start()`) or >20s (`startAndWaitForPorts()`)

**Solutions:**
- Optimize image (smaller base, fewer layers)
- Check `entrypoint` correct
- Verify app listens on correct ports
- Increase timeout if needed

### "Port not available"

**Cause:** Calling `fetch()` before port ready

**Solution:** Use `startAndWaitForPorts()`

### "Container memory exceeded"

**Cause:** Using more memory than instance type allows

**Solutions:**
- Use larger instance type (standard-2, standard-3, standard-4)
- Optimize app memory usage
- Use custom instance type

```jsonc
"instance_type_custom": {
  "vcpu": 2,
  "memory_mib": 8192
}
```

### "Max instances reached"

**Cause:** All `max_instances` slots in use

**Solutions:**
- Increase `max_instances`
- Implement proper `sleepAfter`
- Use `getRandom()` for distribution
- Check for instance leaks

### "No container instance available"

**Cause:** Account capacity limits reached

**Solutions:**
- Check account limits
- Review instance types across containers
- Contact Cloudflare support

## Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Cold start | 2-3s | Image pre-fetched globally |
| Graceful shutdown | 15 min | SIGTERM → SIGKILL |
| `start()` timeout | 8s | Process start |
| `startAndWaitForPorts()` timeout | 20s | Port ready |
| Max vCPU per container | 4 | standard-4 or custom |
| Max memory per container | 12 GiB | standard-4 or custom |
| Max disk per container | 20 GB | Ephemeral, resets |
| Account total memory | 400 GiB | All containers |
| Account total vCPU | 100 | All containers |
| Account total disk | 2 TB | All containers |
| Image storage | 50 GB | Per account |
| Disk persistence | None | Use DO storage |

## Best Practices

1. **Use `startAndWaitForPorts()` by default** - Prevents port errors
2. **Set appropriate `sleepAfter`** - Balance resources vs cold starts
3. **Use `fetch()` for WebSocket** - Not `containerFetch()`
4. **Design for restarts** - Ephemeral disk, implement graceful shutdown
5. **Monitor resources** - Stay within account limits
6. **Keep hooks fast** - Run in `blockConcurrencyWhile`
7. **Renew activity for long ops** - Touch storage to prevent timeout

## Beta Caveats

⚠️ Containers in **beta**:

- **API may change** without notice
- **No SLA** guarantees
- **Limited regions** initially
- **No autoscaling** - manual via `getRandom()`
- **Rolling deploys** only (not instant like Workers)

Plan for API changes, test thoroughly before production.
