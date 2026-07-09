# KV API Reference

## Read Operations

```typescript
// Single key (string)
const value = await env.MY_KV.get("user:123");

// JSON type (auto-parsed)
const config = await env.MY_KV.get<AppConfig>("config", "json");

// ArrayBuffer for binary
const buffer = await env.MY_KV.get("image", "arrayBuffer");

// Stream for large values
const stream = await env.MY_KV.get("large-file", "stream");

// With cache TTL (min 60s)
const value = await env.MY_KV.get("key", { type: "text", cacheTtl: 300 });

// Bulk get (max 100 keys, counts as 1 operation)
const keys = ["user:1", "user:2", "user:3", "missing:key"];
const results = await env.MY_KV.get(keys);
// Returns Map<string, string | null>

console.log(results.get("user:1"));     // "John" (if exists)
console.log(results.get("missing:key")); // null

// Process results with null handling
for (const [key, value] of results) {
  if (value !== null) {
    // Handle found keys
    console.log(`${key}: ${value}`);
  }
}

// TypeScript with generics (type-safe JSON parsing)
interface UserProfile { name: string; email: string; }
const profile = await env.USERS.get<UserProfile>("user:123", "json");
// profile is typed as UserProfile | null
if (profile) {
  console.log(profile.name); // Type-safe access
}

// Bulk get with type
const configs = await env.MY_KV.get<Config>(["config:app", "config:feature"], "json");
// Map<string, Config | null>
```

## Write Operations

```typescript
// Basic put
await env.MY_KV.put("key", "value");
await env.MY_KV.put("config", JSON.stringify({ theme: "dark" }));

// With expiration (UNIX timestamp)
await env.MY_KV.put("session", token, {
  expiration: Math.floor(Date.now() / 1000) + 3600
});

// With TTL (seconds from now, min 60)
await env.MY_KV.put("cache", data, { expirationTtl: 300 });

// With metadata (max 1024 bytes)
await env.MY_KV.put("user:profile", userData, {
  metadata: { version: 2, lastUpdated: Date.now() }
});

// Combined
await env.MY_KV.put("temp", value, {
  expirationTtl: 3600,
  metadata: { temporary: true }
});
```

## Get with Metadata

```typescript
// Single key
const result = await env.MY_KV.getWithMetadata("user:profile");
// { value: string | null, metadata: any | null }

if (result.value && result.metadata) {
  const { version, lastUpdated } = result.metadata;
}

// Multiple keys (bulk)
const keys = ["key1", "key2", "key3"];
const results = await env.MY_KV.getWithMetadata(keys);
// Returns Map<string, { value, metadata, cacheStatus? }>

for (const [key, result] of results) {
  if (result.value) {
    console.log(`${key}: ${result.value}`);
    console.log(`Metadata: ${JSON.stringify(result.metadata)}`);
    // cacheStatus field indicates cache hit/miss (when available)
  }
}

// With type
const result = await env.MY_KV.getWithMetadata<UserData>("user:123", "json");
// result: { value: UserData | null, metadata: any | null, cacheStatus?: string }
```

## Delete Operations

```typescript
await env.MY_KV.delete("key"); // Always succeeds (even if key missing)
```

## List Operations

```typescript
// List all
const keys = await env.MY_KV.list();
// { keys: [...], list_complete: boolean, cursor?: string }

// With prefix
const userKeys = await env.MY_KV.list({ prefix: "user:" });

// Pagination
let cursor: string | undefined;
let allKeys = [];
do {
  const result = await env.MY_KV.list({ cursor, limit: 1000 });
  allKeys.push(...result.keys);
  cursor = result.cursor;
} while (!result.list_complete);
```

## Performance Considerations

### Type Selection

| Type | Use Case | Performance |
|------|----------|-------------|
| `stream` | Large values (>1MB) | Fastest - no buffering |
| `arrayBuffer` | Binary data | Fast - single allocation |
| `text` | String values | Medium |
| `json` | Objects (parse overhead) | Slowest - parsing cost |

### Parallel Reads

```typescript
// Efficient parallel reads with Promise.all()
const [user, settings, cache] = await Promise.all([
  env.USERS.get("user:123", "json"),
  env.SETTINGS.get("config:app", "json"),
  env.CACHE.get("data:latest")
]);
```

## Error Handling

- **Missing keys:** Return `null` (not an error)
- **Rate limit (429):** Retry with exponential backoff (see gotchas.md)
- **Response too large (413):** Values >25MB fail with 413 error

See [gotchas.md](./gotchas.md) for detailed error patterns and solutions.
