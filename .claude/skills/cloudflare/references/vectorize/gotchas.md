# Vectorize Gotchas

## Critical Warnings

### Async Mutations
Insert/upsert/delete return immediately but vectors aren't queryable for 5-10 seconds.

### Batch Size Limit
**Workers API: 1,000 vectors max per call (HTTP API: 5,000).** Silently truncates if exceeded.

```typescript
// ✅ Chunk into 1000 (Workers API limit; HTTP API allows 5000)
for (let i = 0; i < vectors.length; i += 1000) {
  await env.VECTORIZE.upsert(vectors.slice(i, i + 1000));
}
```

### Metadata Truncation
`returnMetadata: "indexed"` returns only first 64 bytes of strings. Use `"all"` for complete metadata (but max topK drops to 20).

### topK Limits

| returnMetadata | returnValues | Max topK |
|----------------|--------------|----------|
| `"none"` / `"indexed"` | `false` | 100 |
| `"all"` | any | **20** |
| any | `true` | **20** |

### Metadata Indexes First
Create BEFORE inserting - existing vectors not retroactively indexed.

```bash
# ✅ Create index FIRST
wrangler vectorize create-metadata-index my-index --property-name=category --type=string
wrangler vectorize insert my-index --file=data.ndjson
```

### Index Config Immutable
Cannot change dimensions/metric after creation. Must create new index and migrate.

## Limits (V2)

| Resource | Limit |
|----------|-------|
| Vectors per index | 10,000,000 |
| Max dimensions | 1536 |
| Batch upsert (Workers / HTTP API) | **1,000 / 5,000** |
| Indexed string metadata | **64 bytes** |
| Metadata indexes | 10 |
| Namespaces | 50,000 (paid) / 1,000 (free) |

## Common Mistakes

1. **Wrong embedding shape:** Extract `result.data[0]` from Workers AI
2. **Metadata index after data:** Re-upsert all vectors
3. **Insert vs upsert:** `insert` ignores duplicates, `upsert` overwrites
4. **Not batching:** Individual inserts ~1K/min, batched ~200K+/min

## Troubleshooting

**No results?**
- Wait 5-10s after insert
- Check namespace spelling (case-sensitive)
- Verify metadata index exists
- Check dimension mismatch

**Metadata filter not working?**
- Index must exist before data insert
- Strings >64 bytes truncated
- Use dot notation for nested: `"product.category"`

## Model Dimensions

- `@cf/baai/bge-small-en-v1.5`: 384
- `@cf/baai/bge-base-en-v1.5`: 768
- `@cf/baai/bge-large-en-v1.5`: 1024
