# R2 API Reference

## PUT (Upload)

```typescript
// Basic
await env.MY_BUCKET.put(key, value);

// With metadata
await env.MY_BUCKET.put(key, value, {
  httpMetadata: {
    contentType: 'image/jpeg',
    contentDisposition: 'attachment; filename="photo.jpg"',
    cacheControl: 'max-age=3600'
  },
  customMetadata: { userId: '123', version: '2' },
  storageClass: 'Standard', // or 'InfrequentAccess'
  sha256: arrayBufferOrHex, // Integrity check
  ssecKey: arrayBuffer32bytes // SSE-C encryption
});

// Value types: ReadableStream | ArrayBuffer | string | Blob
```

## GET (Download)

```typescript
const object = await env.MY_BUCKET.get(key);
if (!object) return new Response('Not found', { status: 404 });

// Body: arrayBuffer(), text(), json(), blob(), body (ReadableStream)

// Ranged reads
const object = await env.MY_BUCKET.get(key, { range: { offset: 0, length: 1024 } });

// Conditional GET
const object = await env.MY_BUCKET.get(key, { onlyIf: { etagMatches: '"abc123"' } });
```

## HEAD (Metadata Only)

```typescript
const object = await env.MY_BUCKET.head(key); // Returns R2Object without body
```

## DELETE

```typescript
await env.MY_BUCKET.delete(key);
await env.MY_BUCKET.delete([key1, key2, key3]); // Batch (max 1000)
```
## LIST

```typescript
const listed = await env.MY_BUCKET.list({
  limit: 1000,
  prefix: 'photos/',
  cursor: cursorFromPrevious,
  delimiter: '/',
  include: ['httpMetadata', 'customMetadata']
});

// Pagination (always use truncated flag)
while (listed.truncated) {
  const next = await env.MY_BUCKET.list({ cursor: listed.cursor });
  listed.objects.push(...next.objects);
  listed.truncated = next.truncated;
  listed.cursor = next.cursor;
}
```

## Multipart Uploads

```typescript
const multipart = await env.MY_BUCKET.createMultipartUpload(key, {
  httpMetadata: { contentType: 'video/mp4' }
});

const uploadedParts: R2UploadedPart[] = [];
for (let i = 0; i < partCount; i++) {
  const part = await multipart.uploadPart(i + 1, partData);
  uploadedParts.push(part);
}

const object = await multipart.complete(uploadedParts);
// OR: await multipart.abort();

// Resume
const multipart = env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
```

## Presigned URLs (S3 SDK)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }
});

const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: 'my-bucket', Key: key }), { expiresIn: 3600 });
return Response.json({ uploadUrl });
```

## TypeScript Interfaces

```typescript
interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string | Blob, options?: R2PutOptions): Promise<R2Object | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  createMultipartUpload(key: string, options?: R2MultipartOptions): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
}

interface R2Object {
  key: string; version: string; size: number;
  etag: string; httpEtag: string; // httpEtag is quoted, use for headers
  uploaded: Date; httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  storageClass: 'Standard' | 'InfrequentAccess';
  checksums: R2Checksums;
  writeHttpMetadata(headers: Headers): void;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream; bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>; text(): Promise<string>;
  json<T>(): Promise<T>; blob(): Promise<Blob>;
}

interface R2HTTPMetadata {
  contentType?: string; contentDisposition?: string;
  contentEncoding?: string; contentLanguage?: string;
  cacheControl?: string; cacheExpiry?: Date;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata | Headers;
  customMetadata?: Record<string, string>;
  sha256?: ArrayBuffer | string; // Only ONE checksum allowed
  storageClass?: 'Standard' | 'InfrequentAccess';
  ssecKey?: ArrayBuffer;
}

interface R2GetOptions {
  onlyIf?: R2Conditional | Headers;
  range?: R2Range | Headers;
  ssecKey?: ArrayBuffer;
}

interface R2ListOptions {
  limit?: number; prefix?: string; cursor?: string; delimiter?: string;
  startAfter?: string; include?: ('httpMetadata' | 'customMetadata')[];
}

interface R2Objects {
  objects: R2Object[]; truncated: boolean;
  cursor?: string; delimitedPrefixes: string[];
}

interface R2Conditional {
  etagMatches?: string; etagDoesNotMatch?: string;
  uploadedBefore?: Date; uploadedAfter?: Date;
}

interface R2Range { offset?: number; length?: number; suffix?: number; }

interface R2Checksums {
  md5?: ArrayBuffer; sha1?: ArrayBuffer; sha256?: ArrayBuffer;
  sha384?: ArrayBuffer; sha512?: ArrayBuffer;
}

interface R2MultipartUpload {
  key: string;
  uploadId: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | string | Blob): Promise<R2UploadedPart>;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}

interface R2UploadedPart {
  partNumber: number;
  etag: string;
}
```

## CLI Operations

```bash
wrangler r2 object put my-bucket/file.txt --file=./local.txt
wrangler r2 object get my-bucket/file.txt --file=./download.txt
wrangler r2 object delete my-bucket/file.txt
wrangler r2 object list my-bucket --prefix=photos/
```
