---
title: Evolve Schemas Safely with Transactional and Concurrent DDL
impact: HIGH
impactDescription: avoids table rewrites and write-blocking outages during migrations
tags: schema, migrations, ddl, locking
---

## Evolve Schemas Safely with Transactional and Concurrent DDL

Most Postgres DDL is transactional and several operations have non-blocking variants — use them
to make schema changes safe to run against a live production table.

**Incorrect (blocking, non-transactional, or rewrite-triggering changes):**

```sql
-- Blocks all reads/writes on the table while building
CREATE INDEX users_email_idx ON users (email);

-- Volatile default forces a full table rewrite
ALTER TABLE users ADD COLUMN uuid_col uuid NOT NULL DEFAULT gen_random_uuid();

-- No way to test/rollback before committing
ALTER TABLE users DROP COLUMN legacy_field;
```

**Correct (concurrent, transactional, staged changes):**

```sql
-- Index creation without blocking writes (cannot run inside a transaction)
CREATE INDEX CONCURRENTLY users_email_idx ON users (email);

-- Test destructive DDL safely — most DDL can be rolled back
BEGIN;
ALTER TABLE users DROP COLUMN legacy_field;
-- inspect results here
ROLLBACK;  -- or COMMIT once verified

-- Constraints before columns: drop the constraint, then the column
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders DROP COLUMN status;
```

Rules of thumb:

- **`CREATE INDEX CONCURRENTLY`** avoids blocking writes but cannot run inside a transaction block
  and requires cleanup of any invalid index left behind by a failed run.
- **Transactional DDL**: `BEGIN; ALTER TABLE ...; ROLLBACK;` lets you validate a destructive change
  before committing to it.
- **Volatile defaults rewrite the table**: adding a `NOT NULL` column with a volatile default
  (`now()`, `gen_random_uuid()`) rewrites every row. Non-volatile defaults (constants) are fast,
  metadata-only changes on modern Postgres.
- **Drop constraints before the columns they reference** to avoid dependency errors.
- **`CREATE OR REPLACE FUNCTION` with a different signature creates an overload**, it does not
  replace the existing function — `DROP FUNCTION` first if you don't want both to exist.
- For genuinely large backfills, prefer the add-nullable-column → backfill in batches →
  add-constraint sequence over a single blocking `ALTER TABLE ... NOT NULL`.

Reference: [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
