# Gotchas & Best Practices

## Fit Modes

| Mode | Best For | Behavior |
|------|----------|----------|
| `cover` | Hero images, thumbnails | Fills space, crops excess |
| `contain` | Product images, artwork | Preserves full image, may add padding |
| `scale-down` | User uploads | Never enlarges |
| `crop` | Precise crops | Uses gravity |
| `pad` | Fixed aspect ratio | Adds background |

## Format Selection

```typescript
format: 'auto' // Recommended - negotiates best format
```

**Support:** AVIF (Chrome 85+, Firefox 93+, Safari 16.4+), WebP (Chrome 23+, Firefox 65+, Safari 14+)

## Quality Settings

| Use Case | Quality |
|----------|---------|
| Thumbnails | 75-80 |
| Standard | 85 (default) |
| High-quality | 90-95 |

## Common Errors

### 5403: "Image transformation failed"
- Verify `width`/`height` ≤ 12000
- Check `quality` 1-100, `dpr` 1-3
- Don't combine incompatible options

### 9413: "Rate limit exceeded"
Implement caching and exponential backoff:
```typescript
for (let i = 0; i < 3; i++) {
  try { return await env.IMAGES.input(buffer).transform({...}).output(); }
  catch { await new Promise(r => setTimeout(r, 2 ** i * 1000)); }
}
```

### 5401: "Image too large"
Pre-process images before upload (max 100MB, 12000×12000px)

### 5400: "Invalid image format"
Supported: JPEG, PNG, GIF, WebP, AVIF, SVG

### 401/403: "Unauthorized"
Verify API token has `Cloudflare Images → Edit` permission

## Limits

| Resource | Limit |
|----------|-------|
| Max input size | 100MB |
| Max dimensions | 12000×12000px |
| Quality range | 1-100 |
| DPR range | 1-3 |
| API rate limit | ~1200 req/min |

## AVIF Gotchas

- **Slower encoding**: First request may have higher latency
- **Browser detection**:
```typescript
const format = /image\/avif/.test(request.headers.get('Accept') || '') ? 'avif' : 'webp';
```

## Anti-Patterns

```typescript
// ❌ No caching - transforms every request
return env.IMAGES.input(buffer).transform({...}).output().response();

// ❌ cover without both dimensions
transform({ width: 800, fit: 'cover' })

// ✅ Always set both for cover
transform({ width: 800, height: 600, fit: 'cover' })

// ❌ Exposes API token to client
// ✅ Use Direct Creator Upload (patterns.md)
```

## Debugging

```typescript
// Check response headers
console.log('Content-Type:', response.headers.get('Content-Type'));

// Test with curl
// curl -I "https://imagedelivery.net/{hash}/{id}/width=800,format=avif"

// Monitor logs
// npx wrangler tail
```
