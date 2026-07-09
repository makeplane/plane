# DO Storage Gotchas & Troubleshooting

## Concurrency Model (CRITICAL)

Durable Objects use **input/output gates** to prevent race conditions:

### Input Gates
Block new requests during storage reads from CURRENT request:

```typescript
// SAFE: Input gate active during await
async increment() {
  const val = await this.ctx.storage.get("counter"); // Input gate blocks other requests
  await this.ctx.storage.put("counter", val + 1);
  return val;
}
```

### Output Gates
Hold response until ALL writes from current request confirm:

```typescript
// SAFE: Output gate waits for put() to confirm before returning response
async increment() {
  const val = await this.ctx.storage.get("counter");
  this.ctx.storage.put("counter", val + 1); // No await
  return new Response(String(val)); // Response delayed until write confirms
}
```

### Write Coalescing
Multiple writes to same key = atomic (last write wins):

```typescript
// SAFE: All three writes coalesce atomically
this.ctx.storage.put("key", 1);
this.ctx.storage.put("key", 2);
this.ctx.storage.put("key", 3); // Final value: 3
```

### Breaking Gates (DANGER)

**fetch() breaks input/output gates** → allows request interleaving:

```typescript
// UNSAFE: fetch() allows another request to interleave
async unsafe() {
  const val = await this.ctx.storage.get("counter");
  await fetch("https://api.example.com"); // Gate broken!
  await this.ctx.storage.put("counter", val + 1); // Race condition possible
}
```

**Solution:** Use `blockConcurrencyWhile()` or `transaction()`:

```typescript
// SAFE: Block concurrent requests explicitly
async safe() {
  return await this.ctx.blockConcurrencyWhile(async () => {
    const val = await this.ctx.storage.get("counter");
    await fetch("https://api.example.com");
    await this.ctx.storage.put("counter", val + 1);
    return val;
  });
}
```

### allowConcurrency Option

Opt out of input gate for reads that don't need protection:

```typescript
// Allow concurrent reads (no consistency guarantee)
const val = await this.ctx.storage.get("metrics", { allowConcurrency: true });
```

## Common Errors

### "Race Condition in Concurrent Calls"

**Cause:** Multiple concurrent storage operations initiated from same event (e.g., `Promise.all()`) are not protected by input gate  
**Solution:** Avoid concurrent storage operations within single event; input gate only serializes requests from different events, not operations within same event

### "Direct SQL Transaction Statements"

**Cause:** Using `BEGIN TRANSACTION` directly instead of transaction methods  
**Solution:** Use `this.ctx.storage.transactionSync()` for sync operations or `this.ctx.storage.transaction()` for async operations

### "Async in transactionSync"

**Cause:** Using async operations inside `transactionSync()` callback  
**Solution:** Use async `transaction()` method instead of `transactionSync()` when async operations needed

### "TypeScript Type Mismatch at Runtime"

**Cause:** Query doesn't return all fields specified in TypeScript type  
**Solution:** Ensure SQL query selects all columns that match the TypeScript type definition

### "Silent Data Corruption with Large IDs"

**Cause:** JavaScript numbers have 53-bit precision; SQLite INTEGER is 64-bit  
**Symptom:** IDs > 9007199254740991 (Number.MAX_SAFE_INTEGER) silently truncate/corrupt  
**Solution:** Store large IDs as TEXT:

```typescript
// BAD: Snowflake/Twitter IDs will corrupt
this.sql.exec("CREATE TABLE events(id INTEGER PRIMARY KEY)");
this.sql.exec("INSERT INTO events VALUES (?)", 1234567890123456789n); // Corrupts!

// GOOD: Store as TEXT
this.sql.exec("CREATE TABLE events(id TEXT PRIMARY KEY)");
this.sql.exec("INSERT INTO events VALUES (?)", "1234567890123456789");
```

### "Alarm Not Deleted with deleteAll()"

**Cause:** `deleteAll()` doesn't delete alarms automatically  
**Solution:** Call `deleteAlarm()` explicitly before `deleteAll()` to remove alarm

### "Slow Performance"

**Cause:** Using async KV API instead of sync API  
**Solution:** Use sync KV API (`ctx.storage.kv`) for better performance with simple key-value operations

### "High Billing from Storage Operations"

**Cause:** Excessive `rowsRead`/`rowsWritten` or unused objects not cleaned up  
**Solution:** Monitor `rowsRead`/`rowsWritten` metrics and ensure unused objects call `deleteAll()`

### "Durable Object Overloaded"

**Cause:** Single DO exceeding ~1K req/sec soft limit  
**Solution:** Shard across multiple DOs with random IDs or other distribution strategy

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Max columns per table | 100 | SQL limitation |
| Max string/BLOB per row | 2 MB | SQL limitation |
| Max row size | 2 MB | SQL limitation |
| Max SQL statement size | 100 KB | SQL limitation |
| Max SQL parameters | 100 | SQL limitation |
| Max LIKE/GLOB pattern | 50 B | SQL limitation |
| SQLite storage per object | 10 GB | SQLite-backed storage |
| SQLite key+value size | 2 MB | SQLite-backed storage |
| KV storage per object | Unlimited | KV-style storage |
| KV key size | 2 KiB | KV-style storage |
| KV value size | 128 KiB | KV-style storage |
| Request throughput | ~1K req/sec | Soft limit per DO |
