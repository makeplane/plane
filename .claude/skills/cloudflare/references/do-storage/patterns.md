# DO Storage Patterns & Best Practices

## Schema Migration

**Note:** `PRAGMA user_version` is **not supported** in Durable Objects SQLite storage. Use a `_sql_schema_migrations` table instead:

```typescript
export class MyDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const ver = this.sql
      .exec<{ version: number }>("SELECT COALESCE(MAX(id), 0) as version FROM _sql_schema_migrations")
      .one().version;

    if (ver < 1) {
      this.sql.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT)`);
      this.sql.exec("INSERT INTO _sql_schema_migrations (id) VALUES (1)");
    }
    if (ver < 2) {
      this.sql.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
      this.sql.exec("INSERT INTO _sql_schema_migrations (id) VALUES (2)");
    }
  }
}
```

For production apps, consider [`durable-utils`](https://github.com/lambrospetrou/durable-utils#sqlite-schema-migrations) — provides a `SQLSchemaMigrations` class that tracks executed migrations both in memory and in storage. Also see [`@cloudflare/actors` storage utilities](https://github.com/cloudflare/actors/blob/main/packages/storage/src/sql-schema-migrations.ts) — a reference implementation of the same pattern used by the Cloudflare Actors framework.

## In-Memory Caching

```typescript
export class UserCache extends DurableObject {
  cache = new Map<string, User>();
  async getUser(id: string): Promise<User | undefined> {
    if (this.cache.has(id)) {
      const cached = this.cache.get(id);
      if (cached) return cached;
    }
    const user = await this.ctx.storage.get<User>(`user:${id}`);
    if (user) this.cache.set(id, user);
    return user;
  }
  async updateUser(id: string, data: Partial<User>) {
    const updated = { ...await this.getUser(id), ...data };
    this.cache.set(id, updated);
    await this.ctx.storage.put(`user:${id}`, updated);
    return updated;
  }
}
```

## Rate Limiting

```typescript
export class RateLimiter extends DurableObject {
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    this.sql.exec('DELETE FROM requests WHERE key = ? AND timestamp < ?', key, now - window);
    const count = this.sql.exec('SELECT COUNT(*) as count FROM requests WHERE key = ?', key).one().count;
    if (count >= limit) return false;
    this.sql.exec('INSERT INTO requests (key, timestamp) VALUES (?, ?)', key, now);
    return true;
  }
}
```

## Batch Processing with Alarms

```typescript
export class BatchProcessor extends DurableObject {
  pending: string[] = [];
  async addItem(item: string) {
    this.pending.push(item);
    if (!await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(Date.now() + 5000);
  }
  async alarm() {
    const items = [...this.pending];
    this.pending = [];
    this.sql.exec(`INSERT INTO processed_items (item, timestamp) VALUES ${items.map(() => "(?, ?)").join(", ")}`, ...items.flatMap(item => [item, Date.now()]));
  }
}
```

## Initialization Pattern

```typescript
export class Counter extends DurableObject {
  value: number;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => { this.value = (await ctx.storage.get("value")) || 0; });
  }
  async increment() {
    this.value++;
    this.ctx.storage.put("value", this.value); // Don't await (output gate protects)
    return this.value;
  }
}
```

## Safe Counter / Optimized Write

```typescript
// Input gate blocks other requests
async getUniqueNumber(): Promise<number> {
  let val = await this.ctx.storage.get("counter");
  await this.ctx.storage.put("counter", val + 1);
  return val;
}

// No await on write - output gate delays response until write confirms
async increment(): Promise<Response> {
  let val = await this.ctx.storage.get("counter");
  this.ctx.storage.put("counter", val + 1);
  return new Response(String(val));
}
```

## Parent-Child Coordination

Hierarchical DO pattern where parent manages child DOs:

```typescript
// Parent DO coordinates children
export class Workspace extends DurableObject {
  async createDocument(name: string): Promise<string> {
    const docId = crypto.randomUUID();
    const childId = this.env.DOCUMENT.idFromName(`${this.ctx.id.toString()}:${docId}`);
    const childStub = this.env.DOCUMENT.get(childId);
    await childStub.initialize(name);
    
    // Track child in parent storage
    this.sql.exec('INSERT INTO documents (id, name, created) VALUES (?, ?, ?)', 
      docId, name, Date.now());
    return docId;
  }
  
  async listDocuments(): Promise<string[]> {
    return this.sql.exec('SELECT id FROM documents').toArray().map(r => r.id);
  }
}

// Child DO
export class Document extends DurableObject {
  async initialize(name: string) {
    this.sql.exec('CREATE TABLE IF NOT EXISTS content(key TEXT PRIMARY KEY, value TEXT)');
    this.sql.exec('INSERT INTO content VALUES (?, ?)', 'name', name);
  }
}
```

## Write Coalescing Pattern

Multiple writes to same key coalesce atomically (last write wins):

```typescript
async updateMetrics(userId: string, actions: Action[]) {
  // All writes coalesce - no await needed
  for (const action of actions) {
    this.ctx.storage.put(`user:${userId}:lastAction`, action.type);
    this.ctx.storage.put(`user:${userId}:count`, 
      await this.ctx.storage.get(`user:${userId}:count`) + 1);
  }
  // Output gate ensures all writes confirm before response
  return new Response("OK");
}

// Atomic batch with SQL
async batchUpdate(items: Item[]) {
  this.sql.exec('BEGIN');
  for (const item of items) {
    this.sql.exec('INSERT OR REPLACE INTO items VALUES (?, ?)', item.id, item.value);
  }
  this.sql.exec('COMMIT');
}
```

## Cleanup

```typescript
async cleanup() {
  await this.ctx.storage.deleteAlarm(); // Separate from deleteAll
  await this.ctx.storage.deleteAll();
}
```
