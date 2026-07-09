# AI Gateway Troubleshooting

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 | Missing `cf-aig-authorization` header | Add header with CF API token |
| 403 | Invalid provider key / BYOK expired | Check provider key in dashboard |
| 429 | Rate limit exceeded | Increase limit or implement backoff |

### 401 Fix

```typescript
const client = new OpenAI({
  baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
  defaultHeaders: { 'cf-aig-authorization': `Bearer ${CF_API_TOKEN}` }
});
```

### 429 Retry Pattern

```typescript
async function requestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (e.status === 429 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      throw e;
    }
  }
}
```

## Gotchas

| Issue | Reality |
|-------|---------|
| Metadata limits | Max 5 entries, flat only (no nesting) |
| Cache key collision | Use unique keys per expected response |
| BYOK + Unified Billing | Mutually exclusive |
| Rate limit scope | Per-gateway, not per-user (use dynamic routing for per-user) |
| Log delay | 30-60 seconds normal |
| Streaming + caching | **Incompatible** |
| Model name (unified API) | Prefix required: `openai/gpt-4o`, not `gpt-4o` |

## Cache Not Working

**Causes:**
- Different request params (temperature, etc.)
- Streaming enabled
- Caching disabled in settings

**Check:** `response.headers.get('cf-aig-cache-status')` → HIT or MISS

## Logs Not Appearing

1. Check logging enabled: Dashboard → Gateway → Settings
2. Remove `cf-aig-collect-log: false` header
3. Wait 30-60 seconds
4. Check log limit (10M default)

## Debugging

```bash
# Test connectivity
curl -v https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/openai/models \
  -H "Authorization: Bearer $OPENAI_KEY" \
  -H "cf-aig-authorization: Bearer $CF_TOKEN"
```

```typescript
// Check response headers
console.log('Cache:', response.headers.get('cf-aig-cache-status'));
console.log('Request ID:', response.headers.get('cf-ray'));
```

## Analytics

Dashboard → AI Gateway → Select gateway

**Metrics:** Requests, tokens, latency (p50/p95/p99), cache hit rate, costs

**Log filters:** `status: error`, `provider: openai`, `cost > 0.01`, `duration > 1000`

**Export:** Logpush to S3/GCS/Datadog/Splunk
