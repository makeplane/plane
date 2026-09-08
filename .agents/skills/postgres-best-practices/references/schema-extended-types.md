---
title: Use PostgreSQL's Extended Type System (Beyond Basic Types)
impact: MEDIUM
impactDescription: correct modeling avoids bolt-on validation code and slow generic queries
tags: data-types, schema, enums, arrays, ranges, extensions
---

## Use PostgreSQL's Extended Type System (Beyond Basic Types)

Beyond the core scalar types (see "Choose Appropriate Data Types"), Postgres ships several type
families that let you enforce invariants and query patterns in the database instead of
application code.

**Incorrect (modeling everything as TEXT/JSON):**

```sql
create table events (
  id bigint generated always as identity primary key,
  status text,              -- no constraint on allowed values
  tags text,                -- comma-joined string, un-queryable
  booking_period text,      -- "2024-01-01 to 2024-01-05", no overlap protection
  is_temp boolean default false  -- reinventing UNLOGGED/TEMPORARY at the app layer
);
```

**Correct (use the matching Postgres type):**

```sql
-- Small, stable set of values -> ENUM
create type order_status as enum ('pending', 'paid', 'canceled');

-- Ordered list you query elements of -> ARRAY, indexed with GIN
create table events (
  id bigint generated always as identity primary key,
  status order_status not null default 'pending',
  tags text[] not null default '{}',
  booking_period tstzrange not null,
  computed_summary text generated always as (status::text || ':' || array_length(tags, 1)) stored,
  exclude using gist (booking_period with &&)  -- prevents overlapping bookings
);
create index on events using gin (tags);
```

Type families worth knowing:

- **Enums** (`CREATE TYPE ... AS ENUM`): small, stable sets (US states, days of week). For
  business-logic-driven and evolving values (order statuses), prefer `TEXT`/`INT` + `CHECK` or a
  lookup table instead — enums require `ALTER TYPE` to add values.
- **Arrays** (`TEXT[]`, `INTEGER[]`): ordered lists you query elements of. Index with **GIN** for
  containment (`@>`, `<@`) and overlap (`&&`). Good for tags/categories; use junction tables for
  true relations instead.
- **Range types** (`daterange`, `numrange`, `tstzrange`): intervals with overlap/containment
  operators. Index with **GiST**. Combine with `EXCLUDE USING gist` to prevent overlapping
  bookings/reservations at the constraint level.
- **Network types** (`INET`, `CIDR`, `MACADDR`): IP/MAC storage with native operators (`<<`, `>>`).
- **Geometric types** (`POINT`, `LINE`, `POLYGON`, `CIRCLE`): 2D spatial data, GiST-indexable;
  reach for **PostGIS** once you need real geospatial features.
- **Domain types** (`CREATE DOMAIN email AS TEXT CHECK (VALUE ~ '^[^@]+@[^@]+$')`): reusable
  column-level validation enforced across every table that uses the domain.
- **Composite types** (`CREATE TYPE address AS (street TEXT, city TEXT, zip TEXT)`): structured
  data within a single column, accessed with `(col).field`.
- **Generated columns** (`... GENERATED ALWAYS AS (<expr>) STORED`): computed, indexable fields
  derived from other columns. PG18+ adds `VIRTUAL` generated columns (computed on read, not
  stored).
- **Table storage variants**: `TEMPORARY` (session-scoped, auto-dropped, not logged) for scratch
  work; `UNLOGGED` (persistent but not crash-safe) for caches/staging where faster writes matter
  more than crash durability.

Useful extensions for these types: `pgcrypto` (password hashing via `crypt()`), `pg_trgm`
(fuzzy text search, GIN-indexable `LIKE '%pattern%'`), `citext` (case-insensitive text — prefer
expression indexes on `LOWER(col)` unless you need case-insensitive constraints), `btree_gin`/
`btree_gist` (mixed-type indexes), `postgis` (full geospatial), `pgvector` (embedding similarity
search), `pgaudit` (audit logging).

Reference: [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
