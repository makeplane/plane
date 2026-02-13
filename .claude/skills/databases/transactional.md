# Transactional (OLTP) Rules

> **Note:** Core naming conventions, workflow, and checklist are in `SKILL.md` or `db-design.md` (always loaded).

Guidelines for designing schemas for day-to-day business operations.

---

## Normalization Principles

### Prefer 3NF (Third Normal Form)

- Each table represents one clear entity/relationship
- No repeating information that can be referenced (use FK)
- Clear separation:
  - `orders` (header) vs `order_items` (line items)
  - `products` vs `product_variants`, `product_prices`

### Foreign Key Constraints

Use FK with appropriate ON DELETE / ON UPDATE:

```sql
-- Cascade: delete order → delete order_items
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE

-- Restrict: cannot delete user if orders exist
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

-- Set null: delete category → product.category_id = NULL
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
```

---

## Indexing Rules

### 1. Primary Key
- Usually `BIGINT` auto-increment or UUID
- Format: `PRIMARY KEY (id)`

### 2. Foreign Key Indexes
**IMPORTANT**: Create indexes for ALL foreign keys for efficient JOINs:
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 3. Frequently Filtered Columns
Index columns commonly used in WHERE:
- `status`, `created_at`, `updated_at`
- Code/reference columns: `order_number`, `sku`

### 4. Composite Indexes
Based on actual query patterns:
```sql
-- Query: WHERE user_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);

-- Query: WHERE store_id = ? AND created_at BETWEEN ...
CREATE INDEX idx_orders_store_created ON orders(store_id, created_at);
```

**Composite index rules:**
- Put columns with **high selectivity** (fewer duplicate values) first
- Avoid duplicate/redundant indexes
- Index should cover WHERE + ORDER BY of query

### 5. Unique Constraints
```sql
UNIQUE (order_number)
UNIQUE (sku)
UNIQUE (user_id, email)  -- compound unique
```

---

## Soft Delete Pattern

When you need to keep deleted data instead of permanently deleting:

```sql
-- Add deleted_at column
deleted_at TIMESTAMP NULL

-- Partial index for non-deleted records (PostgreSQL)
CREATE INDEX idx_orders_active ON orders(user_id, status)
    WHERE deleted_at IS NULL;

-- Query only active records
SELECT * FROM orders WHERE deleted_at IS NULL;
```

---

## Anti-patterns to Avoid

### Missing FK Index
```sql
-- ❌ BAD: FK without index → slow JOINs
FOREIGN KEY (user_id) REFERENCES users(id)
-- Forgot CREATE INDEX
```

### Over-indexing
```sql
-- ❌ BAD: Indexing each column separately
CREATE INDEX idx_a ON orders(user_id);
CREATE INDEX idx_b ON orders(status);
CREATE INDEX idx_c ON orders(created_at);

-- ✅ GOOD: Composite index based on query pattern
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
```

### Using TEXT instead of ENUM
```sql
-- ❌ BAD: Cannot validate values
status TEXT

-- ✅ GOOD: Use ENUM or CHECK
status ENUM('pending', 'confirmed', 'shipped', 'cancelled')
-- or
status VARCHAR(32) CHECK (status IN ('pending', 'confirmed', 'shipped'))
```

### Missing Audit Columns
```sql
-- ❌ BAD
CREATE TABLE products (id INT, name VARCHAR(255));

-- ✅ GOOD
CREATE TABLE products (
    id INT,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Example DDL

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (order_number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
```

---

## Checklist

- [ ] Audit columns: `created_at`, `updated_at`
- [ ] All FKs have indexes
- [ ] Unique constraints for business keys (`order_number`, `sku`, `email`)
- [ ] ENUM or CHECK for status/type columns
- [ ] Composite index based on main query patterns
- [ ] Soft delete if needed: `deleted_at` + partial index
