# D1 Cloudflare Rules

D1 is a SQLite-based database running on Cloudflare edge. Inherits from [sqlite.md](sqlite.md) with its own specifics.

---

## Important Limitations

| Limit | Value |
|-------|-------|
| Max database size | **10 GB** |
| Concurrent queries | Single-threaded (1 query/time) |
| Batch operations | No more than 100k rows/query |
| Max tables | No hard limit, but recommend < 100 |

**Throughput**: ~1000 queries/s if avg query = 1ms. Query 100ms = only 10 queries/s.

---

## Data Types

Same as SQLite:

| Storage Class | Use case |
|---------------|----------|
| `INTEGER` | PK, FK, counts, booleans |
| `REAL` | Floats, decimals |
| `TEXT` | Strings, dates, JSON |
| `BLOB` | Binary |

**Date/Time**: Store as `TEXT` with ISO format: `datetime('now')`

---

## Metadata Tables (REQUIRED)

D1 has no native comments. Need to create metadata tables:

```sql
CREATE TABLE metadata_tables (
    table_name TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE metadata_columns (
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    description TEXT NOT NULL,
    data_type TEXT,
    PRIMARY KEY (table_name, column_name),
    FOREIGN KEY (table_name) REFERENCES metadata_tables(table_name) ON DELETE CASCADE
);

-- After CREATE TABLE
INSERT INTO metadata_tables VALUES ('orders', 'Orders table', datetime('now'));
INSERT INTO metadata_columns VALUES
    ('orders', 'id', 'PK', 'INTEGER'),
    ('orders', 'status', 'pending|confirmed|shipped', 'TEXT');
```

---

## Foreign Keys

```sql
-- Enable FK (ON by default in D1, but should be explicit)
PRAGMA foreign_keys = ON;

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

## Best Practices

### Performance
- **Use indexes** - since single-threaded, queries must be fast
- **Batch writes** to reduce latency
- **Avoid large transactions** (>100k rows)
- **Pagination** with LIMIT/OFFSET or cursor-based

### Monitoring
- Track query duration
- Monitor database size
- Alert when approaching 10GB limit

---

## Example DDL

```sql
-- Enable FK
PRAGMA foreign_keys = ON;

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'cancelled')),
    total_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_updated ON orders(updated_at);

-- Metadata
INSERT INTO metadata_tables (table_name, description)
VALUES ('orders', 'Orders table');

INSERT INTO metadata_columns (table_name, column_name, description, data_type)
VALUES
    ('orders', 'id', 'PK', 'INTEGER'),
    ('orders', 'order_number', 'Unique order code', 'TEXT'),
    ('orders', 'status', 'pending|confirmed|shipped|cancelled', 'TEXT');
```

---

## Checklist

- [ ] Database size < 10GB
- [ ] Metadata tables for documentation
- [ ] Index for every query (single-threaded!)
- [ ] FK has index
- [ ] Batch operations < 100k rows
- [ ] Monitor size and query performance
