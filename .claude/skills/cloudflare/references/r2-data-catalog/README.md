# Cloudflare R2 Data Catalog

Managed Apache Iceberg REST catalog built into R2 buckets. No catalog servers to run.

## Documentation

This reference is a fast-start with verified connection details and code. For limits, maintenance settings, engine config examples, and pricing, **retrieve the live docs** — use the `cloudflare-docs` MCP/search tool if available, otherwise `webfetch` the URL. Docs are source of truth over this file.

| Topic | URL |
|-------|-----|
| Overview / get started | `https://developers.cloudflare.com/r2/data-catalog/get-started/` |
| Manage catalogs (enable, tokens) | `https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/` |
| Engine config examples | `https://developers.cloudflare.com/r2/data-catalog/config-examples/` (`pyiceberg/`, `spark-python/`, `spark-scala/`, `duckdb/`, `snowflake/`, `trino/`, `starrocks/`) |
| Table maintenance (compaction, snapshots) | `https://developers.cloudflare.com/r2/data-catalog/table-maintenance/` |
| Deleting data | `https://developers.cloudflare.com/r2/data-catalog/deleting-data/` |
| Metrics (GraphQL) | `https://developers.cloudflare.com/r2/data-catalog/observability/metrics/` |
| Pricing | `https://developers.cloudflare.com/r2/data-catalog/platform/pricing/` |
| Iceberg spec | `https://iceberg.apache.org/spec/` |

## Connection Values

Use the exact **Catalog URI** and **Warehouse** printed by `npx wrangler r2 bucket catalog enable <bucket>` (also shown in the dashboard). They follow these formats:

| Value | Format | Example |
|-------|--------|---------|
| Catalog URI | `https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}` | `https://catalog.cloudflarestorage.com/4482a1.../live-data` |
| Warehouse | `{ACCOUNT_ID}_{BUCKET}` (hyphens preserved) | `4482a1..._live-data` |
| Token | R2 API token (Admin R&W on Storage + R&W on Data Catalog) | `cfut_...` |

The Iceberg `/config` route needs `?warehouse={WAREHOUSE}`.

## Architecture

```
Engines (PyIceberg, PySpark, Trino, Snowflake, DuckDB, R2 SQL)
   │  Iceberg REST API (Bearer token)
   ▼
R2 Data Catalog  ── namespace/table metadata, snapshots, txn coordination
   │  vended S3 credentials
   ▼
R2 Bucket  ── Parquet data files + Iceberg metadata
```

- **Warehouse** — top-level catalog grouping (`{ACCOUNT_ID}_{BUCKET}`)
- **Namespace** — schema/database; nested namespaces supported
- **Table** — Iceberg table (schema, partition spec, snapshots)
- **Vended credentials** — temp S3 creds the catalog hands engines (`X-Iceberg-Access-Delegation: vended-credentials`)

## When to Use

**Use for:** log/analytics data lakes, BI pipelines, time-series/event data, multi-cloud or multi-engine analytics needing ACID + schema evolution on object storage.

**Don't use for:** OLTP (use D1/a database), sub-second point lookups, tiny datasets (<1 GB), or unstructured blobs (store directly in R2).

## Two APIs — Don't Confuse Them

| API | Base | Use for |
|-----|------|---------|
| **Iceberg REST catalog** | `https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}` | Table reads/writes via PyIceberg, PySpark, Trino, etc. |
| **Control-plane REST API** | `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2-catalog/{BUCKET}` | Enable/disable, maintenance config, list namespaces/tables, get-table |

**Status:** Open beta. Available to all R2 subscribers; verify pricing/billing status in docs.

## Reading Order

1. [configuration.md](configuration.md) — enable catalog, tokens, maintenance, client connection
2. [api.md](api.md) — control-plane REST (incl. get-table), PyIceberg client, maintenance
3. [patterns.md](patterns.md) — PyIceberg + PySpark templates, partitioning, external engines
4. [gotchas.md](gotchas.md) — auth errors, maintenance behavior, troubleshooting

## See Also

- [pipelines](../pipelines/) — stream events into Iceberg tables
- [r2-sql](../r2-sql/) — serverless SQL over these tables
- [r2](../r2/) — underlying object storage
