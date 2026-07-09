# API Reference

See [README.md](./README.md) for overview, [configuration.md](./configuration.md) for setup.

## Binding Interface

```typescript
interface Hyperdrive {
  connectionString: string;  // PostgreSQL
  // MySQL properties:
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface Env {
  HYPERDRIVE: Hyperdrive;
}
```

**Generate types:** `npx wrangler types` (auto-creates worker-configuration.d.ts from wrangler.jsonc)

## PostgreSQL (node-postgres) - RECOMMENDED

```typescript
import { Client } from "pg";  // pg@^8.17.2

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const client = new Client({connectionString: env.HYPERDRIVE.connectionString});
    try {
      await client.connect();
      const result = await client.query("SELECT * FROM users WHERE id = $1", [123]);
      return Response.json(result.rows);
    } finally {
      await client.end();
    }
  },
};
```

**⚠️ Workers connection limit: 6 per Worker invocation** - use connection pooling wisely.

## PostgreSQL (postgres.js)

```typescript
import postgres from "postgres";  // postgres@^3.4.8

const sql = postgres(env.HYPERDRIVE.connectionString, {
  max: 5,             // Limit per Worker (Workers max: 6)
  prepare: true,      // Enabled by default, required for caching
  fetch_types: false, // Reduce latency if not using arrays
});

const users = await sql`SELECT * FROM users WHERE active = ${true} LIMIT 10`;
```

**⚠️ `prepare: true` is enabled by default and required for Hyperdrive caching.** Setting to `false` disables prepared statements + cache.

## MySQL (mysql2)

```typescript
import { createConnection } from "mysql2/promise";  // mysql2@^3.16.2

const conn = await createConnection({
  host: env.HYPERDRIVE.host,
  user: env.HYPERDRIVE.user,
  password: env.HYPERDRIVE.password,
  database: env.HYPERDRIVE.database,
  port: env.HYPERDRIVE.port,
  disableEval: true,  // ⚠️ REQUIRED for Workers
});

const [results] = await conn.query("SELECT * FROM users WHERE active = ? LIMIT ?", [true, 10]);
ctx.waitUntil(conn.end());
```

**⚠️ MySQL support is less mature than PostgreSQL** - expect fewer optimizations and potential edge cases.

## Query Caching

**Cacheable:**
```sql
SELECT * FROM posts WHERE published = true;
SELECT COUNT(*) FROM users;
```

**NOT cacheable:**
```sql
-- Writes
INSERT/UPDATE/DELETE

-- Volatile functions
SELECT NOW();
SELECT random();
SELECT LASTVAL();  -- PostgreSQL
SELECT UUID();     -- MySQL
```

**Cache config:**
- Default: `max_age=60s`, `swr=15s`
- Max `max_age`: 3600s
- Disable: `--caching-disabled=true`

**Multiple configs pattern:**
```typescript
// Reads: cached
const sqlCached = postgres(env.HYPERDRIVE_CACHED.connectionString);
const posts = await sqlCached`SELECT * FROM posts ORDER BY views DESC LIMIT 10`;

// Writes/time-sensitive: no cache
const sqlNoCache = postgres(env.HYPERDRIVE_NO_CACHE.connectionString);
const orders = await sqlNoCache`SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 5 MINUTE`;
```

## ORMs

**Drizzle:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";  // drizzle-orm@^0.45.1
import postgres from "postgres";

const client = postgres(env.HYPERDRIVE.connectionString, {max: 5, prepare: true});
const db = drizzle(client);
const users = await db.select().from(users).where(eq(users.active, true)).limit(10);
```

**Kysely:**
```typescript
import { Kysely, PostgresDialect } from "kysely";  // kysely@^0.27+
import postgres from "postgres";

const db = new Kysely({
  dialect: new PostgresDialect({
    postgres: postgres(env.HYPERDRIVE.connectionString, {max: 5, prepare: true}),
  }),
});
const users = await db.selectFrom("users").selectAll().where("active", "=", true).execute();
```

See [patterns.md](./patterns.md) for use cases, [gotchas.md](./gotchas.md) for limits.
