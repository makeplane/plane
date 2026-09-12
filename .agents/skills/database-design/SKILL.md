---
name: database-design
description: Design robust, scalable database schemas for SQL and NoSQL databases, and choose the right database/ORM for the job. Provides database and ORM selection decision trees, normalization guidelines, indexing strategies, migration patterns, constraint design, and performance optimization. Ensures data integrity, query performance, and maintainable data models.
license: MIT
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion]
harness: universal
---

# Database Design

Design production-ready database schemas with best practices built-in — from choosing a database and ORM through schema design, indexing, migrations, and optimization.

---

## Quick Start

Just describe your data model:

```
design a schema for an e-commerce platform with users, products, orders
```

You'll get a complete SQL schema like:

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  INDEX idx_orders_user (user_id)
);
```

**What to include in your request:**
- Entities (users, products, orders)
- Key relationships (users have orders, orders have items)
- Scale hints (high-traffic, millions of records)
- Database preference (SQL/NoSQL) - defaults to SQL if not specified

---

## Core Principle

> **Learn to THINK, not copy SQL patterns.**

- ASK the user for database/ORM preferences when unclear — don't default to PostgreSQL/Prisma for everything
- Choose database and ORM based on CONTEXT (deployment target, scale, access pattern)
- Model the domain first; schema design is a downstream decision, not the starting point

---

## Triggers

| Trigger | Example |
|---------|---------|
| `design schema` | "design a schema for user authentication" |
| `database design` | "database design for multi-tenant SaaS" |
| `create tables` | "create tables for a blog system" |
| `schema for` | "schema for inventory management" |
| `model data` | "model data for real-time analytics" |
| `I need a database` | "I need a database for tracking orders" |
| `design NoSQL` | "design NoSQL schema for product catalog" |
| `which database` / `which ORM` | "which database should I use for an edge app?" |

---

## Choosing Your Database & ORM

Before designing schema, decide the platform. Don't default to PostgreSQL/Prisma for everything — ask about deployment environment, query complexity, edge/serverless needs, and scale.

### Database Selection

```
What are your requirements?
│
├── Full relational features needed
│   ├── Self-hosted → PostgreSQL
│   └── Serverless → Neon, Supabase
│
├── Edge deployment / Ultra-low latency
│   └── Turso (edge SQLite)
│
├── AI / Vector search
│   └── PostgreSQL + pgvector
│
├── Simple / Embedded / Local
│   └── SQLite
│
└── Global distribution
    └── PlanetScale, CockroachDB, Turso
```

| Database | Best For | Trade-offs |
|----------|----------|------------|
| **PostgreSQL** | Full features, complex queries | Needs hosting |
| **Neon** | Serverless PG, branching | PG complexity — see the `neon-postgres` skill for Neon-specific connection/branching patterns |
| **Turso** | Edge, low latency | SQLite limitations |
| **SQLite** | Simple, embedded, local | Single-writer |
| **PlanetScale** | MySQL, global scale | No foreign keys |

### ORM Selection

```
What's the context?
│
├── Edge deployment / Bundle size matters
│   └── Drizzle (smallest, SQL-like)
│
├── Best DX / Schema-first
│   └── Prisma (migrations, studio) — see the `prisma-expert` skill for deep Prisma guidance
│
├── Maximum control
│   └── Raw SQL with query builder
│
└── Python ecosystem
    └── SQLAlchemy 2.0 (async support)
```

| ORM | Best For | Trade-offs |
|-----|----------|------------|
| **Drizzle** | Edge, TypeScript | Newer, less examples |
| **Prisma** | DX, schema management | Heavier, not edge-ready |
| **Kysely** | Type-safe SQL builder | Manual migrations |
| **Raw SQL** | Complex queries, control | Manual type safety |

### Decision Checklist

- [ ] Asked user about database preference?
- [ ] Chosen database for THIS context?
- [ ] Considered deployment environment?
- [ ] Planned index strategy?
- [ ] Defined relationship types?

---

## Key Terms

| Term | Definition |
|------|------------|
| **Normalization** | Organizing data to reduce redundancy (1NF → 2NF → 3NF) |
| **3NF** | Third Normal Form - no transitive dependencies between columns |
| **OLTP** | Online Transaction Processing - write-heavy, needs normalization |
| **OLAP** | Online Analytical Processing - read-heavy, benefits from denormalization |
| **Foreign Key (FK)** | Column that references another table's primary key |
| **Index** | Data structure that speeds up queries (at cost of slower writes) |
| **Access Pattern** | How your app reads/writes data (queries, joins, filters) |
| **Denormalization** | Intentionally duplicating data to speed up reads |

---

## Quick Reference

| Task | Approach | Key Consideration |
|------|----------|-------------------|
| New schema | Normalize to 3NF first | Domain modeling over UI |
| SQL vs NoSQL | Access patterns decide | Read/write ratio matters |
| Primary keys | INT or UUID | UUID for distributed systems |
| Foreign keys | Always constrain | ON DELETE strategy critical |
| Indexes | FKs + WHERE columns | Column order matters |
| Migrations | Always reversible | Backward compatible first |

---

## Process Overview

```
Your Data Requirements
    |
    v
+-----------------------------------------------------+
| Phase 0: PLATFORM (see Choosing Your Database & ORM) |
| * Pick database (context, not default)               |
| * Pick ORM (or raw SQL)                               |
+-----------------------------------------------------+
    |
    v
+-----------------------------------------------------+
| Phase 1: ANALYSIS                                   |
| * Identify entities and relationships               |
| * Determine access patterns (read vs write heavy)   |
| * Choose SQL or NoSQL based on requirements          |
+-----------------------------------------------------+
    |
    v
+-----------------------------------------------------+
| Phase 2: DESIGN                                     |
| * Normalize to 3NF (SQL) or embed/reference (NoSQL) |
| * Define primary keys and foreign keys              |
| * Choose appropriate data types                     |
| * Add constraints (UNIQUE, CHECK, NOT NULL)          |
+-----------------------------------------------------+
    |
    v
+-----------------------------------------------------+
| Phase 3: OPTIMIZE                                   |
| * Plan indexing strategy                             |
| * Consider denormalization for read-heavy queries    |
| * Add timestamps (created_at, updated_at)            |
+-----------------------------------------------------+
    |
    v
+-----------------------------------------------------+
| Phase 4: MIGRATE                                     |
| * Generate migration scripts (up + down)             |
| * Ensure backward compatibility                      |
| * Plan zero-downtime deployment                      |
+-----------------------------------------------------+
    |
    v
Production-Ready Schema
```

---

## Commands

| Command | When to Use | Action |
|---------|-------------|--------|
| `design schema for {domain}` | Starting fresh | Full schema generation |
| `normalize {table}` | Fixing existing table | Apply normalization rules |
| `add indexes for {table}` | Performance issues | Generate index strategy |
| `migration for {change}` | Schema evolution | Create reversible migration |
| `review schema` | Code review | Audit existing schema |
| `validate schema` | Existing project | Run `scripts/schema_validator.py <project_path>` (Prisma-aware; flags missing PKs/indexes/timestamps) |

**Workflow:** Choose platform → `design schema` → iterate with `normalize` → optimize with `add indexes` → evolve with `migration`.

---

## Core Principles

| Principle | WHY | Implementation |
|-----------|-----|----------------|
| Model the Domain | UI changes, domain doesn't | Entity names reflect business concepts |
| Data Integrity First | Corruption is costly to fix | Constraints at database level |
| Optimize for Access Pattern | Can't optimize for both | OLTP: normalized, OLAP: denormalized |
| Plan for Scale | Retrofitting is painful | Index strategy + partitioning plan |

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Default to PostgreSQL for simple apps | SQLite may suffice | Ask about context first |
| VARCHAR(255) everywhere | Wastes storage, hides intent | Size appropriately per field |
| FLOAT for money | Rounding errors | DECIMAL(10,2) |
| Missing FK constraints | Orphaned data | Always define foreign keys |
| No indexes on FKs | Slow JOINs | Index every foreign key |
| Storing dates as strings | Can't compare/sort | DATE, TIMESTAMP types |
| SELECT * in queries | Fetches unnecessary data | Explicit column lists |
| Non-reversible migrations | Can't rollback | Always write DOWN migration |
| Adding NOT NULL without default | Breaks existing rows | Add nullable, backfill, then constrain |
| Skip indexing | Slow queries | Plan index strategy up front |
| Store JSON when structured data is better | Loses query/constraint power | Prefer normalized columns |
| Ignore N+1 queries | Very slow | JOIN / eager-load / batch |

---

## Verification Checklist

After designing a schema:

- [ ] Every table has a primary key
- [ ] All relationships have foreign key constraints
- [ ] ON DELETE strategy defined for each FK
- [ ] Indexes exist on all foreign keys
- [ ] Indexes exist on frequently queried columns
- [ ] Appropriate data types (DECIMAL for money, etc.)
- [ ] NOT NULL on required fields
- [ ] UNIQUE constraints where needed
- [ ] CHECK constraints for validation
- [ ] created_at and updated_at timestamps
- [ ] Migration scripts are reversible
- [ ] Tested on staging with production data

Full checklist with pre-design and documentation items: `references/schema-design-checklist.md`. Reversible migration skeleton: `assets/templates/migration-template.sql`.

---

<details>
<summary><strong>Deep Dive: Normalization (SQL)</strong></summary>

### Normal Forms

| Form | Rule | Violation Example |
|------|------|-------------------|
| **1NF** | Atomic values, no repeating groups | `product_ids = '1,2,3'` |
| **2NF** | 1NF + no partial dependencies | customer_name in order_items |
| **3NF** | 2NF + no transitive dependencies | country derived from postal_code |

### 1st Normal Form (1NF)

```sql
-- BAD: Multiple values in column
CREATE TABLE orders (
  id INT PRIMARY KEY,
  product_ids VARCHAR(255)  -- '101,102,103'
);

-- GOOD: Separate table for items
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT
);
```

### 2nd Normal Form (2NF)

```sql
-- BAD: customer_name depends only on customer_id
CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  customer_name VARCHAR(100),  -- Partial dependency!
  PRIMARY KEY (order_id, product_id)
);

-- GOOD: Customer data in separate table
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);
```

### 3rd Normal Form (3NF)

```sql
-- BAD: country depends on postal_code
CREATE TABLE customers (
  id INT PRIMARY KEY,
  postal_code VARCHAR(10),
  country VARCHAR(50)  -- Transitive dependency!
);

-- GOOD: Separate postal_codes table
CREATE TABLE postal_codes (
  code VARCHAR(10) PRIMARY KEY,
  country VARCHAR(50)
);
```

### When to Denormalize

| Scenario | Denormalization Strategy |
|----------|-------------------------|
| Read-heavy reporting | Pre-calculated aggregates |
| Expensive JOINs | Cached derived columns |
| Analytics dashboards | Materialized views |

```sql
-- Denormalized for performance
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,
  total_amount DECIMAL(10,2),  -- Calculated
  item_count INT               -- Calculated
);
```

</details>

<details>
<summary><strong>Deep Dive: Data Types</strong></summary>

### String Types

| Type | Use Case | Example |
|------|----------|---------|
| CHAR(n) | Fixed length | State codes, ISO dates |
| VARCHAR(n) | Variable length | Names, emails |
| TEXT | Long content | Articles, descriptions |

```sql
-- Good sizing
email VARCHAR(255)
phone VARCHAR(20)
country_code CHAR(2)
```

### Numeric Types

| Type | Range | Use Case |
|------|-------|----------|
| TINYINT | -128 to 127 | Age, status codes |
| SMALLINT | -32K to 32K | Quantities |
| INT | -2.1B to 2.1B | IDs, counts |
| BIGINT | Very large | Large IDs, timestamps |
| DECIMAL(p,s) | Exact precision | Money |
| FLOAT/DOUBLE | Approximate | Scientific data |

```sql
-- ALWAYS use DECIMAL for money
price DECIMAL(10, 2)  -- $99,999,999.99

-- NEVER use FLOAT for money
price FLOAT  -- Rounding errors!
```

### Date/Time Types

```sql
DATE        -- 2025-10-31
TIME        -- 14:30:00
DATETIME    -- 2025-10-31 14:30:00
TIMESTAMP   -- Auto timezone conversion

-- Always store in UTC
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### Boolean

```sql
-- PostgreSQL
is_active BOOLEAN DEFAULT TRUE

-- MySQL
is_active TINYINT(1) DEFAULT 1
```

</details>

<details>
<summary><strong>Deep Dive: Indexing Strategy</strong></summary>

### When to Create Indexes

| Always Index | Reason |
|--------------|--------|
| Foreign keys | Speed up JOINs |
| WHERE clause columns | Speed up filtering |
| ORDER BY columns | Speed up sorting |
| Unique constraints | Enforced uniqueness |

```sql
-- Foreign key index
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Query pattern index
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
```

### Index Types

| Type | Best For | Example |
|------|----------|---------|
| B-Tree | Ranges, equality | `price > 100` |
| Hash | Exact matches only | `email = 'x@y.com'` |
| Full-text | Text search | `MATCH AGAINST` |
| Partial | Subset of rows | `WHERE is_active = true` |
| GIN | JSONB, arrays, full-text (Postgres) | `data @> '{"key":"val"}'` |
| GiST | Geometric, range types (Postgres) | Spatial queries |
| HNSW/IVFFlat | Vector similarity (pgvector) | Embedding search |

### Composite Index Order

```sql
CREATE INDEX idx_customer_status ON orders(customer_id, status);

-- Uses index (customer_id first)
SELECT * FROM orders WHERE customer_id = 123;
SELECT * FROM orders WHERE customer_id = 123 AND status = 'pending';

-- Does NOT use index (status alone)
SELECT * FROM orders WHERE status = 'pending';
```

**Rule:** Most selective column first, or column most queried alone.

### Index Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Over-indexing | Slow writes | Only index what's queried |
| Wrong column order | Unused index | Match query patterns |
| Missing FK indexes | Slow JOINs | Always index FKs |

</details>

<details>
<summary><strong>Deep Dive: Constraints</strong></summary>

### Primary Keys

```sql
-- Auto-increment (simple)
id INT AUTO_INCREMENT PRIMARY KEY

-- UUID (distributed systems)
id CHAR(36) PRIMARY KEY DEFAULT (UUID())

-- Composite (junction tables)
PRIMARY KEY (student_id, course_id)
```

| Type | Use When |
|------|----------|
| **UUID** | Distributed systems, security |
| **ULID** | UUID + sortable by time |
| **Auto-increment** | Simple apps, single database |
| **Natural key** | Rarely (business meaning) |

### Foreign Keys

```sql
FOREIGN KEY (customer_id) REFERENCES customers(id)
  ON DELETE CASCADE     -- Delete children with parent
  ON DELETE RESTRICT    -- Prevent deletion if referenced
  ON DELETE SET NULL    -- Set to NULL when parent deleted
  ON UPDATE CASCADE     -- Update children when parent changes
```

| Strategy | Use When |
|----------|----------|
| CASCADE | Dependent data (order_items) |
| RESTRICT | Important references (prevent accidents) |
| SET NULL | Optional relationships |

### Other Constraints

```sql
-- Unique
email VARCHAR(255) UNIQUE NOT NULL

-- Composite unique
UNIQUE (student_id, course_id)

-- Check
price DECIMAL(10,2) CHECK (price >= 0)
discount INT CHECK (discount BETWEEN 0 AND 100)

-- Not null
name VARCHAR(100) NOT NULL
```

</details>

<details>
<summary><strong>Deep Dive: Relationship Patterns</strong></summary>

### One-to-Many

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL,
  quantity INT NOT NULL
);
```

### Many-to-Many

```sql
-- Junction table
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, course_id)
);
```

### Self-Referencing

```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id INT REFERENCES employees(id)
);
```

### Polymorphic

```sql
-- Approach 1: Separate FKs (stronger integrity)
CREATE TABLE comments (
  id INT PRIMARY KEY,
  content TEXT NOT NULL,
  post_id INT REFERENCES posts(id),
  photo_id INT REFERENCES photos(id),
  CHECK (
    (post_id IS NOT NULL AND photo_id IS NULL) OR
    (post_id IS NULL AND photo_id IS NOT NULL)
  )
);

-- Approach 2: Type + ID (flexible, weaker integrity)
CREATE TABLE comments (
  id INT PRIMARY KEY,
  content TEXT NOT NULL,
  commentable_type VARCHAR(50) NOT NULL,
  commentable_id INT NOT NULL
);
```

</details>

<details>
<summary><strong>Deep Dive: NoSQL Design (MongoDB)</strong></summary>

### Embedding vs Referencing

| Factor | Embed | Reference |
|--------|-------|-----------|
| Access pattern | Read together | Read separately |
| Relationship | 1:few | 1:many |
| Document size | Small | Approaching 16MB |
| Update frequency | Rarely | Frequently |

### Embedded Document

```json
{
  "_id": "order_123",
  "customer": {
    "id": "cust_456",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "items": [
    { "product_id": "prod_789", "quantity": 2, "price": 29.99 }
  ],
  "total": 109.97
}
```

### Referenced Document

```json
{
  "_id": "order_123",
  "customer_id": "cust_456",
  "item_ids": ["item_1", "item_2"],
  "total": 109.97
}
```

### MongoDB Indexes

```javascript
// Single field
db.users.createIndex({ email: 1 }, { unique: true });

// Composite
db.orders.createIndex({ customer_id: 1, created_at: -1 });

// Text search
db.articles.createIndex({ title: "text", content: "text" });

// Geospatial
db.stores.createIndex({ location: "2dsphere" });
```

</details>

<details>
<summary><strong>Deep Dive: Migrations</strong></summary>

### Migration Best Practices

| Practice | WHY |
|----------|-----|
| Always reversible | Need to rollback |
| Backward compatible | Zero-downtime deploys |
| Schema before data | Separate concerns |
| Test on staging | Catch issues early |

### Serverless Databases

| Database | Feature | Benefit |
|----------|---------|---------|
| Neon (Serverless PostgreSQL) | Scale to zero | Cost savings |
| Neon | Instant branching | Dev/preview |
| Neon | Full PostgreSQL | Compatibility |
| Neon | Autoscaling | Traffic handling |
| Turso (Edge SQLite) | Edge locations | Ultra-low latency |
| Turso | SQLite compatible | Simple |
| Turso | Generous free tier | Cost |
| Turso | Global distribution | Performance |

### Adding a Column (Zero-Downtime)

```sql
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Step 2: Deploy code that writes to new column

-- Step 3: Backfill existing rows
UPDATE users SET phone = '' WHERE phone IS NULL;

-- Step 4: Make required (if needed)
ALTER TABLE users MODIFY phone VARCHAR(20) NOT NULL;
```

### Renaming a Column (Zero-Downtime)

```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- Step 2: Copy data
UPDATE users SET email_address = email;

-- Step 3: Deploy code reading from new column
-- Step 4: Deploy code writing to new column

-- Step 5: Drop old column
ALTER TABLE users DROP COLUMN email;
```

### Migration Template

```sql
-- Migration: YYYYMMDDHHMMSS_description.sql

-- UP
BEGIN;
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone);
COMMIT;

-- DOWN
BEGIN;
DROP INDEX idx_users_phone ON users;
ALTER TABLE users DROP COLUMN phone;
COMMIT;
```

Full fill-in-the-blanks template with validation and rollback-tested notes: `assets/templates/migration-template.sql`.

</details>

<details>
<summary><strong>Deep Dive: Performance Optimization</strong></summary>

### Query Analysis

```sql
EXPLAIN SELECT * FROM orders
WHERE customer_id = 123 AND status = 'pending';
```

| Look For | Meaning |
|----------|---------|
| type: ALL | Full table scan (bad) |
| type: ref | Index used (good) |
| key: NULL | No index used |
| rows: high | Many rows scanned |

### N+1 Query Problem

```python
# BAD: N+1 queries
orders = db.query("SELECT * FROM orders")
for order in orders:
    customer = db.query(f"SELECT * FROM customers WHERE id = {order.customer_id}")

# GOOD: Single JOIN
results = db.query("""
    SELECT orders.*, customers.name
    FROM orders
    JOIN customers ON orders.customer_id = customers.id
""")
```

### Optimization Techniques

| Technique | When to Use |
|-----------|-------------|
| Add indexes | Slow WHERE/ORDER BY |
| Denormalize | Expensive JOINs |
| Pagination | Large result sets |
| Caching | Repeated queries |
| Read replicas | Read-heavy load |
| Partitioning | Very large tables |

</details>

---

## Database Migrations

Migration strategy and rollback-safety guidance, complementing the reversible-migration checklist
items above with ORM-specific patterns and zero-downtime deployment steps.

### ORM Migration Tools

```javascript
// Sequelize: migrations/<timestamp>-create-users.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING, unique: true, allowNull: false }
    });
  },
  down: async (queryInterface) => queryInterface.dropTable('users')
};
// Run: npx sequelize-cli db:migrate | Rollback: npx sequelize-cli db:migrate:undo
```

```typescript
// TypeORM: migrations/<timestamp>-CreateUsers.ts
export class CreateUsers1701234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { /* queryRunner.createTable(...) */ }
  public async down(queryRunner: QueryRunner): Promise<void> { /* queryRunner.dropTable(...) */ }
}
// Run: npm run typeorm migration:run | Rollback: npm run typeorm migration:revert
```

```prisma
// Prisma: schema.prisma, then generate + apply
// npx prisma migrate dev --name create_users
// npx prisma migrate deploy
```

### Rollback Strategies

- **Always provide a `down()`** for every `up()` — untested rollback paths are the most common
  migration failure mode.
- **Transaction-wrapped migrations**: wrap multi-step DDL+DML in a transaction so a failure rolls
  back cleanly instead of leaving the schema half-migrated.
- **Checkpoint/backup-table pattern** for higher-risk migrations: `CREATE TABLE x_backup AS SELECT
  * FROM x`, perform the migration, verify row counts/invariants, then either drop the backup or
  restore from it on failure.

### Zero-Downtime Migration Pattern (expand/contract)

1. **Expand**: add the new column/table, nullable or with a default — both old and new code paths
   still work.
2. **Backfill**: populate the new column from the old one in batches (avoid one giant UPDATE on a
   hot table).
3. **Dual-write**: deploy code that writes to both old and new columns.
4. **Cutover**: deploy code that reads from the new column only.
5. **Contract**: drop the old column once nothing references it.

This is the same expand/contract shape as the "Adding a Column" / "Renaming a Column" zero-downtime
examples in the Quick Start section above — apply it consistently for any breaking schema change,
not just column renames.

### Common Pitfalls

- Not testing the rollback path before it's needed in production.
- Making breaking changes without a backward-compatible intermediate step.
- Migrating large tables in a single transaction/statement instead of batching.
- Forgetting NULL handling when backfilling or changing column types.
- Ignoring foreign-key constraint order when creating/dropping related tables.

---

## Extension Points

1. **Database-Specific Patterns:** Add MySQL vs PostgreSQL vs SQLite variations
2. **Advanced Patterns:** Time-series, event sourcing, CQRS, multi-tenancy
3. **ORM Integration:** For deep Prisma guidance see the `prisma-expert` skill; for deep Postgres tuning see `postgres-best-practices`
4. **Monitoring:** Query performance tracking, slow query alerts
