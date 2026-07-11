# DO Storage Configuration

## SQLite-backed (Recommended)

**wrangler.jsonc:**
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter", "Session", "RateLimiter"]
    }
  ]
}
```

**Migration lifecycle:** Migrations run once per deployment. Existing DO instances get new storage backend on next invocation. Renaming/removing classes requires `renamed_classes` or `deleted_classes` entries.

## KV-backed (Legacy)

**wrangler.jsonc:**
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["OldCounter"]
    }
  ]
}
```

## TypeScript Setup

```typescript
export class MyDurableObject extends DurableObject {
  sql: SqlStorage;
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    
    // Initialize schema
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      );
    `);
  }
}

// Binding
interface Env {
  MY_DO: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.MY_DO.idFromName('singleton');
    const stub = env.MY_DO.get(id);
    
    // Modern RPC: call methods directly (recommended)
    const result = await stub.someMethod();
    return Response.json(result);
    
    // Legacy: forward request (still works)
    // return stub.fetch(request);
  }
}
```

## CPU Limits

```jsonc
{
  "limits": {
    "cpu_ms": 300000  // 5 minutes (default 30s)
  }
}
```

## Location Control

```typescript
// Jurisdiction (GDPR/FedRAMP)
const euNamespace = env.MY_DO.jurisdiction("eu");
const id = euNamespace.newUniqueId();
const stub = euNamespace.get(id);

// Location hint (best effort)
const stub = env.MY_DO.get(id, { locationHint: "enam" });
// Hints: wnam, enam, sam, weur, eeur, apac, oc, afr, me
```

## Initialization

```typescript
export class Counter extends DurableObject {
  value: number;
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    // Block concurrent requests during init
    ctx.blockConcurrencyWhile(async () => {
      this.value = (await ctx.storage.get("value")) || 0;
    });
  }
}
```
