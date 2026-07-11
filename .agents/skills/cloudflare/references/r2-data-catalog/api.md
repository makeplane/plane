# R2 Data Catalog API Reference

Two APIs: the **control-plane REST API** (Cloudflare-specific) and the **Iceberg REST catalog API** (standard, used via PyIceberg/PySpark). For PyIceberg method details pull `https://py.iceberg.apache.org/`; for engine configs see `https://developers.cloudflare.com/r2/data-catalog/config-examples/`.

## Control-Plane REST API

Base: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2-catalog/{BUCKET}`
Auth: `Authorization: Bearer $API_TOKEN`

| Operation | Method | Path |
|-----------|--------|------|
| Get catalog details | GET | `/r2-catalog/{bucket}` |
| Enable / disable | POST | `/r2-catalog/{bucket}/enable` · `/disable` |
| Store compaction credential | POST | `/r2-catalog/{bucket}/credential` |
| List namespaces | GET | `/namespaces` |
| List tables | GET | `/namespaces/{ns}/tables` |
| **Get table metadata** | GET | `/namespaces/{ns}/tables/{table}` |
| Get/update maintenance config | GET/POST | `/maintenance-configs` and `/namespaces/{ns}/tables/{table}/maintenance-configs` |

List endpoints accept `?return_uuids=true`, `?return_details=true`, `?parent={ns}`, and pagination. **Nested namespaces use `%1F` (Unit Separator)**, not `/` or `.`: `/namespaces/parent%1Fchild/tables`.

```bash
# Catalog details (status, maintenance_config, credential_status)
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET" \
  -H "Authorization: Bearer $API_TOKEN"

# Store token for compaction (pure-API setups)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/credential" \
  -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"token": "'$API_TOKEN'"}'

# Update maintenance config (all fields optional; table-level overrides catalog-level)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/maintenance-configs" \
  -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"compaction": {"state": "enabled", "target_size_mb": "256"},
       "snapshot_expiration": {"state": "enabled", "min_snapshots_to_keep": 10, "max_snapshot_age": "7d"}}'
```

### Get Table (metadata introspection)

`GET /namespaces/{ns}/tables/{table}` returns schema, partition spec, sort order, and snapshot info — like Iceberg "load table" but on the control plane, with snapshots pruned to the most recent 10. (Newer than the published API docs.)

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/namespaces/live/tables/earthquakes" \
  -H "Authorization: Bearer $API_TOKEN"
```

```json
{"result": {
  "identifier": {"namespace": ["live"], "name": "earthquakes"},
  "table_uuid": "019edccf-3ac8-73e3-...",
  "metadata_location": "s3://live-data/__r2_data_catalog/.../metadata/01225-....metadata.json",
  "total_snapshots": 1225,
  "returned_snapshots": 10,
  "metadata": { /* standard Iceberg TableMetadata: schemas, partition-specs, sort-orders,
                   properties, current-snapshot-id, snapshots (≤10), snapshot-log, refs */ }
}, "success": true}
```

| Field | Description |
|-------|-------------|
| `identifier` | `{namespace: [...], name}` |
| `table_uuid` | Iceberg table UUID |
| `metadata_location` | R2 path to current metadata file |
| `total_snapshots` | Total before pruning |
| `returned_snapshots` | Count in `metadata.snapshots` (max 10) |
| `metadata` | Standard [Iceberg TableMetadata](https://iceberg.apache.org/spec/#table-metadata-fields), arrays pruned to 10 |

### Error Format

```json
{"success": false, "errors": [{"code": 10000, "message": "Authentication error"}]}
```

Standard HTTP codes (401 auth, 403 perms, 404 not enabled/found, 409 conflict).

## Iceberg REST Catalog API (via PyIceberg)

Standard [Iceberg REST Catalog](https://github.com/apache/iceberg/blob/main/open-api/rest-catalog-open-api.yaml). Base: `https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}`. The `/config` route needs `?warehouse={WAREHOUSE}`.

```python
from pyiceberg.catalog.rest import RestCatalog
catalog = RestCatalog(name="r2", warehouse=WAREHOUSE, uri=CATALOG_URI, token=TOKEN)
```

Common operations (see PyIceberg docs for full signatures):

```python
catalog.create_namespace_if_not_exists("logs")
catalog.list_tables("logs")
table = catalog.create_table(("logs", "events"), schema=schema)   # pyiceberg.schema.Schema
table = catalog.load_table(("logs", "events"))
table.append(pyarrow_table)          # also .overwrite(...)
table.scan(row_filter="id > 100").to_pandas()
```

Schema evolution (add nullable columns; widen types only):
```python
with table.update_schema() as u:
    u.add_column("user_id", LongType(), doc="User ID")
    u.rename_column("msg", "message")
```

Time-travel:
```python
table.scan(snapshot_id=table.snapshots()[-2].snapshot_id)
table.scan(as_of_timestamp=ms_epoch)
```

## Manual Maintenance (PySpark)

Prefer automatic maintenance (control-plane API/wrangler). For manual control or very large tables, use Spark procedures (`rewrite_data_files`, `rewrite_manifests`, `expire_snapshots`, `remove_orphan_files`). See `https://developers.cloudflare.com/r2/data-catalog/table-maintenance/`.

```python
spark.sql("CALL r2dc.system.rewrite_data_files(table => 'ns.tbl')")
# Orphan removal REQUIRES S3 credentials (vended creds fail with NoAuthWithAWSException)
spark.sql("CALL r2dc.system.remove_orphan_files(table => 'ns.tbl', older_than => TIMESTAMP '2026-02-28 00:00:00')")
```

## See Also

- [configuration.md](configuration.md) · [patterns.md](patterns.md) · [gotchas.md](gotchas.md)
