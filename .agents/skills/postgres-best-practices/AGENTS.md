# Postgres Best Practices

**Version 1.0.0**
Supabase
January 2026

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.

---

## Abstract

Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.

---

## Table of Contents

1. [Query Performance](#query-performance) - **CRITICAL**
   - 1.1 [Add Indexes on WHERE and JOIN Columns](#11-add-indexes-on-where-and-join-columns)
   - 1.2 [Choose the Right Index Type for Your Data](#12-choose-the-right-index-type-for-your-data)
   - 1.3 [Create Composite Indexes for Multi-Column Queries](#13-create-composite-indexes-for-multi-column-queries)
   - 1.4 [Use Covering Indexes to Avoid Table Lookups](#14-use-covering-indexes-to-avoid-table-lookups)
   - 1.5 [Use Partial Indexes for Filtered Queries](#15-use-partial-indexes-for-filtered-queries)

2. [Connection Management](#connection-management) - **CRITICAL**
   - 2.1 [Configure Idle Connection Timeouts](#21-configure-idle-connection-timeouts)
   - 2.2 [Set Appropriate Connection Limits](#22-set-appropriate-connection-limits)
   - 2.3 [Use Connection Pooling for All Applications](#23-use-connection-pooling-for-all-applications)
   - 2.4 [Use Prepared Statements Correctly with Pooling](#24-use-prepared-statements-correctly-with-pooling)

3. [Security & RLS](#security-rls) - **CRITICAL**
   - 3.1 [Apply Principle of Least Privilege](#31-apply-principle-of-least-privilege)
   - 3.2 [Enable Row Level Security for Multi-Tenant Data](#32-enable-row-level-security-for-multi-tenant-data)
   - 3.3 [Optimize RLS Policies for Performance](#33-optimize-rls-policies-for-performance)

4. [Schema Design](#schema-design) - **HIGH**
   - 4.1 [Choose Appropriate Data Types](#41-choose-appropriate-data-types)
   - 4.2 [Index Foreign Key Columns](#42-index-foreign-key-columns)
   - 4.3 [Partition Large Tables for Better Performance](#43-partition-large-tables-for-better-performance)
   - 4.4 [Select Optimal Primary Key Strategy](#44-select-optimal-primary-key-strategy)
   - 4.5 [Use Lowercase Identifiers for Compatibility](#45-use-lowercase-identifiers-for-compatibility)

5. [Concurrency & Locking](#concurrency-locking) - **MEDIUM-HIGH**
   - 5.1 [Keep Transactions Short to Reduce Lock Contention](#51-keep-transactions-short-to-reduce-lock-contention)
   - 5.2 [Prevent Deadlocks with Consistent Lock Ordering](#52-prevent-deadlocks-with-consistent-lock-ordering)
   - 5.3 [Use Advisory Locks for Application-Level Locking](#53-use-advisory-locks-for-application-level-locking)
   - 5.4 [Use SKIP LOCKED for Non-Blocking Queue Processing](#54-use-skip-locked-for-non-blocking-queue-processing)

6. [Data Access Patterns](#data-access-patterns) - **MEDIUM**
   - 6.1 [Batch INSERT Statements for Bulk Data](#61-batch-insert-statements-for-bulk-data)
   - 6.2 [Eliminate N+1 Queries with Batch Loading](#62-eliminate-n1-queries-with-batch-loading)
   - 6.3 [Use Cursor-Based Pagination Instead of OFFSET](#63-use-cursor-based-pagination-instead-of-offset)
   - 6.4 [Use UPSERT for Insert-or-Update Operations](#64-use-upsert-for-insert-or-update-operations)

7. [Monitoring & Diagnostics](#monitoring-diagnostics) - **LOW-MEDIUM**
   - 7.1 [Enable pg_stat_statements for Query Analysis](#71-enable-pgstatstatements-for-query-analysis)
   - 7.2 [Maintain Table Statistics with VACUUM and ANALYZE](#72-maintain-table-statistics-with-vacuum-and-analyze)
   - 7.3 [Use EXPLAIN ANALYZE to Diagnose Slow Queries](#73-use-explain-analyze-to-diagnose-slow-queries)

8. [Advanced Features](#advanced-features) - **LOW**
   - 8.1 [Index JSONB Columns for Efficient Querying](#81-index-jsonb-columns-for-efficient-querying)
   - 8.2 [Use tsvector for Full-Text Search](#82-use-tsvector-for-full-text-search)

---

## 1. Query Performance

**Impact: CRITICAL**

Slow queries, missing indexes, inefficient query plans. The most common source of Postgres performance issues.

### 1.1 Add Indexes on WHERE and JOIN Columns

**Impact: CRITICAL (100-1000x faster queries on large tables)**

Queries filtering or joining on unindexed columns cause full table scans, which become exponentially slower as tables grow.

**Incorrect (sequential scan on large table):**

```sql
-- No index on customer_id causes full table scan
select * from orders where customer_id = 123;

-- EXPLAIN shows: Seq Scan on orders (cost=0.00..25000.00 rows=100 width=85)
```

**Correct (index scan):**

```sql
-- Create index on frequently filtered column
create index orders_customer_id_idx on orders (customer_id);

select * from orders where customer_id = 123;

-- EXPLAIN shows: Index Scan using orders_customer_id_idx (cost=0.42..8.44 rows=100 width=85)
-- Index the referencing column
create index orders_customer_id_idx on orders (customer_id);

select c.name, o.total
from customers c
join orders o on o.customer_id = c.id;
```

For JOIN columns, always index the foreign key side:

Reference: https://supabase.com/docs/guides/database/query-optimization

---

### 1.2 Choose the Right Index Type for Your Data

**Impact: HIGH (10-100x improvement with correct index type)**

Different index types excel at different query patterns. The default B-tree isn't always optimal.

**Incorrect (B-tree for JSONB containment):**

```sql
-- B-tree cannot optimize containment operators
create index products_attrs_idx on products (attributes);
select * from products where attributes @> '{"color": "red"}';
-- Full table scan - B-tree doesn't support @> operator
```

**Correct (GIN for JSONB):**

```sql
-- GIN supports @>, ?, ?&, ?| operators
create index products_attrs_idx on products using gin (attributes);
select * from products where attributes @> '{"color": "red"}';
-- B-tree (default): =, <, >, BETWEEN, IN, IS NULL
create index users_created_idx on users (created_at);

-- GIN: arrays, JSONB, full-text search
create index posts_tags_idx on posts using gin (tags);

-- BRIN: large time-series tables (10-100x smaller)
create index events_time_idx on events using brin (created_at);

-- Hash: equality-only (slightly faster than B-tree for =)
create index sessions_token_idx on sessions using hash (token);
```

Index type guide:

Reference: https://www.postgresql.org/docs/current/indexes-types.html

---

### 1.3 Create Composite Indexes for Multi-Column Queries

**Impact: HIGH (5-10x faster multi-column queries)**

When queries filter on multiple columns, a composite index is more efficient than separate single-column indexes.

**Incorrect (separate indexes require bitmap scan):**

```sql
-- Two separate indexes
create index orders_status_idx on orders (status);
create index orders_created_idx on orders (created_at);

-- Query must combine both indexes (slower)
select * from orders where status = 'pending' and created_at > '2024-01-01';
```

**Correct (composite index):**

```sql
-- Single composite index (leftmost column first for equality checks)
create index orders_status_created_idx on orders (status, created_at);

-- Query uses one efficient index scan
select * from orders where status = 'pending' and created_at > '2024-01-01';
-- Good: status (=) before created_at (>)
create index idx on orders (status, created_at);

-- Works for: WHERE status = 'pending'
-- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
-- Does NOT work for: WHERE created_at > '2024-01-01' (leftmost prefix rule)
```

**Column order matters** - place equality columns first, range columns last:

Reference: https://www.postgresql.org/docs/current/indexes-multicolumn.html

---

### 1.4 Use Covering Indexes to Avoid Table Lookups

**Impact: MEDIUM-HIGH (2-5x faster queries by eliminating heap fetches)**

Covering indexes include all columns needed by a query, enabling index-only scans that skip the table entirely.

**Incorrect (index scan + heap fetch):**

```sql
create index users_email_idx on users (email);

-- Must fetch name and created_at from table heap
select email, name, created_at from users where email = 'user@example.com';
```

**Correct (index-only scan with INCLUDE):**

```sql
-- Include non-searchable columns in the index
create index users_email_idx on users (email) include (name, created_at);

-- All columns served from index, no table access needed
select email, name, created_at from users where email = 'user@example.com';
-- Searching by status, but also need customer_id and total
create index orders_status_idx on orders (status) include (customer_id, total);

select status, customer_id, total from orders where status = 'shipped';
```

Use INCLUDE for columns you SELECT but don't filter on:

Reference: https://www.postgresql.org/docs/current/indexes-index-only-scans.html

---

### 1.5 Use Partial Indexes for Filtered Queries

**Impact: HIGH (5-20x smaller indexes, faster writes and queries)**

Partial indexes only include rows matching a WHERE condition, making them smaller and faster when queries consistently filter on the same condition.

**Incorrect (full index includes irrelevant rows):**

```sql
-- Index includes all rows, even soft-deleted ones
create index users_email_idx on users (email);

-- Query always filters active users
select * from users where email = 'user@example.com' and deleted_at is null;
```

**Correct (partial index matches query filter):**

```sql
-- Index only includes active users
create index users_active_email_idx on users (email)
where deleted_at is null;

-- Query uses the smaller, faster index
select * from users where email = 'user@example.com' and deleted_at is null;
-- Only pending orders (status rarely changes once completed)
create index orders_pending_idx on orders (created_at)
where status = 'pending';

-- Only non-null values
create index products_sku_idx on products (sku)
where sku is not null;
```

Common use cases for partial indexes:

Reference: https://www.postgresql.org/docs/current/indexes-partial.html

---

## 2. Connection Management

**Impact: CRITICAL**

Connection pooling, limits, and serverless strategies. Critical for applications with high concurrency or serverless deployments.

### 2.1 Configure Idle Connection Timeouts

**Impact: HIGH (Reclaim 30-50% of connection slots from idle clients)**

Idle connections waste resources. Configure timeouts to automatically reclaim them.

**Incorrect (connections held indefinitely):**

```sql
-- No timeout configured
show idle_in_transaction_session_timeout;  -- 0 (disabled)

-- Connections stay open forever, even when idle
select pid, state, state_change, query
from pg_stat_activity
where state = 'idle in transaction';
-- Shows transactions idle for hours, holding locks
```

**Correct (automatic cleanup of idle connections):**

```ini
-- Terminate connections idle in transaction after 30 seconds
alter system set idle_in_transaction_session_timeout = '30s';

-- Terminate completely idle connections after 10 minutes
alter system set idle_session_timeout = '10min';

-- Reload configuration
select pg_reload_conf();
# pgbouncer.ini
server_idle_timeout = 60
client_idle_timeout = 300
```

For pooled connections, configure at the pooler level:

Reference: https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-IDLE-IN-TRANSACTION-SESSION-TIMEOUT

---

### 2.2 Set Appropriate Connection Limits

**Impact: CRITICAL (Prevent database crashes and memory exhaustion)**

Too many connections exhaust memory and degrade performance. Set limits based on available resources.

**Incorrect (unlimited or excessive connections):**

```sql
-- Default max_connections = 100, but often increased blindly
show max_connections;  -- 500 (way too high for 4GB RAM)

-- Each connection uses 1-3MB RAM
-- 500 connections * 2MB = 1GB just for connections!
-- Out of memory errors under load
```

**Correct (calculate based on resources):**

```sql
-- Formula: max_connections = (RAM in MB / 5MB per connection) - reserved
-- For 4GB RAM: (4096 / 5) - 10 = ~800 theoretical max
-- But practically, 100-200 is better for query performance

-- Recommended settings for 4GB RAM
alter system set max_connections = 100;

-- Also set work_mem appropriately
-- work_mem * max_connections should not exceed 25% of RAM
alter system set work_mem = '8MB';  -- 8MB * 100 = 800MB max
select count(*), state from pg_stat_activity group by state;
```

Monitor connection usage:

Reference: https://supabase.com/docs/guides/platform/performance#connection-management

---

### 2.3 Use Connection Pooling for All Applications

**Impact: CRITICAL (Handle 10-100x more concurrent users)**

Postgres connections are expensive (1-3MB RAM each). Without pooling, applications exhaust connections under load.

**Incorrect (new connection per request):**

```sql
-- Each request creates a new connection
-- Application code: db.connect() per request
-- Result: 500 concurrent users = 500 connections = crashed database

-- Check current connections
select count(*) from pg_stat_activity;  -- 487 connections!
```

**Correct (connection pooling):**

```sql
-- Use a pooler like PgBouncer between app and database
-- Application connects to pooler, pooler reuses a small pool to Postgres

-- Configure pool_size based on: (CPU cores * 2) + spindle_count
-- Example for 4 cores: pool_size = 10

-- Result: 500 concurrent users share 10 actual connections
select count(*) from pg_stat_activity;  -- 10 connections
```

Pool modes:
- **Transaction mode**: connection returned after each transaction (best for most apps)
- **Session mode**: connection held for entire session (needed for prepared statements, temp tables)

Reference: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler

---

### 2.4 Use Prepared Statements Correctly with Pooling

**Impact: HIGH (Avoid prepared statement conflicts in pooled environments)**

Prepared statements are tied to individual database connections. In transaction-mode pooling, connections are shared, causing conflicts.

**Incorrect (named prepared statements with transaction pooling):**

```sql
-- Named prepared statement
prepare get_user as select * from users where id = $1;

-- In transaction mode pooling, next request may get different connection
execute get_user(123);
-- ERROR: prepared statement "get_user" does not exist
```

**Correct (use unnamed statements or session mode):**

```sql
-- Option 1: Use unnamed prepared statements (most ORMs do this automatically)
-- The query is prepared and executed in a single protocol message

-- Option 2: Deallocate after use in transaction mode
prepare get_user as select * from users where id = $1;
execute get_user(123);
deallocate get_user;

-- Option 3: Use session mode pooling (port 5432 vs 6543)
-- Connection is held for entire session, prepared statements persist
-- Many drivers use prepared statements by default
-- Node.js pg: { prepare: false } to disable
-- JDBC: prepareThreshold=0 to disable
```

Check your driver settings:

Reference: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool-modes

---

## 3. Security & RLS

**Impact: CRITICAL**

Row-Level Security policies, privilege management, and authentication patterns.

### 3.1 Apply Principle of Least Privilege

**Impact: MEDIUM (Reduced attack surface, better audit trail)**

Grant only the minimum permissions required. Never use superuser for application queries.

**Incorrect (overly broad permissions):**

```sql
-- Application uses superuser connection
-- Or grants ALL to application role
grant all privileges on all tables in schema public to app_user;
grant all privileges on all sequences in schema public to app_user;

-- Any SQL injection becomes catastrophic
-- drop table users; cascades to everything
```

**Correct (minimal, specific grants):**

```sql
-- Create role with no default privileges
create role app_readonly nologin;

-- Grant only SELECT on specific tables
grant usage on schema public to app_readonly;
grant select on public.products, public.categories to app_readonly;

-- Create role for writes with limited scope
create role app_writer nologin;
grant usage on schema public to app_writer;
grant select, insert, update on public.orders to app_writer;
grant usage on sequence orders_id_seq to app_writer;
-- No DELETE permission

-- Login role inherits from these
create role app_user login password 'xxx';
grant app_writer to app_user;
-- Revoke default public access
revoke all on schema public from public;
revoke all on all tables in schema public from public;
```

Revoke public defaults:

Reference: https://supabase.com/blog/postgres-roles-and-privileges

---

### 3.2 Enable Row Level Security for Multi-Tenant Data

**Impact: CRITICAL (Database-enforced tenant isolation, prevent data leaks)**

Row Level Security (RLS) enforces data access at the database level, ensuring users only see their own data.

**Incorrect (application-level filtering only):**

```sql
-- Relying only on application to filter
select * from orders where user_id = $current_user_id;

-- Bug or bypass means all data is exposed!
select * from orders;  -- Returns ALL orders
```

**Correct (database-enforced RLS):**

```sql
-- Enable RLS on the table
alter table orders enable row level security;

-- Create policy for users to see only their orders
create policy orders_user_policy on orders
  for all
  using (user_id = current_setting('app.current_user_id')::bigint);

-- Force RLS even for table owners
alter table orders force row level security;

-- Set user context and query
set app.current_user_id = '123';
select * from orders;  -- Only returns orders for user 123
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());
```

Policy for authenticated role:

Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

---

### 3.3 Optimize RLS Policies for Performance

**Impact: HIGH (5-10x faster RLS queries with proper patterns)**

Poorly written RLS policies can cause severe performance issues. Use subqueries and indexes strategically.

**Incorrect (function called for every row):**

```sql
create policy orders_policy on orders
  using (auth.uid() = user_id);  -- auth.uid() called per row!

-- With 1M rows, auth.uid() is called 1M times
```

**Correct (wrap functions in SELECT):**

```sql
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);  -- Called once, cached

-- 100x+ faster on large tables
-- Create helper function (runs as definer, bypasses RLS)
create or replace function is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  using ((select is_team_member(team_id)));
create index orders_user_id_idx on orders (user_id);
```

Use security definer functions for complex checks:
Always add indexes on columns used in RLS policies:

Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations

---

## 4. Schema Design

**Impact: HIGH**

Table design, index strategies, partitioning, and data type selection. Foundation for long-term performance.

### 4.1 Choose Appropriate Data Types

**Impact: HIGH (50% storage reduction, faster comparisons)**

Using the right data types reduces storage, improves query performance, and prevents bugs.

**Incorrect (wrong data types):**

```sql
create table users (
  id int,                    -- Will overflow at 2.1 billion
  email varchar(255),        -- Unnecessary length limit
  created_at timestamp,      -- Missing timezone info
  is_active varchar(5),      -- String for boolean
  price varchar(20)          -- String for numeric
);
```

**Correct (appropriate data types):**

```sql
create table users (
  id bigint generated always as identity primary key,  -- 9 quintillion max
  email text,                     -- No artificial limit, same performance as varchar
  created_at timestamptz,         -- Always store timezone-aware timestamps
  is_active boolean default true, -- 1 byte vs variable string length
  price numeric(10,2)             -- Exact decimal arithmetic
);
-- IDs: use bigint, not int (future-proofing)
-- Strings: use text, not varchar(n) unless constraint needed
-- Time: use timestamptz, not timestamp
-- Money: use numeric, not float (precision matters)
-- Enums: use text with check constraint or create enum type
```

Key guidelines:

Reference: https://www.postgresql.org/docs/current/datatype.html

---

### 4.2 Index Foreign Key Columns

**Impact: HIGH (10-100x faster JOINs and CASCADE operations)**

Postgres does not automatically index foreign key columns. Missing indexes cause slow JOINs and CASCADE operations.

**Incorrect (unindexed foreign key):**

```sql
create table orders (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete cascade,
  total numeric(10,2)
);

-- No index on customer_id!
-- JOINs and ON DELETE CASCADE both require full table scan
select * from orders where customer_id = 123;  -- Seq Scan
delete from customers where id = 123;          -- Locks table, scans all orders
```

**Correct (indexed foreign key):**

```sql
create table orders (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete cascade,
  total numeric(10,2)
);

-- Always index the FK column
create index orders_customer_id_idx on orders (customer_id);

-- Now JOINs and cascades are fast
select * from orders where customer_id = 123;  -- Index Scan
delete from customers where id = 123;          -- Uses index, fast cascade
select
  conrelid::regclass as table_name,
  a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
  );
```

Find missing FK indexes:

Reference: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK

---

### 4.3 Partition Large Tables for Better Performance

**Impact: MEDIUM-HIGH (5-20x faster queries and maintenance on large tables)**

Partitioning splits a large table into smaller pieces, improving query performance and maintenance operations.

**Incorrect (single large table):**

```sql
create table events (
  id bigint generated always as identity,
  created_at timestamptz,
  data jsonb
);

-- 500M rows, queries scan everything
select * from events where created_at > '2024-01-01';  -- Slow
vacuum events;  -- Takes hours, locks table
```

**Correct (partitioned by time range):**

```sql
create table events (
  id bigint generated always as identity,
  created_at timestamptz not null,
  data jsonb
) partition by range (created_at);

-- Create partitions for each month
create table events_2024_01 partition of events
  for values from ('2024-01-01') to ('2024-02-01');

create table events_2024_02 partition of events
  for values from ('2024-02-01') to ('2024-03-01');

-- Queries only scan relevant partitions
select * from events where created_at > '2024-01-15';  -- Only scans events_2024_01+

-- Drop old data instantly
drop table events_2023_01;  -- Instant vs DELETE taking hours
```

When to partition:
- Tables > 100M rows
- Time-series data with date-based queries
- Need to efficiently drop old data

Reference: https://www.postgresql.org/docs/current/ddl-partitioning.html

---

### 4.4 Select Optimal Primary Key Strategy

**Impact: HIGH (Better index locality, reduced fragmentation)**

Primary key choice affects insert performance, index size, and replication
efficiency.

**Incorrect (problematic PK choices):**

```sql
-- identity is the SQL-standard approach
create table users (
  id serial primary key  -- Works, but IDENTITY is recommended
);

-- Random UUIDs (v4) cause index fragmentation
create table orders (
  id uuid default gen_random_uuid() primary key  -- UUIDv4 = random = scattered inserts
);
```

**Correct (optimal PK strategies):**

```sql
-- Use IDENTITY for sequential IDs (SQL-standard, best for most cases)
create table users (
  id bigint generated always as identity primary key
);

-- For distributed systems needing UUIDs, use UUIDv7 (time-ordered)
-- Requires pg_uuidv7 extension: create extension pg_uuidv7;
create table orders (
  id uuid default uuid_generate_v7() primary key  -- Time-ordered, no fragmentation
);

-- Alternative: time-prefixed IDs for sortable, distributed IDs (no extension needed)
create table events (
  id text default concat(
    to_char(now() at time zone 'utc', 'YYYYMMDDHH24MISSMS'),
    gen_random_uuid()::text
  ) primary key
);
```

Guidelines:
- Single database: `bigint identity` (sequential, 8 bytes, SQL-standard)
- Distributed/exposed IDs: UUIDv7 (requires pg_uuidv7) or ULID (time-ordered, no
  fragmentation)
- `serial` works but `identity` is SQL-standard and preferred for new
  applications
- Avoid random UUIDs (v4) as primary keys on large tables (causes index
  fragmentation)
[Identity Columns](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-PARMS-GENERATED-IDENTITY)

---

### 4.5 Use Lowercase Identifiers for Compatibility

**Impact: MEDIUM (Avoid case-sensitivity bugs with tools, ORMs, and AI assistants)**

PostgreSQL folds unquoted identifiers to lowercase. Quoted mixed-case identifiers require quotes forever and cause issues with tools, ORMs, and AI assistants that may not recognize them.

**Incorrect (mixed-case identifiers):**

```sql
-- Quoted identifiers preserve case but require quotes everywhere
CREATE TABLE "Users" (
  "userId" bigint PRIMARY KEY,
  "firstName" text,
  "lastName" text
);

-- Must always quote or queries fail
SELECT "firstName" FROM "Users" WHERE "userId" = 1;

-- This fails - Users becomes users without quotes
SELECT firstName FROM Users;
-- ERROR: relation "users" does not exist
```

**Correct (lowercase snake_case):**

```sql
-- Unquoted lowercase identifiers are portable and tool-friendly
CREATE TABLE users (
  user_id bigint PRIMARY KEY,
  first_name text,
  last_name text
);

-- Works without quotes, recognized by all tools
SELECT first_name FROM users WHERE user_id = 1;
-- ORMs often generate quoted camelCase - configure them to use snake_case
-- Migrations from other databases may preserve original casing
-- Some GUI tools quote identifiers by default - disable this

-- If stuck with mixed-case, create views as a compatibility layer
CREATE VIEW users AS SELECT "userId" AS user_id, "firstName" AS first_name FROM "Users";
```

Common sources of mixed-case identifiers:

Reference: https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS

---

## 5. Concurrency & Locking

**Impact: MEDIUM-HIGH**

Transaction management, isolation levels, deadlock prevention, and lock contention patterns.

### 5.1 Keep Transactions Short to Reduce Lock Contention

**Impact: MEDIUM-HIGH (3-5x throughput improvement, fewer deadlocks)**

Long-running transactions hold locks that block other queries. Keep transactions as short as possible.

**Incorrect (long transaction with external calls):**

```sql
begin;
select * from orders where id = 1 for update;  -- Lock acquired

-- Application makes HTTP call to payment API (2-5 seconds)
-- Other queries on this row are blocked!

update orders set status = 'paid' where id = 1;
commit;  -- Lock held for entire duration
```

**Correct (minimal transaction scope):**

```sql
-- Validate data and call APIs outside transaction
-- Application: response = await paymentAPI.charge(...)

-- Only hold lock for the actual update
begin;
update orders
set status = 'paid', payment_id = $1
where id = $2 and status = 'pending'
returning *;
commit;  -- Lock held for milliseconds
-- Abort queries running longer than 30 seconds
set statement_timeout = '30s';

-- Or per-session
set local statement_timeout = '5s';
```

Use `statement_timeout` to prevent runaway transactions:

Reference: https://www.postgresql.org/docs/current/tutorial-transactions.html

---

### 5.2 Prevent Deadlocks with Consistent Lock Ordering

**Impact: MEDIUM-HIGH (Eliminate deadlock errors, improve reliability)**

Deadlocks occur when transactions lock resources in different orders. Always
acquire locks in a consistent order.

**Incorrect (inconsistent lock ordering):**

```sql
-- Transaction A                    -- Transaction B
begin;                              begin;
update accounts                     update accounts
set balance = balance - 100         set balance = balance - 50
where id = 1;                       where id = 2;  -- B locks row 2

update accounts                     update accounts
set balance = balance + 100         set balance = balance + 50
where id = 2;  -- A waits for B     where id = 1;  -- B waits for A

-- DEADLOCK! Both waiting for each other
```

**Correct (lock rows in consistent order first):**

```sql
-- Explicitly acquire locks in ID order before updating
begin;
select * from accounts where id in (1, 2) order by id for update;

-- Now perform updates in any order - locks already held
update accounts set balance = balance - 100 where id = 1;
update accounts set balance = balance + 100 where id = 2;
commit;
-- Single statement acquires all locks atomically
begin;
update accounts
set balance = balance + case id
  when 1 then -100
  when 2 then 100
end
where id in (1, 2);
commit;
-- Check for recent deadlocks
select * from pg_stat_database where deadlocks > 0;

-- Enable deadlock logging
set log_lock_waits = on;
set deadlock_timeout = '1s';
```

Alternative: use a single statement to update atomically:
Detect deadlocks in logs:
[Deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS)

---

### 5.3 Use Advisory Locks for Application-Level Locking

**Impact: MEDIUM (Efficient coordination without row-level lock overhead)**

Advisory locks provide application-level coordination without requiring database rows to lock.

**Incorrect (creating rows just for locking):**

```sql
-- Creating dummy rows to lock on
create table resource_locks (
  resource_name text primary key
);

insert into resource_locks values ('report_generator');

-- Lock by selecting the row
select * from resource_locks where resource_name = 'report_generator' for update;
```

**Correct (advisory locks):**

```sql
-- Session-level advisory lock (released on disconnect or unlock)
select pg_advisory_lock(hashtext('report_generator'));
-- ... do exclusive work ...
select pg_advisory_unlock(hashtext('report_generator'));

-- Transaction-level lock (released on commit/rollback)
begin;
select pg_advisory_xact_lock(hashtext('daily_report'));
-- ... do work ...
commit;  -- Lock automatically released
-- Returns immediately with true/false instead of waiting
select pg_try_advisory_lock(hashtext('resource_name'));

-- Use in application
if (acquired) {
  -- Do work
  select pg_advisory_unlock(hashtext('resource_name'));
} else {
  -- Skip or retry later
}
```

Try-lock for non-blocking operations:

Reference: https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS

---

### 5.4 Use SKIP LOCKED for Non-Blocking Queue Processing

**Impact: MEDIUM-HIGH (10x throughput for worker queues)**

When multiple workers process a queue, SKIP LOCKED allows workers to process different rows without waiting.

**Incorrect (workers block each other):**

```sql
-- Worker 1 and Worker 2 both try to get next job
begin;
select * from jobs where status = 'pending' order by created_at limit 1 for update;
-- Worker 2 waits for Worker 1's lock to release!
```

**Correct (SKIP LOCKED for parallel processing):**

```sql
-- Each worker skips locked rows and gets the next available
begin;
select * from jobs
where status = 'pending'
order by created_at
limit 1
for update skip locked;

-- Worker 1 gets job 1, Worker 2 gets job 2 (no waiting)

update jobs set status = 'processing' where id = $1;
commit;
-- Atomic claim-and-update in one statement
update jobs
set status = 'processing', worker_id = $1, started_at = now()
where id = (
  select id from jobs
  where status = 'pending'
  order by created_at
  limit 1
  for update skip locked
)
returning *;
```

Complete queue pattern:

Reference: https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE

---

## 6. Data Access Patterns

**Impact: MEDIUM**

N+1 query elimination, batch operations, cursor-based pagination, and efficient data fetching.

### 6.1 Batch INSERT Statements for Bulk Data

**Impact: MEDIUM (10-50x faster bulk inserts)**

Individual INSERT statements have high overhead. Batch multiple rows in single statements or use COPY.

**Incorrect (individual inserts):**

```sql
-- Each insert is a separate transaction and round trip
insert into events (user_id, action) values (1, 'click');
insert into events (user_id, action) values (1, 'view');
insert into events (user_id, action) values (2, 'click');
-- ... 1000 more individual inserts

-- 1000 inserts = 1000 round trips = slow
```

**Correct (batch insert):**

```sql
-- Multiple rows in single statement
insert into events (user_id, action) values
  (1, 'click'),
  (1, 'view'),
  (2, 'click'),
  -- ... up to ~1000 rows per batch
  (999, 'view');

-- One round trip for 1000 rows
-- COPY is fastest for bulk loading
copy events (user_id, action, created_at)
from '/path/to/data.csv'
with (format csv, header true);

-- Or from stdin in application
copy events (user_id, action) from stdin with (format csv);
1,click
1,view
2,click
\.
```

For large imports, use COPY:

Reference: https://www.postgresql.org/docs/current/sql-copy.html

---

### 6.2 Eliminate N+1 Queries with Batch Loading

**Impact: MEDIUM-HIGH (10-100x fewer database round trips)**

N+1 queries execute one query per item in a loop. Batch them into a single query using arrays or JOINs.

**Incorrect (N+1 queries):**

```sql
-- First query: get all users
select id from users where active = true;  -- Returns 100 IDs

-- Then N queries, one per user
select * from orders where user_id = 1;
select * from orders where user_id = 2;
select * from orders where user_id = 3;
-- ... 97 more queries!

-- Total: 101 round trips to database
```

**Correct (single batch query):**

```sql
-- Collect IDs and query once with ANY
select * from orders where user_id = any(array[1, 2, 3, ...]);

-- Or use JOIN instead of loop
select u.id, u.name, o.*
from users u
left join orders o on o.user_id = u.id
where u.active = true;

-- Total: 1 round trip
-- Instead of looping in application code:
-- for user in users: db.query("SELECT * FROM orders WHERE user_id = $1", user.id)

-- Pass array parameter:
select * from orders where user_id = any($1::bigint[]);
-- Application passes: [1, 2, 3, 4, 5, ...]
```

Application pattern:

Reference: https://supabase.com/docs/guides/database/query-optimization

---

### 6.3 Use Cursor-Based Pagination Instead of OFFSET

**Impact: MEDIUM-HIGH (Consistent O(1) performance regardless of page depth)**

OFFSET-based pagination scans all skipped rows, getting slower on deeper pages. Cursor pagination is O(1).

**Incorrect (OFFSET pagination):**

```sql
-- Page 1: scans 20 rows
select * from products order by id limit 20 offset 0;

-- Page 100: scans 2000 rows to skip 1980
select * from products order by id limit 20 offset 1980;

-- Page 10000: scans 200,000 rows!
select * from products order by id limit 20 offset 199980;
```

**Correct (cursor/keyset pagination):**

```sql
-- Page 1: get first 20
select * from products order by id limit 20;
-- Application stores last_id = 20

-- Page 2: start after last ID
select * from products where id > 20 order by id limit 20;
-- Uses index, always fast regardless of page depth

-- Page 10000: same speed as page 1
select * from products where id > 199980 order by id limit 20;
-- Cursor must include all sort columns
select * from products
where (created_at, id) > ('2024-01-15 10:00:00', 12345)
order by created_at, id
limit 20;
```

For multi-column sorting:

Reference: https://supabase.com/docs/guides/database/pagination

---

### 6.4 Use UPSERT for Insert-or-Update Operations

**Impact: MEDIUM (Atomic operation, eliminates race conditions)**

Using separate SELECT-then-INSERT/UPDATE creates race conditions. Use INSERT ... ON CONFLICT for atomic upserts.

**Incorrect (check-then-insert race condition):**

```sql
-- Race condition: two requests check simultaneously
select * from settings where user_id = 123 and key = 'theme';
-- Both find nothing

-- Both try to insert
insert into settings (user_id, key, value) values (123, 'theme', 'dark');
-- One succeeds, one fails with duplicate key error!
```

**Correct (atomic UPSERT):**

```sql
-- Single atomic operation
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value, updated_at = now();

-- Returns the inserted/updated row
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value
returning *;
-- Insert only if not exists (no update)
insert into page_views (page_id, user_id)
values (1, 123)
on conflict (page_id, user_id) do nothing;
```

Insert-or-ignore pattern:

Reference: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT

---

## 7. Monitoring & Diagnostics

**Impact: LOW-MEDIUM**

Using pg_stat_statements, EXPLAIN ANALYZE, metrics collection, and performance diagnostics.

### 7.1 Enable pg_stat_statements for Query Analysis

**Impact: LOW-MEDIUM (Identify top resource-consuming queries)**

pg_stat_statements tracks execution statistics for all queries, helping identify slow and frequent queries.

**Incorrect (no visibility into query patterns):**

```sql
-- Database is slow, but which queries are the problem?
-- No way to know without pg_stat_statements
```

**Correct (enable and query pg_stat_statements):**

```sql
-- Enable the extension
create extension if not exists pg_stat_statements;

-- Find slowest queries by total time
select
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  query
from pg_stat_statements
order by total_exec_time desc
limit 10;

-- Find most frequent queries
select calls, query
from pg_stat_statements
order by calls desc
limit 10;

-- Reset statistics after optimization
select pg_stat_statements_reset();
-- Queries with high mean time (candidates for optimization)
select query, mean_exec_time, calls
from pg_stat_statements
where mean_exec_time > 100  -- > 100ms average
order by mean_exec_time desc;
```

Key metrics to monitor:

Reference: https://supabase.com/docs/guides/database/extensions/pg_stat_statements

---

### 7.2 Maintain Table Statistics with VACUUM and ANALYZE

**Impact: MEDIUM (2-10x better query plans with accurate statistics)**

Outdated statistics cause the query planner to make poor decisions. VACUUM reclaims space, ANALYZE updates statistics.

**Incorrect (stale statistics):**

```sql
-- Table has 1M rows but stats say 1000
-- Query planner chooses wrong strategy
explain select * from orders where status = 'pending';
-- Shows: Seq Scan (because stats show small table)
-- Actually: Index Scan would be much faster
```

**Correct (maintain fresh statistics):**

```sql
-- Manually analyze after large data changes
analyze orders;

-- Analyze specific columns used in WHERE clauses
analyze orders (status, created_at);

-- Check when tables were last analyzed
select
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
order by last_analyze nulls first;
-- Increase frequency for high-churn tables
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.05,     -- Vacuum at 5% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.02     -- Analyze at 2% changes (default 10%)
);

-- Check autovacuum status
select * from pg_stat_progress_vacuum;
```

Autovacuum tuning for busy tables:

Reference: https://supabase.com/docs/guides/database/database-size#vacuum-operations

---

### 7.3 Use EXPLAIN ANALYZE to Diagnose Slow Queries

**Impact: LOW-MEDIUM (Identify exact bottlenecks in query execution)**

EXPLAIN ANALYZE executes the query and shows actual timings, revealing the true performance bottlenecks.

**Incorrect (guessing at performance issues):**

```sql
-- Query is slow, but why?
select * from orders where customer_id = 123 and status = 'pending';
-- "It must be missing an index" - but which one?
```

**Correct (use EXPLAIN ANALYZE):**

```sql
explain (analyze, buffers, format text)
select * from orders where customer_id = 123 and status = 'pending';

-- Output reveals the issue:
-- Seq Scan on orders (cost=0.00..25000.00 rows=50 width=100) (actual time=0.015..450.123 rows=50 loops=1)
--   Filter: ((customer_id = 123) AND (status = 'pending'::text))
--   Rows Removed by Filter: 999950
--   Buffers: shared hit=5000 read=15000
-- Planning Time: 0.150 ms
-- Execution Time: 450.500 ms
-- Seq Scan on large tables = missing index
-- Rows Removed by Filter = poor selectivity or missing index
-- Buffers: read >> hit = data not cached, needs more memory
-- Nested Loop with high loops = consider different join strategy
-- Sort Method: external merge = work_mem too low
```

Key things to look for:

Reference: https://supabase.com/docs/guides/database/inspect

---

## 8. Advanced Features

**Impact: LOW**

Full-text search, JSONB optimization, PostGIS, extensions, and advanced Postgres features.

### 8.1 Index JSONB Columns for Efficient Querying

**Impact: MEDIUM (10-100x faster JSONB queries with proper indexing)**

JSONB queries without indexes scan the entire table. Use GIN indexes for containment queries.

**Incorrect (no index on JSONB):**

```sql
create table products (
  id bigint primary key,
  attributes jsonb
);

-- Full table scan for every query
select * from products where attributes @> '{"color": "red"}';
select * from products where attributes->>'brand' = 'Nike';
```

**Correct (GIN index for JSONB):**

```sql
-- GIN index for containment operators (@>, ?, ?&, ?|)
create index products_attrs_gin on products using gin (attributes);

-- Now containment queries use the index
select * from products where attributes @> '{"color": "red"}';

-- For specific key lookups, use expression index
create index products_brand_idx on products ((attributes->>'brand'));
select * from products where attributes->>'brand' = 'Nike';
-- jsonb_ops (default): supports all operators, larger index
create index idx1 on products using gin (attributes);

-- jsonb_path_ops: only @> operator, but 2-3x smaller index
create index idx2 on products using gin (attributes jsonb_path_ops);
```

Choose the right operator class:

Reference: https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING

---

### 8.2 Use tsvector for Full-Text Search

**Impact: MEDIUM (100x faster than LIKE, with ranking support)**

LIKE with wildcards can't use indexes. Full-text search with tsvector is orders of magnitude faster.

**Incorrect (LIKE pattern matching):**

```sql
-- Cannot use index, scans all rows
select * from articles where content like '%postgresql%';

-- Case-insensitive makes it worse
select * from articles where lower(content) like '%postgresql%';
```

**Correct (full-text search with tsvector):**

```sql
-- Add tsvector column and index
alter table articles add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))) stored;

create index articles_search_idx on articles using gin (search_vector);

-- Fast full-text search
select * from articles
where search_vector @@ to_tsquery('english', 'postgresql & performance');

-- With ranking
select *, ts_rank(search_vector, query) as rank
from articles, to_tsquery('english', 'postgresql') query
where search_vector @@ query
order by rank desc;
-- AND: both terms required
to_tsquery('postgresql & performance')

-- OR: either term
to_tsquery('postgresql | mysql')

-- Prefix matching
to_tsquery('post:*')
```

Search multiple terms:

Reference: https://supabase.com/docs/guides/database/full-text-search

---

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
