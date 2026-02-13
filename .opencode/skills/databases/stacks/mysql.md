# MySQL Rules

Guidelines for designing schemas specific to MySQL / MariaDB.

---

## Data Types

| Use case | Type | Notes |
|----------|------|-------|
| Primary key | `BIGINT UNSIGNED AUTO_INCREMENT` | For large tables |
| Primary key (small) | `INT UNSIGNED AUTO_INCREMENT` | Tables < 2 billion rows |
| Foreign key | Match with PK type | |
| Money/Price | `DECIMAL(18,2)` | **Do NOT use FLOAT/DOUBLE** |
| Quantity | `INT` or `DECIMAL(18,4)` | |
| Boolean | `TINYINT(1)` or `BOOLEAN` | |
| Short text | `VARCHAR(n)` | n ≤ 255 for indexing |
| Long text | `TEXT` | Cannot index directly |
| JSON | `JSON` | MySQL 5.7+ |
| Timestamp | `DATETIME` or `TIMESTAMP` | |
| Date | `DATE` | |
| UUID | `CHAR(36)` or `BINARY(16)` | |

### TIMESTAMP vs DATETIME
- `TIMESTAMP`: Auto-converts timezone, range 1970-2038
- `DATETIME`: No timezone conversion, range 1000-9999

---

## Comments (NO metadata tables needed)

MySQL supports comments directly in DDL:

### Table comment
```sql
CREATE TABLE orders (
    ...
) COMMENT='Table storing customer orders';
```

### Column comment
```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
        COMMENT 'Primary key, auto increment',
    order_number VARCHAR(50) NOT NULL
        COMMENT 'Unique order code, format: ORD-YYYYMMDD-XXXXX',
    status VARCHAR(32) NOT NULL DEFAULT 'pending'
        COMMENT 'Status: pending|confirmed|shipped|cancelled',
    total_amount DECIMAL(18,2) NOT NULL
        COMMENT 'Total value including tax'
);
```

### Query comments
```sql
-- Table comment
SELECT TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'your_db' AND TABLE_NAME = 'orders';

-- Column comments
SELECT COLUMN_NAME, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'your_db' AND TABLE_NAME = 'orders';
```

---

## Index Types

### B-Tree (default)
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);
```

### FULLTEXT (text search)
```sql
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);

-- Query
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('gaming laptop' IN NATURAL LANGUAGE MODE);
```

### Notes
- **Partial index**: Not natively supported in MySQL
- Index prefix for TEXT: `CREATE INDEX idx ON table(col(255))`

---

## Auto Increment

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
);

-- Set starting value
ALTER TABLE users AUTO_INCREMENT = 1000;

-- Get last inserted ID
SELECT LAST_INSERT_ID();
```

---

## Auto update timestamp

```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

---

## ENUM vs VARCHAR

### Use ENUM when values are fixed and rarely change
```sql
status ENUM('pending', 'confirmed', 'shipped', 'cancelled') NOT NULL DEFAULT 'pending'
```

### Use VARCHAR + CHECK when flexibility needed
```sql
status VARCHAR(32) NOT NULL DEFAULT 'pending',
CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'confirmed', 'shipped'))
```

---

## Foreign Keys

```sql
CREATE TABLE order_items (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,

    CONSTRAINT fk_orderitems_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_orderitems_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT
);

-- IMPORTANT: Index for FK
CREATE INDEX idx_orderitems_order ON order_items(order_id);
CREATE INDEX idx_orderitems_product ON order_items(product_id);
```

**Note:** FK only works with **InnoDB** engine.

---

## Partitioning

### Range partitioning (by date)
```sql
CREATE TABLE fact_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_date DATE NOT NULL,
    ...
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

---

## Example DDL

```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
        COMMENT 'Primary key',
    order_number VARCHAR(50) NOT NULL
        COMMENT 'Unique order code',
    user_id BIGINT UNSIGNED NOT NULL
        COMMENT 'FK to users.id',
    status ENUM('pending', 'confirmed', 'shipped', 'cancelled', 'completed')
        NOT NULL DEFAULT 'pending'
        COMMENT 'Order status',
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_orders_number (order_number),
    KEY idx_orders_user (user_id),
    KEY idx_orders_status (status),
    KEY idx_orders_user_status_created (user_id, status, created_at DESC),

    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Table storing order information';
```

---

## Checklist

- [ ] Engine: `InnoDB` (required for FK)
- [ ] Charset: `utf8mb4` + `utf8mb4_unicode_ci`
- [ ] Comments for tables and columns
- [ ] All FKs have indexes
- [ ] Use `DECIMAL` for money, not `FLOAT`
- [ ] `ON UPDATE CURRENT_TIMESTAMP` for `updated_at`
