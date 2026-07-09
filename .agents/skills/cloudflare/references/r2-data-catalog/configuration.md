# R2 Data Catalog Configuration

Enable the catalog, create tokens, turn on automatic maintenance, connect clients. For exhaustive token/permission options and maintenance settings, pull `https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/` and `.../table-maintenance/`.

## Step 1: Create Bucket + Enable Catalog

```bash
npx wrangler r2 bucket create my-bucket
npx wrangler r2 bucket catalog enable my-bucket
```

`enable` outputs the two values used everywhere:

```
Warehouse:   4482a1cd43bf5197657ae1d8636c414a_my-bucket   # {ACCOUNT_ID}_{BUCKET}
Catalog URI: https://catalog.cloudflarestorage.com/4482a1cd43bf5197657ae1d8636c414a/my-bucket
```

Enabling creates `__r2_data_catalog/` metadata in the bucket; existing objects are untouched.

## Step 2: Create an API Token

Dashboard → **R2** → **Manage R2 API tokens** → **Create API token**.

**Simplest:** one token with **R2 Storage Admin Read & Write** + **R2 Data Catalog Read & Write**, scoped to your bucket(s). Add **R2 SQL Read** if you also query. This token works for the Iceberg REST API, control-plane API, R2 SQL, and GraphQL Analytics. Token creation also yields S3 Access Key ID / Secret (needed only for Spark orphan-file removal).

> Open-beta limitation: R2 Storage **Admin Write is required even for read-only data access**. See the manage-catalogs doc for the current permission matrix.

## Step 3: Enable Automatic Maintenance (Recommended)

R2 Data Catalog runs compaction and snapshot expiration for you.

```bash
# Compaction — merges small files (target size MB; default 128)
npx wrangler r2 bucket catalog compaction enable my-bucket \
  --target-size 128 --token $API_TOKEN

# Snapshot expiration — removes old snapshots AND their unreferenced data files
npx wrangler r2 bucket catalog snapshot-expiration enable my-bucket \
  --token $API_TOKEN --older-than-days 7 --retain-last 10
```

Compaction needs a **stored credential** to access files. `compaction enable` (and the dashboard wizard) stores it automatically; pure-API setups must call `/credential` (see [api.md](api.md)).

> Compaction triggers **hourly** with **no hard throughput cap** (the former 2 GB/hour limit was lifted). Snapshot expiration deletes unreferenced data files automatically (since April 2026) — manual orphan cleanup is rarely needed. For target-size guidance per workload, see the table-maintenance doc.

## Step 4: Verify

```bash
npx wrangler r2 bucket catalog status my-bucket
# or control-plane API:
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET" \
  -H "Authorization: Bearer $API_TOKEN"
```

Expect `"status": "active"`, `compaction.state: "enabled"`, `credential_status: "present"`.

## Client Connection

### PyIceberg

```python
import os
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="r2_catalog",
    warehouse=os.environ["R2_WAREHOUSE"],   # {ACCOUNT_ID}_{BUCKET}
    uri=os.environ["R2_CATALOG_URI"],       # https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}
    token=os.environ["R2_TOKEN"],
)
print(catalog.list_namespaces())            # connection test
```

### PySpark / DuckDB / Trino / Snowflake

Full, current engine configs live at `https://developers.cloudflare.com/r2/data-catalog/config-examples/`. A verified PySpark session template is in [patterns.md](patterns.md#pyspark-session) (needs Iceberg 1.6.1 and `X-Iceberg-Access-Delegation: vended-credentials`).

## Environment Variables Pattern

```bash
# .env (never commit)
R2_CATALOG_URI=https://catalog.cloudflarestorage.com/<ACCOUNT_ID>/<BUCKET>
R2_WAREHOUSE=<ACCOUNT_ID>_<BUCKET>
R2_TOKEN=<api-token>
```

## Disable Catalog

```bash
npx wrangler r2 bucket catalog disable my-bucket
```

Preserves data and metadata; tables become inaccessible via the catalog until re-enabled.

## See Also

- [api.md](api.md) — control-plane + PyIceberg API · [gotchas.md](gotchas.md) — auth & maintenance troubleshooting
