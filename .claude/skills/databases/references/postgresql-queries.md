# PostgreSQL SQL Queries

SQL queries in PostgreSQL: SELECT, JOINs, subqueries, CTEs, window functions, and advanced patterns.

## Basic SELECT

### Simple Queries
```sql
-- Select all columns
SELECT * FROM users;

-- Select specific columns
SELECT id, name, email FROM users;

-- With alias
SELECT name AS full_name, email AS contact_email FROM users;

-- Distinct values
SELECT DISTINCT status FROM orders;

-- Count rows
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT status) FROM orders;
```

### WHERE Clause
```sql
-- Equality
SELECT * FROM users WHERE status = 'active';

-- Comparison
SELECT * FROM products WHERE price > 100;
SELECT * FROM orders WHERE total BETWEEN 100 AND 500;

-- Pattern matching
SELECT * FROM users WHERE email LIKE '%@example.com';
SELECT * FROM users WHERE name ILIKE 'john%';  -- case-insensitive

-- IN operator
SELECT * FROM orders WHERE status IN ('pending', 'processing');

-- NULL checks
SELECT * FROM users WHERE deleted_at IS NULL;
SELECT * FROM users WHERE phone_number IS NOT NULL;

-- Logical operators
SELECT * FROM products WHERE price > 100 AND stock > 0;
SELECT * FROM users WHERE status = 'active' OR verified = true;
SELECT * FROM products WHERE NOT (price > 1000);
```

### ORDER BY
```sql
-- Ascending (default)
SELECT * FROM users ORDER BY created_at;

-- Descending
SELECT * FROM users ORDER BY created_at DESC;

-- Multiple columns
SELECT * FROM orders ORDER BY status ASC, created_at DESC;

-- NULL handling
SELECT * FROM users ORDER BY last_login NULLS FIRST;
SELECT * FROM users ORDER BY last_login NULLS LAST;
```

### LIMIT and OFFSET
```sql
-- Limit results
SELECT * FROM users LIMIT 10;

-- Pagination
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- Alternative: FETCH
SELECT * FROM users OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

## JOINs

### INNER JOIN
```sql
-- Match rows from both tables
SELECT orders.id, orders.total, customers.name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;

-- Short syntax
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Multiple joins
SELECT o.id, c.name, p.name AS product
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id;
```

### LEFT JOIN (LEFT OUTER JOIN)
```sql
-- All rows from left table, matching rows from right
SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;

-- Find customers without orders
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
```

### RIGHT JOIN (RIGHT OUTER JOIN)
```sql
-- All rows from right table, matching rows from left
SELECT c.name, o.id AS order_id
FROM orders o
RIGHT JOIN customers c ON o.customer_id = c.id;
```

### FULL OUTER JOIN
```sql
-- All rows from both tables
SELECT c.name, o.id AS order_id
FROM customers c
FULL OUTER JOIN orders o ON c.id = o.customer_id;
```

### CROSS JOIN
```sql
-- Cartesian product (all combinations)
SELECT c.name, p.name
FROM colors c
CROSS JOIN products p;
```

### Self Join
```sql
-- Join table to itself
SELECT e1.name AS employee, e2.name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;
```

## Subqueries

### Scalar Subquery
```sql
-- Return single value
SELECT name, salary,
  (SELECT AVG(salary) FROM employees) AS avg_salary
FROM employees;
```

### IN Subquery
```sql
-- Match against set of values
SELECT name FROM customers
WHERE id IN (
  SELECT customer_id FROM orders WHERE total > 1000
);
```

### EXISTS Subquery
```sql
-- Check if subquery returns any rows
SELECT name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- NOT EXISTS
SELECT name FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
```

### Correlated Subquery
```sql
-- Subquery references outer query
SELECT name, salary FROM employees e1
WHERE salary > (
  SELECT AVG(salary) FROM employees e2
  WHERE e2.department_id = e1.department_id
);
```

## Common Table Expressions (CTEs)

### Simple CTE
```sql
-- Named temporary result set
WITH active_users AS (
  SELECT id, name, email FROM users WHERE status = 'active'
)
SELECT * FROM active_users WHERE created_at > '2024-01-01';
```

### Multiple CTEs
```sql
WITH
  active_customers AS (
    SELECT id, name FROM customers WHERE active = true
  ),
  recent_orders AS (
    SELECT customer_id, SUM(total) AS total_spent
    FROM orders
    WHERE order_date > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
  )
SELECT c.name, COALESCE(o.total_spent, 0) AS spent
FROM active_customers c
LEFT JOIN recent_orders o ON c.id = o.customer_id;
```

### Recursive CTE
```sql
-- Tree traversal, hierarchical data
WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT id, name, parent_id, 0 AS level
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive case: child categories
  SELECT c.id, c.name, c.parent_id, ct.level + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;

-- Employee hierarchy
WITH RECURSIVE org_chart AS (
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, oc.level + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart;
```

## Aggregate Functions

### Basic Aggregates
```sql
-- COUNT, SUM, AVG, MIN, MAX
SELECT
  COUNT(*) AS total_orders,
  SUM(total) AS total_revenue,
  AVG(total) AS avg_order_value,
  MIN(total) AS min_order,
  MAX(total) AS max_order
FROM orders;

-- COUNT variations
SELECT COUNT(*) FROM users;              -- All rows
SELECT COUNT(phone_number) FROM users;   -- Non-NULL values
SELECT COUNT(DISTINCT status) FROM orders; -- Unique values
```

### GROUP BY
```sql
-- Aggregate by groups
SELECT status, COUNT(*) AS count
FROM orders
GROUP BY status;

-- Multiple grouping columns
SELECT customer_id, status, COUNT(*) AS count
FROM orders
GROUP BY customer_id, status;

-- With aggregate functions
SELECT customer_id,
  COUNT(*) AS order_count,
  SUM(total) AS total_spent,
  AVG(total) AS avg_order
FROM orders
GROUP BY customer_id;
```

### HAVING
```sql
-- Filter after aggregation
SELECT customer_id, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 1000;

-- Multiple conditions
SELECT status, COUNT(*) AS count
FROM orders
GROUP BY status
HAVING COUNT(*) > 10;
```

## Window Functions

### ROW_NUMBER
```sql
-- Assign unique number to each row
SELECT id, name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- Partition by group
SELECT id, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;
```

### RANK / DENSE_RANK
```sql
-- RANK: gaps in ranking for ties
-- DENSE_RANK: no gaps
SELECT id, name, salary,
  RANK() OVER (ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;
```

### LAG / LEAD
```sql
-- Access previous/next row
SELECT date, revenue,
  LAG(revenue) OVER (ORDER BY date) AS prev_revenue,
  LEAD(revenue) OVER (ORDER BY date) AS next_revenue,
  revenue - LAG(revenue) OVER (ORDER BY date) AS change
FROM daily_sales;
```

### Running Totals
```sql
-- Cumulative sum
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;

-- Simpler syntax
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;
```

### Moving Averages
```sql
-- 7-day moving average
SELECT date, value,
  AVG(value) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg_7d
FROM metrics;
```

## Advanced Patterns

### CASE Expressions
```sql
-- Simple CASE
SELECT name,
  CASE status
    WHEN 'active' THEN 'Active User'
    WHEN 'pending' THEN 'Pending Verification'
    ELSE 'Inactive'
  END AS status_label
FROM users;

-- Searched CASE
SELECT name, age,
  CASE
    WHEN age < 18 THEN 'Minor'
    WHEN age BETWEEN 18 AND 65 THEN 'Adult'
    ELSE 'Senior'
  END AS age_group
FROM users;
```

### COALESCE
```sql
-- Return first non-NULL value
SELECT name, COALESCE(phone_number, email, 'No contact') AS contact
FROM users;
```

### NULLIF
```sql
-- Return NULL if values equal
SELECT name, NULLIF(status, 'deleted') AS active_status
FROM users;
```

### Array Operations
```sql
-- Array aggregate
SELECT customer_id, ARRAY_AGG(product_id) AS products
FROM order_items
GROUP BY customer_id;

-- Unnest array
SELECT unnest(ARRAY[1, 2, 3, 4, 5]);

-- Array contains
SELECT * FROM products WHERE tags @> ARRAY['featured'];
```

### JSON Operations
```sql
-- Query JSON/JSONB
SELECT data->>'name' AS name FROM documents;
SELECT data->'address'->>'city' AS city FROM documents;

-- Check key exists
SELECT * FROM documents WHERE data ? 'email';

-- JSONB operators
SELECT * FROM documents WHERE data @> '{"status": "active"}';

-- JSON aggregation
SELECT json_agg(name) FROM users;
SELECT json_object_agg(id, name) FROM users;
```

## Set Operations

### UNION
```sql
-- Combine results (removes duplicates)
SELECT name FROM customers
UNION
SELECT name FROM suppliers;

-- Keep duplicates
SELECT name FROM customers
UNION ALL
SELECT name FROM suppliers;
```

### INTERSECT
```sql
-- Common rows
SELECT email FROM users
INTERSECT
SELECT email FROM subscribers;
```

### EXCEPT
```sql
-- Rows in first query but not second
SELECT email FROM users
EXCEPT
SELECT email FROM unsubscribed;
```

## Best Practices

1. **Use indexes** on WHERE, JOIN, ORDER BY columns
2. **Avoid SELECT *** - specify needed columns
3. **Use EXISTS** instead of IN for large subqueries
4. **Filter early** - WHERE before JOIN when possible
5. **Use CTEs** for readability over nested subqueries
6. **Parameterize queries** - prevent SQL injection
7. **Use window functions** instead of self-joins
8. **Test with EXPLAIN** - analyze query plans
