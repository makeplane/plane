---
name: db-design
description: "Activate when user requests: Database/table design for transactional (OLTP), analytics (OLAP), create or extend schema, design fact/dimension tables, analyze/review CSV/JSON/SQL files to create tables, or need advice on data storage structure."
---

# SKILL: Database Schema Design

## Execution Process

### Step 1: Analyze Context (MANDATORY)

Before ANY design work, AI MUST check:

- [ ] Database stack identified? (MySQL / PostgreSQL / BigQuery / SQLite / D1)
- [ ] Existing schema explored via tools/MCP?
- [ ] Use case clear? (transactional vs analytics vs ETL)

**If ANY checkbox is unclear → STOP and ask user before proceeding.**

### Step 2: Gather Requirements

**MUST ask if missing:**

| Missing Info | Required Question |
|--------------|-------------------|
| Entities unclear | "What are the main entities involved in this feature?" |
| Query patterns unknown | "What queries/reports will run most often?" |
| Granularity unclear | "What level of detail needed? (per order, per item, per day)" |
| Constraints unknown | "Any uniqueness, retention, or multi-tenant requirements?" |
| Relationships unclear | "How do these entities relate to each other?" |

**DO NOT assume or proceed without answers. DO NOT design schema without understanding the business context.**

### Step 3: Load Documentation by Intent

| Intent | Keywords | Load file |
|--------|----------|-----------|
| **OLTP** | "business tables", "transactional", "CRUD", "orders", "users" | [transactional.md](transactional.md) |
| **OLAP** | "analytics", "statistics", "reports", "fact", "dimension" | [analytics.md](analytics.md) |
| **ETL** | "incremental", "load", "sync", "watermark", "etl" | [incremental-etl.md](incremental-etl.md) |

**Database stacks:** [MySQL](stacks/mysql.md) · [PostgreSQL](stacks/postgres.md) · [BigQuery](stacks/bigquery.md) · [SQLite](stacks/sqlite.md) · [D1 Cloudflare](stacks/d1_cloudflare.md)

### Step 4: Design & Propose

Only after Steps 1-3 complete:
- Propose DDL with reasoning
- **Wait for user approval before execution**
- Never auto-execute DDL

### Step 5: Verify Checklist

Before delivering final DDL, verify the **Final Checklist** at the end of this file.

---

## Scope & Objectives

Design or extend database schemas ensuring:

- Consistent, understandable, maintainable data structures
- Good performance with appropriate indexes
- Design that fits existing tables (avoid duplication, avoid breaking logic)

---

## Naming Conventions

### Table naming

- Use **snake_case**, English, plural for main entities:
  - `users`, `orders`, `order_items`, `product_variants`
- Junction/mapping tables:
  - `role_permissions`, `user_roles`, `product_categories`
- Fact & dimension tables (analytics):
  - Fact: `fact_orders`, `fact_order_items`, `fact_pageviews`
  - Dimension: `dim_date`, `dim_customer`, `dim_product`, `dim_store`
- Avoid unclear abbreviations:
  - ❌ `usr`, `ord`, `inv_tx`
  - ✅ `users`, `orders`, `inventory_transactions`

### Column naming

- Use **snake_case**, clear meaning, consistent across tables
- **Primary key**: `id` (main PK of table)
- **Foreign key**: `xxx_id` pointing to table `xxx`:
  - `user_id` → `users.id`
  - `order_id` → `orders.id`
- **Audit & lifecycle**:
  - `created_at`, `updated_at`, `deleted_at` (soft delete)
- **Boolean flags**:
  - `is_active`, `is_deleted`, `is_primary`, `is_verified`
- **Quantities & prices**:
  - `quantity`, `unit_price`, `total_price`, `discount_amount`, `tax_amount`
- **Time ranges**:
  - `start_at`, `end_at` or `valid_from`, `valid_to` (pick one convention and use consistently)
- **Enum/state**:
  - `status` (combine with ENUM / CHECK constraint)

---

## Workflow

### 1. Understand business requirements

- Summarize requirements in your own words
- If missing context, ask:
  - What entities are involved?
  - What is the main business flow?
  - What queries/reports are commonly used?

### 2. Explore existing schema (MANDATORY before proposing)

- Use tools/MCP to list tables and describe structure
- For DBs with comments (MySQL/PostgreSQL/BigQuery): read comments directly
- For SQLite/D1: query `metadata_tables` and `metadata_columns` tables

### 3. Analyze and propose draft

- Which tables already partially cover requirements?
- Which tables need additional columns/indexes?
- Which tables are completely missing (need to create)?

### 4. Confirm with user before finalizing design

- Required granularity
- Metrics to calculate
- Important business constraints (uniqueness, retention, privacy)

### 5. Design detailed schema

- Provide proposed DDL - **do NOT auto-execute**
- Wait for user approval before execution

---

## Processing Data Files (CSV/JSON/SQL)

When user provides files:

1. **Read and identify structure**: headers, data types, relationships
2. **Large files**: write Python script to parse and analyze
3. **SQL files**: review naming, indexes, constraints, propose improvements
4. **Output**: Proposed DDL with reasoning

---

## Output Format

When delivering design results:

1. **Summary**: list of new tables / tables to modify
2. **Complete DDL SQL**: columns, types, PK, FK, indexes, comments
3. **Reasoning**: explain why this structure/index was chosen, tied to actual queries

---

## Final Checklist

Before delivering final DDL:

- [ ] Explored existing schema via tools/MCP
- [ ] No duplicate tables with existing schema
- [ ] All FKs have indexes
- [ ] Composite indexes match main query patterns
- [ ] Naming convention consistent with existing schema
- [ ] Added comments/descriptions for tables and columns
- [ ] For SQLite/D1: prepared INSERTs for metadata tables
- [ ] Explained reasoning for important design decisions

---

## File Structure

```
.claude/skills/databases/
├── SKILL.md                  # Skill description (entry + execution process + checklist)
├── db-design.md              # This file 
├── transactional.md          # OLTP design rules
├── analytics.md              # OLAP / Star Schema rules
├── incremental-etl.md        # ETL & watermark patterns
└── stacks/
    ├── mysql.md              # MySQL-specific rules
    ├── postgres.md           # PostgreSQL-specific rules
    ├── bigquery.md           # BigQuery-specific rules
    ├── sqlite.md             # SQLite-specific rules
    └── d1_cloudflare.md      # D1 Cloudflare-specific rules
```
