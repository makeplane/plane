# PostgreSQL Rules

Guidelines for designing schemas specific to PostgreSQL.

---

## Data Types

| Use case | Type | Notes |
|----------|------|-------|
| Primary key | `BIGSERIAL` | Auto-increment BIGINT |
| Primary key (small) | `SERIAL` | Auto-increment INT |
| Foreign key | Match with PK type | |
| Money/Price | `NUMERIC(18,2)` | Precise |
| Boolean | `BOOLEAN` | TRUE/FALSE/NULL |
| Short text | `VARCHAR(n)` or `TEXT` | TEXT has no limit |
| JSON | `JSONB` | **Queryable**, prefer over JSON |
| Timestamp | `TIMESTAMPTZ` | **Always use with timezone** |
| Date | `DATE` | |
| UUID | `UUID` | Native type |
| Array | `TEXT[]`, `INT[]` | |
| IP Address | `INET` | |

### TIMESTAMPTZ vs TIMESTAMP
**IMPORTANT**: Always use `TIMESTAMPTZ` to avoid timezone issues.

---

## Comments (NO metadata tables needed)

PostgreSQL supports `COMMENT ON`:

### Table comment
```sql
COMMENT ON TABLE orders IS 'Table storing customer orders';
```

### Column comments
```sql
COMMENT ON COLUMN orders.id IS 'Primary key, auto increment';
COMMENT ON COLUMN orders.order_number IS 'Unique order code, format: ORD-YYYYMMDD-XXXXX';
COMMENT ON COLUMN orders.status IS 'Status: pending|confirmed|shipped|cancelled';
```

### Query comments
```sql
-- Table comment
SELECT obj_description('orders'::regclass);

-- Column comments
SELECT
    c.column_name,
    pgd.description
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st
    ON c.table_schema = st.schemaname AND c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd
    ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
WHERE c.table_name = 'orders';
```

---

## Index Types

### B-Tree (default)
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
```

### Partial Index (very useful)
```sql
-- Only index non-deleted records
CREATE INDEX idx_orders_active ON orders(user_id, status)
    WHERE deleted_at IS NULL;

-- Only index pending orders
CREATE INDEX idx_orders_pending ON orders(created_at)
    WHERE status = 'pending';
```

### GIN (for JSONB, Arrays, Full-text)
```sql
CREATE INDEX idx_orders_metadata ON orders USING GIN(metadata);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Full-text search
CREATE INDEX idx_products_search ON products
    USING GIN(to_tsvector('english', name || ' ' || description));
```

### BRIN (for large tables with ordered data)
```sql
CREATE INDEX idx_logs_created ON logs USING BRIN(created_at);
```

---

## Sequences (Auto Increment)

```sql
-- SERIAL/BIGSERIAL auto-creates sequence
CREATE TABLE users (id BIGSERIAL PRIMARY KEY);

-- Identity columns (PostgreSQL 10+)
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

-- Custom sequence
CREATE SEQUENCE order_number_seq START 1000;
```

---

## Auto update timestamp (requires trigger)

PostgreSQL **does not have** `ON UPDATE CURRENT_TIMESTAMP`. Need to create trigger:

```sql
-- Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## ENUM Type

```sql
-- Create enum type
CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'shipped', 'cancelled', 'completed'
);

-- Use in table
CREATE TABLE orders (
    status order_status NOT NULL DEFAULT 'pending'
);

-- Add new value
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'completed';
```

**Note:** Cannot remove values from ENUM.

---

## Partitioning

### Range partitioning
```sql
CREATE TABLE fact_orders (
    id BIGSERIAL,
    order_date DATE NOT NULL,
    ...
) PARTITION BY RANGE (order_date);

CREATE TABLE fact_orders_2024 PARTITION OF fact_orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE fact_orders_default PARTITION OF fact_orders DEFAULT;
```

### Hash partitioning
```sql
CREATE TABLE logs PARTITION BY HASH (user_id);
CREATE TABLE logs_0 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE logs_1 PARTITION OF logs FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

---

## Example DDL

```sql
-- Create enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'cancelled');

-- Create table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_orders_number UNIQUE (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_orders_metadata ON orders USING GIN(metadata);

-- Comments
COMMENT ON TABLE orders IS 'Table storing order information';
COMMENT ON COLUMN orders.order_number IS 'Unique order code';
COMMENT ON COLUMN orders.status IS 'Order status';

-- Trigger for updated_at
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Checklist

- [ ] Use `TIMESTAMPTZ` instead of `TIMESTAMP`
- [ ] Use `JSONB` instead of `JSON`
- [ ] `COMMENT ON` for tables and columns
- [ ] Trigger for `updated_at`
- [ ] Partial indexes for soft delete / filtered queries
- [ ] GIN index for JSONB columns
