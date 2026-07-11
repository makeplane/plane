# D1 Configuration

## wrangler.jsonc Setup

```jsonc
{
  "name": "your-worker-name",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01", // Use current date for new projects
  "d1_databases": [
    {
      "binding": "DB",                    // Env variable name
      "database_name": "your-db-name",    // Human-readable name
      "database_id": "your-database-id",  // UUID from dashboard/CLI
      "migrations_dir": "migrations"      // Optional: default is "migrations"
    },
    // Read replica (paid plans only)
    {
      "binding": "DB_REPLICA",
      "database_name": "your-db-name",
      "database_id": "your-database-id"   // Same ID, different binding
    },
    // Multiple databases
    {
      "binding": "ANALYTICS_DB",
      "database_name": "analytics-db",
      "database_id": "yyy-yyy-yyy"
    }
  ]
}
```

## TypeScript Types

```typescript
interface Env { DB: D1Database; ANALYTICS_DB?: D1Database; }

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const result = await env.DB.prepare('SELECT * FROM users').all();
    return Response.json(result.results);
  }
}
```

## Migrations

File structure: `migrations/0001_initial_schema.sql`, `0002_add_posts.sql`, etc.

### Example Migration

```sql
-- migrations/0001_initial_schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
```

### Running Migrations

```bash
# Create new migration file
wrangler d1 migrations create <db-name> add_users_table
# Creates: migrations/0001_add_users_table.sql

# Apply migrations
wrangler d1 migrations apply <db-name> --local     # Apply to local DB
wrangler d1 migrations apply <db-name> --remote    # Apply to production DB

# List applied migrations
wrangler d1 migrations list <db-name> --remote

# Direct SQL execution (bypasses migration tracking)
wrangler d1 execute <db-name> --remote --command="SELECT * FROM users"
wrangler d1 execute <db-name> --local --file=./schema.sql
```

**Migration tracking**: Wrangler creates `d1_migrations` table automatically to track applied migrations

## Indexing Strategy

```sql
-- Index frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Composite indexes for multi-column queries
CREATE INDEX idx_posts_user_published ON posts(user_id, published);

-- Covering indexes (include queried columns)
CREATE INDEX idx_users_email_name ON users(email, name);

-- Partial indexes for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE active = 1;

-- Check if query uses index
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?;
```

## Drizzle ORM

```typescript
// drizzle.config.ts
export default {
  schema: './src/schema.ts', out: './migrations', dialect: 'sqlite', driver: 'd1-http',
  dbCredentials: { accountId: process.env.CLOUDFLARE_ACCOUNT_ID!, databaseId: process.env.D1_DATABASE_ID!, token: process.env.CLOUDFLARE_API_TOKEN! }
} satisfies Config;

// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull()
});

// worker.ts
import { drizzle } from 'drizzle-orm/d1';
import { users } from './schema';
export default {
  async fetch(request: Request, env: Env) {
    const db = drizzle(env.DB);
    return Response.json(await db.select().from(users));
  }
}
```

## Import & Export

```bash
# Export full database (schema + data)
wrangler d1 export <db-name> --remote --output=./backup.sql

# Export data only (no schema)
wrangler d1 export <db-name> --remote --no-schema --output=./data-only.sql

# Export with foreign key constraints preserved
# (Default: foreign keys are disabled during export for import compatibility)

# Import SQL file
wrangler d1 execute <db-name> --remote --file=./backup.sql

# Limitations
# - BLOB data may not export correctly (use R2 for binary files)
# - Very large exports (>1GB) may timeout (split into chunks)
# - Import is NOT atomic (use batch() for transactional imports in Workers)
```

## Plan Tiers

| Feature | Free (Workers Free) | Paid (Workers Paid) |
|---------|---------------------|---------------------|
| Rows read | 5 million / day | First 25 billion / month included |
| Rows written | 100,000 / day | First 50 million / month included |
| Storage | 5 GB (total) | First 5 GB included |
| Database size | 500 MB | 10 GB |
| Batch size | 1,000 statements | 10,000 statements |
| Time Travel | 7 days | 30 days |
| Read replicas | ❌ | ✅ |
| Sessions API | ❌ | ✅ (up to 15 min) |
| Pricing | Free | $5/mo + usage |

**Usage pricing** (paid plans, beyond included allowances): $0.001 per million rows read + $1.00 per million rows written + $0.75/GB-mo storage

## Local Development

```bash
wrangler dev --persist-to=./.wrangler/state  # Persist across restarts
# Local DB: .wrangler/state/v3/d1/<database-id>.sqlite
sqlite3 .wrangler/state/v3/d1/<database-id>.sqlite  # Inspect

# Local dev uses free tier limits by default
```
