# SQLite Rules

Guidelines for designing schemas specific to SQLite.

---

## Data Types

SQLite has **dynamic typing**, with only 5 storage classes:

| Storage Class | Use case | Notes |
|---------------|----------|-------|
| `INTEGER` | PK, FK, counts, booleans | |
| `REAL` | Floats, decimals | |
| `TEXT` | Strings, dates, JSON, enums | |
| `BLOB` | Binary data | |
| `NULL` | Null values | |

### Type affinity
SQLite does not strictly enforce types. Type declaration is just a "hint":
```sql
-- All of these will be stored
CREATE TABLE test (price REAL);
INSERT INTO test VALUES (100);      -- Stored as INTEGER
INSERT INTO test VALUES (99.99);    -- Stored as REAL
INSERT INTO test VALUES ('free');   -- Stored as TEXT (!)
```

### Date/Time
SQLite **does not have** DATE/TIME type. Store as TEXT with ISO format:
```sql
created_at TEXT DEFAULT (datetime('now'))
-- Format: YYYY-MM-DD HH:MM:SS
```

---

## Metadata Tables (REQUIRED)

SQLite **does not support comments** on tables and columns. Need to create metadata tables:

### Create metadata tables

```sql
CREATE TABLE IF NOT EXISTS metadata_tables (
    table_name TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metadata_columns (
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    description TEXT NOT NULL,
    data_type TEXT,
    is_nullable INTEGER DEFAULT 1,  -- 0=NOT NULL, 1=NULL
    default_value TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (table_name, column_name),
    FOREIGN KEY (table_name) REFERENCES metadata_tables(table_name) ON DELETE CASCADE
);

CREATE INDEX idx_metadata_columns_table ON metadata_columns(table_name);
```

### Insert metadata after creating table

```sql
-- Table metadata
INSERT INTO metadata_tables (table_name, description)
VALUES ('orders', 'Table storing customer order information');

-- Column metadata
INSERT INTO metadata_columns (table_name, column_name, description, data_type, is_nullable)
VALUES
    ('orders', 'id', 'Primary key, auto increment', 'INTEGER', 0),
    ('orders', 'order_number', 'Unique order code', 'TEXT', 0),
    ('orders', 'user_id', 'FK to users.id', 'INTEGER', 0),
    ('orders', 'status', 'pending|confirmed|shipped|cancelled', 'TEXT', 0),
    ('orders', 'total_amount', 'Total value', 'REAL', 0);
```

### Query metadata

```sql
-- View schema with descriptions
SELECT
    t.table_name,
    t.description AS table_description,
    c.column_name,
    c.description AS column_description,
    c.data_type
FROM metadata_tables t
LEFT JOIN metadata_columns c ON t.table_name = c.table_name
ORDER BY t.table_name, c.column_name;
```

---

## Auto Increment

```sql
-- Option 1: INTEGER PRIMARY KEY (recommended)
-- SQLite auto-increments INTEGER PRIMARY KEY automatically
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT
);

-- Option 2: AUTOINCREMENT keyword
-- Ensures deleted IDs are not reused (slower)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
```

---

## Foreign Keys

**IMPORTANT**: FK is disabled by default in SQLite!

```sql
-- Enable FK for each connection
PRAGMA foreign_keys = ON;

-- Create table with FK
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Create index for FK
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

## ENUM substitute

SQLite does not have ENUM. Use CHECK constraint:

```sql
CREATE TABLE orders (
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipped', 'cancelled'))
);
```

---

## Index Types

SQLite only supports B-Tree indexes:

```sql
-- Standard index
CREATE INDEX idx_orders_status ON orders(status);

-- Composite index
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Unique index
CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);

-- Partial index (SQLite 3.8.0+)
CREATE INDEX idx_orders_active ON orders(user_id)
    WHERE deleted_at IS NULL;
```

---

## Limitations

| Feature | Status | Workaround |
|---------|--------|------------|
| `ALTER COLUMN` | ❌ Not supported | Recreate table |
| `DROP COLUMN` | ✅ SQLite 3.35+ | Recreate table (older) |
| Comments | ❌ Not supported | Metadata tables |
| ENUM | ❌ Not supported | CHECK constraint |
| Stored procedures | ❌ Not supported | App logic |
| Concurrent writes | ⚠️ Limited | Single writer |

---

## Example DDL

```sql
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipped', 'cancelled')),
    subtotal REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes
CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_updated ON orders(updated_at);

-- Metadata
INSERT INTO metadata_tables (table_name, description)
VALUES ('orders', 'Table storing order information');

INSERT INTO metadata_columns (table_name, column_name, description, data_type, is_nullable)
VALUES
    ('orders', 'id', 'Primary key', 'INTEGER', 0),
    ('orders', 'order_number', 'Unique order code', 'TEXT', 0),
    ('orders', 'user_id', 'FK to users.id', 'INTEGER', 0),
    ('orders', 'status', 'pending|confirmed|shipped|cancelled', 'TEXT', 0),
    ('orders', 'total_amount', 'Total payment', 'REAL', 0);
```

---

## Checklist

- [ ] `PRAGMA foreign_keys = ON` at start of each connection
- [ ] Metadata tables created
- [ ] INSERT metadata after each CREATE TABLE
- [ ] Use `TEXT` for dates (ISO format: YYYY-MM-DD HH:MM:SS)
- [ ] CHECK constraint instead of ENUM
- [ ] Index for FK columns
- [ ] Update metadata when ALTER/DROP table
