# Cloudflare R2 Storage

S3-compatible object storage with zero egress fees.

## Quick Start

### Create Bucket
```bash
wrangler r2 bucket create my-bucket
wrangler r2 bucket create my-bucket --location=wnam
```

Locations: `wnam`, `enam`, `weur`, `eeur`, `apac`

### Upload Object
```bash
wrangler r2 object put my-bucket/file.txt --file=./local-file.txt
```

### Workers Binding

**wrangler.toml:**
```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```

**Worker:**
```typescript
// Put
await env.MY_BUCKET.put('user-uploads/photo.jpg', imageData, {
  httpMetadata: {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000'
  },
  customMetadata: {
    uploadedBy: userId,
    uploadDate: new Date().toISOString()
  }
});

// Get
const object = await env.MY_BUCKET.get('large-file.mp4');
if (!object) {
  return new Response('Not found', { status: 404 });
}

return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata.contentType,
    'ETag': object.etag
  }
});

// List
const listed = await env.MY_BUCKET.list({
  prefix: 'user-uploads/',
  limit: 100
});

// Delete
await env.MY_BUCKET.delete('old-file.txt');

// Head (check existence)
const object = await env.MY_BUCKET.head('file.txt');
if (object) {
  console.log('Size:', object.size);
}
```

## S3 API Integration

### AWS CLI
```bash
# Configure
aws configure
# Access Key ID: <your-key-id>
# Secret Access Key: <your-secret>
# Region: auto

# Operations
aws s3api list-buckets --endpoint-url https://<accountid>.r2.cloudflarestorage.com

aws s3 cp file.txt s3://my-bucket/ --endpoint-url https://<accountid>.r2.cloudflarestorage.com

# Presigned URL
aws s3 presign s3://my-bucket/file.txt --endpoint-url https://<accountid>.r2.cloudflarestorage.com --expires-in 3600
```

### JavaScript (AWS SDK v3)
```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "file.txt",
  Body: fileContents
}));
```

### Python (Boto3)
```python
import boto3

s3 = boto3.client(
    service_name='s3',
    endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
    aws_access_key_id=access_key_id,
    aws_secret_access_key=secret_access_key,
    region_name='auto'
)

s3.upload_fileobj(file_obj, 'my-bucket', 'file.txt')
s3.download_file('my-bucket', 'file.txt', './local-file.txt')
```

## Multipart Uploads

For files >100MB:

```typescript
const multipart = await env.MY_BUCKET.createMultipartUpload('large-file.mp4');

// Upload parts (5MiB - 5GiB each, max 10,000 parts)
const part1 = await multipart.uploadPart(1, chunk1);
const part2 = await multipart.uploadPart(2, chunk2);

// Complete
const object = await multipart.complete([part1, part2]);
```

### Rclone (Large Files)
```bash
rclone config  # Configure Cloudflare R2

# Upload with optimization
rclone copy large-video.mp4 r2:my-bucket/ \
  --s3-upload-cutoff=100M \
  --s3-chunk-size=100M
```

## Public Buckets

### Enable Public Access
1. Dashboard → R2 → Bucket → Settings → Public Access
2. Add custom domain (recommended) or use r2.dev

**r2.dev (rate-limited):**
```
https://pub-<hash>.r2.dev/file.txt
```

**Custom domain (production):**
Cloudflare handles DNS/TLS automatically

## CORS Configuration

```bash
wrangler r2 bucket cors put my-bucket --rules '[
  {
    "AllowedOrigins": ["https://example.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]'
```

## Lifecycle Rules

```bash
wrangler r2 bucket lifecycle put my-bucket --rules '[
  {
    "action": {"type": "AbortIncompleteMultipartUpload"},
    "filter": {},
    "abortIncompleteMultipartUploadDays": 7
  },
  {
    "action": {"type": "Transition", "storageClass": "InfrequentAccess"},
    "filter": {"prefix": "archives/"},
    "daysFromCreation": 90
  }
]'
```

## Event Notifications

```bash
wrangler r2 bucket notification create my-bucket \
  --queue=my-queue \
  --event-type=object-create
```

Supported events: `object-create`, `object-delete`

## Data Migration

### Sippy (Incremental)
```bash
wrangler r2 bucket sippy enable my-bucket \
  --provider=aws \
  --bucket=source-bucket \
  --region=us-east-1 \
  --access-key-id=$AWS_KEY \
  --secret-access-key=$AWS_SECRET
```

Objects migrate on first request.

### Super Slurper (Bulk)
Use dashboard for one-time complete migration from AWS, GCS, Azure.

## Best Practices

### Performance
- Use Cloudflare Cache with custom domains
- Multipart uploads for files >100MB
- Rclone for batch operations
- Location hints match user geography

### Security
- Never commit Access Keys
- Use environment variables
- Bucket-scoped tokens for least privilege
- Presigned URLs for temporary access
- Enable Cloudflare Access for protection

### Cost Optimization
- Infrequent Access storage for archives (30+ days)
- Lifecycle rules to auto-transition/delete
- Larger multipart chunks = fewer Class A operations
- Monitor usage via dashboard

### Naming
- Bucket names: lowercase, hyphens, 3-63 chars
- Avoid sequential prefixes (use hashed for performance)
- No dots in bucket names if using custom domains with TLS

## Limits

- Buckets per account: 1,000
- Object size: 5TB max
- Lifecycle rules: 1,000 per bucket
- Event notification rules: 100 per bucket
- r2.dev rate limit: 1,000 req/min (use custom domains)

## Troubleshooting

**401 Unauthorized:**
- Verify Access Keys
- Check endpoint URL includes account ID
- Ensure region is "auto"

**403 Forbidden:**
- Check bucket permissions
- Verify CORS configuration
- Confirm bucket exists

**Presigned URLs not working:**
- Verify CORS configuration
- Check URL expiry time
- Ensure origin matches CORS rules

## Resources

- Docs: https://developers.cloudflare.com/r2/
- Wrangler: https://developers.cloudflare.com/r2/reference/wrangler-commands/
- S3 Compatibility: https://developers.cloudflare.com/r2/api/s3/api/
- Workers API: https://developers.cloudflare.com/r2/api/workers/
