# Analytics (OLAP) Rules

> **Note:** Core naming conventions, workflow, and checklist are in `SKILL.md` or `db-design.md` (always loaded).

Guidelines for designing schemas for statistics and reporting tables.

---

## General Principles

- **Separate** from transactional tables - don't mix analytics logic into business tables
- When heavy analytics queries/aggregations repeat → create separate tables
- Use **Star Schema**: Fact tables at center, Dimension tables around

---

## Design Process

### 1. Analyze Statistics Requirements

Ask user to clarify:
- **Analysis dimensions**: by date, by customer, by product, by channel, by region?
- **Granularity**: per order, per item, per day, per month?
- **Metrics**: order_count, revenue, margin, conversion_rate, avg_order_value?

### 2. Define Fact Granularity

**Important**: What does 1 row in fact table represent?

| Fact Table | Granularity | Use case |
|------------|-------------|----------|
| `fact_orders` | 1 row = 1 order | Statistics by order |
| `fact_order_items` | 1 row = 1 order item | Statistics by product |
| `fact_daily_sales` | 1 row = 1 day + store | Daily summary |

### 3. Identify Required Dimensions

Create separate dim table when:
- Reused in multiple places
- Has many descriptive attributes
- Subject to slow changes (Slowly Changing Dimension)

---

## Fact Tables

### Fact table structure

```sql
CREATE TABLE fact_orders (
    fact_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    -- Dimension keys
    date_key INT NOT NULL,              -- FK to dim_date
    customer_key BIGINT NOT NULL,       -- FK to dim_customer
    store_key INT,
    channel_key INT,
    -- Degenerate dimensions (no separate dim needed)
    order_id BIGINT NOT NULL,
    order_number VARCHAR(50),
    -- Measures
    item_count INT NOT NULL,
    gross_amount DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    net_amount DECIMAL(18,2) NOT NULL,

    INDEX idx_fact_orders_date (date_key),
    INDEX idx_fact_orders_customer (customer_key),
    INDEX idx_fact_orders_date_store (date_key, store_key)
);
```

---

## Dimension Tables

### dim_date (required for every analytics schema)

```sql
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,           -- Format: YYYYMMDD (20241215)
    full_date DATE NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL,               -- 1-4
    month INT NOT NULL,                 -- 1-12
    month_name VARCHAR(20),             -- 'January', 'February'
    week_of_year INT NOT NULL,
    day_of_month INT NOT NULL,
    day_of_week INT NOT NULL,           -- 1=Monday, 7=Sunday
    day_name VARCHAR(20),
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,

    UNIQUE (full_date)
);
-- Pre-populate for multiple years (2020-2030)
```

### dim_customer

```sql
CREATE TABLE dim_customer (
    customer_key BIGINT PRIMARY KEY AUTO_INCREMENT,  -- Surrogate key
    customer_id BIGINT NOT NULL,                     -- Natural key from users
    customer_name VARCHAR(255),
    email VARCHAR(255),
    segment VARCHAR(50),                -- 'VIP', 'Regular', 'New'
    city VARCHAR(100),
    region VARCHAR(100),
    first_order_date DATE,
    -- SCD Type 2 columns (if history needed)
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN DEFAULT TRUE,

    INDEX idx_dim_customer_id (customer_id),
    INDEX idx_dim_customer_current (is_current, customer_id)
);
```

---

## Summary Tables (Pre-aggregated)

When pre-aggregation needed for dashboard performance:

```sql
CREATE TABLE summary_daily_sales (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_key INT NOT NULL,
    store_key INT,
    channel_key INT,
    -- Pre-aggregated measures
    order_count INT NOT NULL,
    item_count INT NOT NULL,
    gross_revenue DECIMAL(18,2) NOT NULL,
    net_revenue DECIMAL(18,2) NOT NULL,
    unique_customers INT NOT NULL,
    avg_order_value DECIMAL(18,2),

    UNIQUE (date_key, store_key, channel_key),
    INDEX idx_summary_date (date_key)
);
```

---

## Slowly Changing Dimensions (SCD)

### Type 1 - Overwrite
Overwrite old value, no history kept:
```sql
UPDATE dim_customer SET segment = 'VIP' WHERE customer_id = 123;
```

### Type 2 - Add new row (Recommended when history needed)
```sql
-- 1. Close old row
UPDATE dim_customer
SET effective_to = CURRENT_DATE - 1, is_current = FALSE
WHERE customer_id = 123 AND is_current = TRUE;

-- 2. Add new row
INSERT INTO dim_customer (customer_id, segment, effective_from, is_current)
VALUES (123, 'VIP', CURRENT_DATE, TRUE);
```

---

## Indexing for Analytics

### Fact tables
- Index FKs to dimensions: `date_key`, `customer_key`, `product_key`
- Composite index based on query patterns: `INDEX (date_key, store_key)`

### Dimension tables
- PK: surrogate key
- Index natural key: `customer_id`, `product_id`
- Index for SCD: `(is_current, customer_id)`

---

## Naming Convention

- Fact tables: `fact_*` or `fct_*`
- Dimension tables: `dim_*`
- Summary tables: `summary_*` or `agg_*`

---

## Checklist

- [ ] Granularity defined for each fact table
- [ ] dim_date exists or created (pre-populate multiple years)
- [ ] Surrogate keys for dimensions
- [ ] Index FKs in fact tables
- [ ] SCD strategy for changing dimensions (Type 1 or Type 2)
- [ ] Naming: `fact_*`, `dim_*`, `summary_*`
- [ ] Refresh strategy: see [incremental-etl.md](incremental-etl.md)
