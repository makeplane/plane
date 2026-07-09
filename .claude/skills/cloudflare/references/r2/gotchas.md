# R2 Gotchas & Troubleshooting

## List Truncation

```typescript
// ❌ WRONG: Don't compare object count when using include
while (listed.objects.length < options.limit) { ... }

// ✅ CORRECT: Always use truncated property
while (listed.truncated) {
  const next = await env.MY_BUCKET.list({ cursor: listed.cursor });
  // ...
}
```

**Reason:** `include` with metadata may return fewer objects per page to fit metadata.

## ETag Format

```typescript
// ❌ WRONG: Using etag (unquoted) in headers
headers.set('etag', object.etag); // Missing quotes

// ✅ CORRECT: Use httpEtag (quoted)
headers.set('etag', object.httpEtag);
```

## Checksum Limits

Only ONE checksum algorithm allowed per PUT:

```typescript
// ❌ WRONG: Multiple checksums
await env.MY_BUCKET.put(key, data, { md5: hash1, sha256: hash2 }); // Error

// ✅ CORRECT: Pick one
await env.MY_BUCKET.put(key, data, { sha256: hash });
```

## Multipart Requirements

- All parts must be uniform size (except last part)
- Part numbers start at 1 (not 0)
- Uncompleted uploads auto-abort after 7 days
- `resumeMultipartUpload` doesn't validate uploadId existence

## Conditional Operations

```typescript
// Precondition failure returns object WITHOUT body
const object = await env.MY_BUCKET.get(key, {
  onlyIf: { etagMatches: '"wrong"' }
});

// Check for body, not just null
if (!object) return new Response('Not found', { status: 404 });
if (!object.body) return new Response(null, { status: 304 }); // Precondition failed
```

## Key Validation

```typescript
// ❌ DANGEROUS: Path traversal
const key = url.pathname.slice(1); // Could be ../../../etc/passwd
await env.MY_BUCKET.get(key);

// ✅ SAFE: Validate keys
if (!key || key.includes('..') || key.startsWith('/')) {
  return new Response('Invalid key', { status: 400 });
}
```

## Storage Class Pitfalls

- InfrequentAccess: 30-day minimum billing (even if deleted early)
- Can't transition IA → Standard via lifecycle (use S3 CopyObject)
- Retrieval fees apply for IA reads

## Stream Length Requirement

```typescript
// ❌ WRONG: Streaming unknown length fails silently
const response = await fetch(url);
await env.MY_BUCKET.put(key, response.body); // May fail without error

// ✅ CORRECT: Buffer or use Content-Length
const data = await response.arrayBuffer();
await env.MY_BUCKET.put(key, data);

// OR: Pass Content-Length if known
const object = await env.MY_BUCKET.put(key, request.body, {
  httpMetadata: {
    contentLength: parseInt(request.headers.get('content-length') || '0')
  }
});
```

**Reason:** R2 requires known length for streams. Unknown length may cause silent truncation.

## S3 SDK Region Configuration

```typescript
// ❌ WRONG: Missing region breaks ALL S3 SDK calls
const s3 = new S3Client({
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { ... }
});

// ✅ CORRECT: MUST set region='auto'
const s3 = new S3Client({
  region: 'auto', // REQUIRED
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { ... }
});
```

**Reason:** S3 SDK requires region. R2 uses 'auto' as placeholder.

## Local Development Limits

```typescript
// ❌ Miniflare/wrangler dev: Limited R2 support
// - No multipart uploads
// - No presigned URLs (requires S3 SDK + network)
// - Memory-backed storage (lost on restart)

// ✅ Use remote bindings for full features
wrangler dev --remote

// OR: Conditional logic
if (env.ENVIRONMENT === 'development') {
  // Fallback for local dev
} else {
  // Full R2 features
}
```

## Presigned URL Expiry

```typescript
// ❌ WRONG: URL expires but no client validation
const url = await getSignedUrl(s3, command, { expiresIn: 60 });
// 61 seconds later: 403 Forbidden

// ✅ CORRECT: Return expiry to client
return Response.json({
  uploadUrl: url,
  expiresAt: new Date(Date.now() + 60000).toISOString()
});
```

## Limits

| Limit | Value |
|-------|-------|
| Object size | 5 TB |
| Multipart part count | 10,000 |
| Multipart part min size | 5 MB (except last) |
| Batch delete | 1,000 keys |
| List limit | 1,000 per request |
| Key size | 1024 bytes |
| Custom metadata | 2 KB per object |
| Presigned URL max expiry | 7 days |

## Common Errors

### "Stream upload failed" / Silent Truncation

**Cause:** Stream length unknown or Content-Length missing  
**Solution:** Buffer data or pass explicit Content-Length

### "Invalid credentials" / S3 SDK

**Cause:** Missing `region: 'auto'` in S3Client config  
**Solution:** Always set `region: 'auto'` for R2

### "Object not found"

**Cause:** Object key doesn't exist or was deleted  
**Solution:** Verify object key correct, check if object was deleted, ensure bucket correct

### "List compatibility error"

**Cause:** Missing or old compatibility_date, or flag not enabled  
**Solution:** Set `compatibility_date >= 2022-08-04` or enable `r2_list_honor_include` flag

### "Multipart upload failed"

**Cause:** Part sizes not uniform or incorrect part number  
**Solution:** Ensure uniform size except final part, verify part numbers start at 1
