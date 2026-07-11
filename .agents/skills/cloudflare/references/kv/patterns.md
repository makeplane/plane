# KV Patterns & Best Practices

## Multi-Tier Caching

```typescript
// Memory → KV → Origin (3-tier cache)
const memoryCache = new Map<string, { data: any; expires: number }>();

async function getCached(env: Env, key: string): Promise<any> {
  const now = Date.now();
  
  // L1: Memory cache (fastest)
  const cached = memoryCache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }
  
  // L2: KV cache (fast)
  const kvValue = await env.CACHE.get(key, "json");
  if (kvValue) {
    memoryCache.set(key, { data: kvValue, expires: now + 60000 }); // 1min in memory
    return kvValue;
  }
  
  // L3: Origin (slow)
  const origin = await fetch(`https://api.example.com/${key}`).then(r => r.json());
  
  // Backfill caches
  await env.CACHE.put(key, JSON.stringify(origin), { expirationTtl: 300 }); // 5min in KV
  memoryCache.set(key, { data: origin, expires: now + 60000 });
  
  return origin;
}
```

## API Response Caching

```typescript
async function getCachedData(env: Env, key: string, fetcher: () => Promise<any>): Promise<any> {
  const cached = await env.MY_KV.get(key, "json");
  if (cached) return cached;
  
  const data = await fetcher();
  await env.MY_KV.put(key, JSON.stringify(data), { expirationTtl: 300 });
  return data;
}

const apiData = await getCachedData(
  env,
  "cache:users",
  () => fetch("https://api.example.com/users").then(r => r.json())
);
```

## Session Management

```typescript
interface Session { userId: string; expiresAt: number; }

async function createSession(env: Env, userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
  
  await env.SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify({ userId, expiresAt }),
    { expirationTtl: 86400, metadata: { createdAt: Date.now() } }
  );
  
  return sessionId;
}

async function getSession(env: Env, sessionId: string): Promise<Session | null> {
  const data = await env.SESSIONS.get<Session>(`session:${sessionId}`, "json");
  if (!data || data.expiresAt < Date.now()) return null;
  return data;
}
```

## Coalesce Cold Keys

```typescript
// ❌ BAD: Many individual keys
await env.KV.put("user:123:name", "John");
await env.KV.put("user:123:email", "john@example.com");

// ✅ GOOD: Single coalesced object
await env.USERS.put("user:123:profile", JSON.stringify({
  name: "John",
  email: "john@example.com",
  role: "admin"
}));

// Benefits: Hot key cache, single read, reduced operations
// Trade-off: Harder to update individual fields
```

## Prefix-Based Namespacing

```typescript
// Logical partitioning within single namespace
const PREFIXES = {
  users: "user:",
  sessions: "session:",
  cache: "cache:",
  features: "feature:"
} as const;

// Write with prefix
async function setUser(env: Env, id: string, data: any) {
  await env.KV.put(`${PREFIXES.users}${id}`, JSON.stringify(data));
}

// Read with prefix
async function getUser(env: Env, id: string) {
  return await env.KV.get(`${PREFIXES.users}${id}`, "json");
}

// List by prefix
async function listUserIds(env: Env): Promise<string[]> {
  const result = await env.KV.list({ prefix: PREFIXES.users });
  return result.keys.map(k => k.name.replace(PREFIXES.users, ""));
}

// Example hierarchy
"user:123:profile"
"user:123:settings"
"cache:api:users"
"session:abc-def"
"feature:flags:beta"
```

## Metadata Versioning

```typescript
interface VersionedData {
  version: number;
  data: any;
}

async function migrateIfNeeded(env: Env, key: string) {
  const result = await env.DATA.getWithMetadata(key, "json");
  
  if (!result.value) return null;
  
  const currentVersion = result.metadata?.version || 1;
  const targetVersion = 2;
  
  if (currentVersion < targetVersion) {
    // Migrate data format
    const migrated = migrate(result.value, currentVersion, targetVersion);
    
    // Store with new version
    await env.DATA.put(key, JSON.stringify(migrated), {
      metadata: { version: targetVersion, migratedAt: Date.now() }
    });
    
    return migrated;
  }
  
  return result.value;
}

function migrate(data: any, from: number, to: number): any {
  if (from === 1 && to === 2) {
    // V1 → V2: Rename field
    return { ...data, userName: data.name };
  }
  return data;
}
```

## Error Boundary Pattern

```typescript
// Resilient get with fallback
async function resilientGet<T>(
  env: Env,
  key: string,
  fallback: T
): Promise<T> {
  try {
    const value = await env.KV.get<T>(key, "json");
    return value ?? fallback;
  } catch (err) {
    console.error(`KV error for ${key}:`, err);
    return fallback;
  }
}

// Usage
const config = await resilientGet(env, "config:app", {
  theme: "light",
  maxItems: 10
});
```
