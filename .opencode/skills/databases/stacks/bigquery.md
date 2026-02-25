# BigQuery Rules

Guidelines for designing schemas specific to Google BigQuery.

---

## Data Types

| Use case | Type | Notes |
|----------|------|-------|
| Integer | `INT64` | |
| Decimal | `NUMERIC` or `BIGNUMERIC` | |
| Float | `FLOAT64` | |
| Boolean | `BOOL` | |
| String | `STRING` | |
| Timestamp | `TIMESTAMP` | |
| Date | `DATE` | |
| Time | `TIME` | |
| DateTime | `DATETIME` | No timezone |
| JSON | `JSON` | |
| Bytes | `BYTES` | |
| Nested | `STRUCT` | Record type |
| Repeated | `ARRAY` | |

---

## Description (NO metadata tables needed)

BigQuery supports description via `OPTIONS`:

### Table description
```sql
CREATE TABLE orders (
    ...
) OPTIONS(description='Table storing customer orders');
```

### Column descriptions
```sql
CREATE TABLE orders (
    id INT64 NOT NULL OPTIONS(description='Primary key'),
    order_number STRING NOT NULL OPTIONS(description='Unique order code'),
    status STRING NOT NULL OPTIONS(description='pending|confirmed|shipped|cancelled'),
    total_amount NUMERIC OPTIONS(description='Total value')
);
```

### Query descriptions
```sql
SELECT column_name, description
FROM `project.dataset.INFORMATION_SCHEMA.COLUMN_FIELD_PATHS`
WHERE table_name = 'orders';
```

---

## Partitioning & Clustering

BigQuery **does not have traditional indexes**. Instead, use partitioning and clustering:

### Partitioning (required for large tables)

```sql
-- Partition by date column
CREATE TABLE fact_orders (
    order_date DATE,
    customer_id INT64,
    order_id INT64,
    amount NUMERIC
)
PARTITION BY order_date;

-- Partition by timestamp (daily)
CREATE TABLE events (
    event_time TIMESTAMP,
    ...
)
PARTITION BY DATE(event_time);

-- Integer range partitioning
CREATE TABLE logs (
    log_id INT64,
    ...
)
PARTITION BY RANGE_BUCKET(log_id, GENERATE_ARRAY(0, 1000000, 10000));
```

### Clustering (optimize filter/group)

```sql
CREATE TABLE fact_orders (
    order_date DATE,
    customer_id INT64,
    product_id INT64,
    store_id INT64,
    amount NUMERIC
)
PARTITION BY order_date
CLUSTER BY customer_id, product_id;
-- Can cluster up to 4 columns
```

### When to use what?
- **Partition**: Filter by date range → reduces data scan
- **Cluster**: Filter/Group by specific columns → data is organized closer together

---

## Nested & Repeated Fields (Denormalization)

BigQuery encourages denormalization with STRUCT and ARRAY:

```sql
CREATE TABLE orders (
    order_id INT64,
    order_date DATE,
    customer STRUCT<
        id INT64,
        name STRING,
        email STRING
    >,
    items ARRAY<STRUCT<
        product_id INT64,
        product_name STRING,
        quantity INT64,
        unit_price NUMERIC
    >>
);

-- Query nested fields
SELECT
    order_id,
    customer.name,
    item.product_name,
    item.quantity
FROM orders, UNNEST(items) AS item;
```

---

## Best Practices

### Query optimization
- **Avoid `SELECT *`** - only select needed columns
- **Filter early** - use partition column in WHERE
- **Avoid cross-join** with large tables

### Table design
- Partition tables > 1GB
- Cluster by frequently filtered/grouped columns
- Denormalize with STRUCT/ARRAY when appropriate
- Avoid too many small tables

### Cost control
- Partition pruning: always filter by partition column
- Use `--dry_run` to estimate cost
- Set up query quotas

---

## Example DDL

```sql
CREATE TABLE `project.dataset.fact_orders` (
    -- Keys
    order_id INT64 NOT NULL OPTIONS(description='PK from source'),
    order_date DATE NOT NULL OPTIONS(description='Order date'),

    -- Dimensions (denormalized)
    customer_id INT64 NOT NULL,
    customer_name STRING,
    customer_segment STRING OPTIONS(description='VIP|Regular|New'),

    -- Measures
    item_count INT64 NOT NULL,
    gross_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL,

    -- Nested items
    items ARRAY<STRUCT<
        product_id INT64,
        product_name STRING,
        quantity INT64,
        unit_price NUMERIC
    >> OPTIONS(description='Product details in order'),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY order_date
CLUSTER BY customer_id
OPTIONS(
    description='Fact table for orders, partitioned by date, clustered by customer'
);
```

---

## Scheduled Queries / Materialized Views

### Materialized View
```sql
CREATE MATERIALIZED VIEW `project.dataset.mv_daily_sales`
PARTITION BY report_date
CLUSTER BY store_id
AS
SELECT
    DATE(order_date) as report_date,
    store_id,
    COUNT(*) as order_count,
    SUM(net_amount) as revenue
FROM `project.dataset.fact_orders`
GROUP BY 1, 2;
```

### Scheduled Query (ETL)
Create via BigQuery Console or API with schedule expression.

---

## Checklist

- [ ] Partition large tables by date column
- [ ] Cluster by frequently filtered/grouped columns (max 4)
- [ ] `OPTIONS(description=...)` for tables and columns
- [ ] Denormalize with STRUCT/ARRAY when appropriate
- [ ] Avoid `SELECT *` and cross-join large tables
- [ ] Filter by partition column in queries
- [ ] Consider Materialized Views for frequently used aggregations
