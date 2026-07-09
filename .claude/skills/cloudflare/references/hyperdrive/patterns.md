# Patterns

See [README.md](./README.md), [configuration.md](./configuration.md), [api.md](./api.md).

## High-Traffic Read-Heavy

```typescript
const sql = postgres(env.HYPERDRIVE.connectionString, {max: 5, prepare: true});

// Cacheable: popular content
const posts = await sql`SELECT * FROM posts WHERE published = true ORDER BY views DESC LIMIT 20`;

// Cacheable: user profiles
const [user] = await sql`SELECT id, username, bio FROM users WHERE id = ${userId}`;
```

**Benefits:** Trending/profiles cached (60s), connection pooling handles spikes.

## Mixed Read/Write

```typescript
interface Env {
  HYPERDRIVE_CACHED: Hyperdrive;    // max_age=120
  HYPERDRIVE_REALTIME: Hyperdrive;  // caching disabled
}

// Reads: cached
if (req.method === "GET") {
  const sql = postgres(env.HYPERDRIVE_CACHED.connectionString, {prepare: true});
  const products = await sql`SELECT * FROM products WHERE category = ${cat}`;
}

// Writes: no cache (immediate consistency)
if (req.method === "POST") {
  const sql = postgres(env.HYPERDRIVE_REALTIME.connectionString, {prepare: true});
  await sql`INSERT INTO orders ${sql(data)}`;
}
```

## Analytics Dashboard

```typescript
const client = new Client({connectionString: env.HYPERDRIVE.connectionString});
await client.connect();

// Aggregate queries cached (use fixed timestamps for caching)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const dailyStats = await client.query(`
  SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(amount) as revenue
  FROM orders WHERE created_at >= $1
  GROUP BY DATE(created_at) ORDER BY date DESC
`, [thirtyDaysAgo]);

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const topProducts = await client.query(`
  SELECT p.name, COUNT(oi.id) as count, SUM(oi.quantity * oi.price) as revenue
  FROM order_items oi JOIN products p ON oi.product_id = p.id
  WHERE oi.created_at >= $1
  GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10
`, [sevenDaysAgo]);
```

**Benefits:** Expensive aggregations cached (avoid NOW() for cacheability), dashboard instant, reduced DB load.

## Multi-Tenant

```typescript
const tenantId = req.headers.get("X-Tenant-ID");
const sql = postgres(env.HYPERDRIVE.connectionString, {prepare: true});

// Tenant-scoped queries cached separately
const docs = await sql`
  SELECT * FROM documents 
  WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
  ORDER BY updated_at DESC LIMIT 50
`;
```

**Benefits:** Per-tenant caching, shared connection pool, protects DB from multi-tenant load.

## Geographically Distributed

```typescript
// Worker runs at edge nearest user
// Connection setup at edge (fast), pooling near DB (efficient)
const sql = postgres(env.HYPERDRIVE.connectionString, {prepare: true});
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;

return Response.json({
  user,
  serverRegion: req.cf?.colo,  // Edge location
});
```

**Benefits:** Edge setup + DB pooling = global → single-region DB without replication.

## Multi-Query + Smart Placement

For Workers making **multiple queries** per request, enable Smart Placement to execute near DB:

```jsonc
// wrangler.jsonc
{
  "placement": {"mode": "smart"},
  "hyperdrive": [{"binding": "HYPERDRIVE", "id": "<ID>"}]
}
```

```typescript
const sql = postgres(env.HYPERDRIVE.connectionString, {prepare: true});

// Multiple queries benefit from Smart Placement
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
const orders = await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10`;
const stats = await sql`SELECT COUNT(*) as total, SUM(amount) as spent FROM orders WHERE user_id = ${userId}`;

return Response.json({user, orders, stats});
```

**Benefits:** Worker executes near DB → reduces latency for each query. Without Smart Placement, each query round-trips from edge.

## Connection Pooling

Operates in **transaction mode**: connection acquired per transaction, `RESET` on return.

**SET statements:**
```typescript
// ✅ Within transaction
await client.query("BEGIN");
await client.query("SET work_mem = '256MB'");
await client.query("SELECT * FROM large_table");  // Uses SET
await client.query("COMMIT");  // RESET after

// ✅ Single statement
await client.query("SET work_mem = '256MB'; SELECT * FROM large_table");

// ❌ Across queries (may get different connection)
await client.query("SET work_mem = '256MB'");
await client.query("SELECT * FROM large_table");  // SET not applied
```

**Best practices:**
```typescript
// ❌ Long transactions block pooling
await client.query("BEGIN");
await processThousands();  // Connection held entire time
await client.query("COMMIT");

// ✅ Short transactions
await client.query("BEGIN");
await client.query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
await client.query("COMMIT");

// ✅ SET LOCAL within transaction
await client.query("BEGIN");
await client.query("SET LOCAL work_mem = '256MB'");
await client.query("SELECT * FROM large_table");
await client.query("COMMIT");
```

## Performance Tips

**Enable prepared statements (required for caching):**
```typescript
const sql = postgres(connectionString, {prepare: true});  // Default, enables caching
```

**Optimize connection settings:**
```typescript
const sql = postgres(connectionString, {
  max: 5,             // Stay under Workers' 6 connection limit
  fetch_types: false, // Reduce latency if not using arrays
  idle_timeout: 60,   // Match Worker lifetime
});
```

**Write cache-friendly queries:**
```typescript
// ✅ Cacheable (deterministic)
await sql`SELECT * FROM products WHERE category = 'electronics' LIMIT 10`;

// ❌ Not cacheable (volatile NOW())
await sql`SELECT * FROM logs WHERE created_at > NOW()`;

// ✅ Cacheable (parameterized timestamp)
const ts = Date.now();
await sql`SELECT * FROM logs WHERE created_at > ${ts}`;
```

See [gotchas.md](./gotchas.md) for limits, troubleshooting.
