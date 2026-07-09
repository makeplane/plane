# R2 Data Catalog Gotchas

Common failure modes and operational behavior. For limits, recommendations, and supported settings, pull `https://developers.cloudflare.com/r2/data-catalog/` and `.../table-maintenance/`.

## Connection / Auth

- **Catalog URI / warehouse mismatch (most common).** Copy both values exactly from `wrangler r2 bucket catalog enable` (Catalog URI `https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}`, warehouse `{ACCOUNT_ID}_{BUCKET}`). Mismatched values fail to connect.
- **401 Unauthorized** — token lacks Data Catalog R&W. Test with `catalog.list_namespaces()`.
- **403 on data files** — token lacks R2 Storage. Open beta requires **Admin Read & Write on R2 Storage even for read-only** data access.
- **`/config` "Warehouse name missing in query param"** — the Iceberg `/v1/config` route needs `?warehouse={ACCOUNT_ID}_{BUCKET}`. PyIceberg/PySpark add it automatically when you set `warehouse=`.

## Maintenance Behavior (updated)

- **No throughput cap on compaction.** The former 2 GB/hour/table limit is **lifted** — compaction triggers hourly and processes the backlog with no hard cap. Large small-file backlogs still take multiple hourly cycles.
- **Snapshot expiration deletes data files** (since April 2026), not just metadata. Manual `remove_orphan_files` is rarely needed.
- **Compaction requires a stored credential.** `wrangler ... compaction enable` and the dashboard wizard store it automatically; pure-API setups must POST `/credential`.
- Compaction is **Parquet-only**.

## Tables & Schema

- `TableAlreadyExistsError` / `NamespaceAlreadyExistsError` → use `create_*_if_not_exists` / load existing.
- `422 Validation` on schema update → only add nullable columns and widen types (int→long, float→double).
- `TypeError: Cannot cast` on append → PyArrow type ≠ Iceberg schema; cast to int64 (Iceberg default); check `table.schema()`.

## Concurrency

- `CommitFailedException` → optimistic-locking conflict; retry with backoff (see [patterns.md](patterns.md#concurrent-writes-with-retry-pyiceberg)).
- Stale metadata after external writes → reload: `table = catalog.load_table(("ns","tbl"))`.

## PySpark / Iceberg

| Issue | Fix |
|-------|-----|
| Catalog auth fails | Add header `X-Iceberg-Access-Delegation: vended-credentials` |
| `NoAuthWithAWSException` on orphan removal | Supply S3 access/secret keys (vended creds don't work here) |
| Version mismatch | Use Iceberg `1.6.1` |
| Slow first run (~30–60s) | JAR download; cached after |
| Remote signing errors | Set `s3.remote-signing-enabled=false` |

## Nested Namespaces

Control-plane URL separator for nested namespaces is **`%1F`** (Unit Separator), not `/` or `.`: `/namespaces/parent%1Fchild/tables`.

## Debug Checklist

1. `npx wrangler r2 bucket catalog status <bucket>` — enabled?
2. Token has R2 Storage (Admin R&W) + R2 Data Catalog (R&W)?
3. `catalog.list_namespaces()` succeeds?
4. Catalog URI = `catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}`, warehouse = `{ACCOUNT_ID}_{BUCKET}`?
5. Namespace created before `create_table`?
6. Compaction enabled + `credential_status: present`?

## See Also

- [configuration.md](configuration.md) · [api.md](api.md) · [patterns.md](patterns.md)
