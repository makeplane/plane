---
name: postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
license: MIT
metadata:
  author: supabase
  version: "1.0.0"
allowed-tools:
  - Read
disallowed-tools:
  - WebFetch
  - WebSearch
harness: universal
---

# Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design. Extended (Cluster/Slice-5 merge) with additional Schema Design rules covering extended types, safe DDL evolution, and server configuration tuning.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

For Neon (serverless Postgres) specific connection/branching patterns, see the standalone `neon-postgres` skill instead — this skill covers general Postgres tuning that applies regardless of hosting.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
