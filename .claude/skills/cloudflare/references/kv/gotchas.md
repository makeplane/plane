# KV Gotchas & Troubleshooting

## Common Errors

### "Stale Read After Write"

**Cause:** Eventual consistency means writes may not be immediately visible in other regions  
**Solution:** Don't read immediately after write; return confirmation without reading or use the local value you just wrote. Writes visible immediately in same location, ≤60s globally

```typescript
// ❌ BAD: Read immediately after write
await env.KV.put("key", "value");
const value = await env.KV.get("key"); // May be null in other regions!

// ✅ GOOD: Use the value you just wrote
const newValue = "value";
await env.KV.put("key", newValue);
return new Response(newValue); // Don't re-read
```

### "429 Rate Limit on Concurrent Writes"

**Cause:** Multiple concurrent writes to same key exceeding 1 write/second limit  
**Solution:** Use sequential writes, unique keys for concurrent operations, or implement retry with exponential backoff

```typescript
async function putWithRetry(
  kv: KVNamespace,
  key: string,
  value: string,
  maxAttempts = 5
): Promise<void> {
  let delay = 1000;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await kv.put(key, value);
      return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("429")) {
        if (i === maxAttempts - 1) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
}
```

### "Inefficient Multiple Gets"

**Cause:** Making multiple individual get() calls instead of bulk operation  
**Solution:** Use bulk get with array of keys: `env.USERS.get(["user:1", "user:2", "user:3"])` to reduce to 1 operation

### "Null Reference Error"

**Cause:** Attempting to use value without checking for null when key doesn't exist  
**Solution:** Always handle null returns - KV returns `null` for missing keys, not undefined

```typescript
// ❌ BAD: Assumes value exists
const config = await env.KV.get("config", "json");
return config.theme; // TypeError if null!

// ✅ GOOD: Null checks
const config = await env.KV.get("config", "json");
return config?.theme ?? "default";

// ✅ GOOD: Early return
const config = await env.KV.get("config", "json");
if (!config) return new Response("Not found", { status: 404 });
return new Response(config.theme);
```

### "Negative Lookup Caching"

**Cause:** Keys that don't exist are cached as "not found" for up to 60s  
**Solution:** Creating a key after checking won't be visible until cache expires

```typescript
// Check → create pattern has race condition
const exists = await env.KV.get("key"); // null, cached as "not found"
if (!exists) {
  await env.KV.put("key", "value");
  // Next get() may still return null for ~60s due to negative cache
}

// Alternative: Always assume key may not exist, use defaults
const value = await env.KV.get("key") ?? "default-value";
```

## Performance Tips

| Scenario | Recommendation | Why |
|----------|----------------|-----|
| Large values (>1MB) | Use `stream` type | Avoids buffering entire value in memory |
| Many small keys | Coalesce into one JSON object | Reduces operations, improves cache hit rate |
| High write volume | Spread across different keys | Avoid 1 write/second per-key limit |
| Cold reads | Increase `cacheTtl` parameter | Reduces latency for frequently-read data |
| Bulk operations | Use array form of get() | Single operation, better performance |

## Cost Examples

**Free tier:**
- 100K reads/day = 3M/month ✅
- 1K writes/day = 30K/month ✅
- 1GB storage ✅

**Example paid workload:**
- 10M reads/month = $5.00
- 100K writes/month = $0.50
- 1GB storage = $0.50
- **Total: ~$6/month**

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Key size | 512 bytes | Maximum key length |
| Value size | 25 MiB | Maximum value; 413 error if exceeded |
| Metadata size | 1024 bytes | Maximum metadata per key |
| cacheTtl minimum | 60s | Minimum cache TTL |
| Write rate per key | 1 write/second | All plans; 429 error if exceeded |
| Propagation time | ≤60s | Global propagation time |
| Bulk get max | 100 keys | Maximum keys per bulk operation |
| Operations per Worker | 1,000 | Per request (bulk counts as 1) |
| Reads pricing | $0.50 per 1M | Per million reads |
| Writes pricing | $5.00 per 1M | Per million writes |
| Deletes pricing | $5.00 per 1M | Per million deletes |
| Storage pricing | $0.50 per GB-month | Per GB per month |
