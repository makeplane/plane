# Configuration & Setup

## Creating a Gateway

### Dashboard
AI > AI Gateway > Create Gateway > Configure (auth, caching, rate limiting, logging)

### API
```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai-gateway/gateways \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"id":"my-gateway","cache_ttl":3600,"rate_limiting_interval":60,"rate_limiting_limit":100,"collect_logs":true}'
```

**Naming:** lowercase alphanumeric + hyphens (e.g., `prod-api`, `dev-chat`)

## Wrangler Integration

```toml
[ai]
binding = "AI"

[[ai.gateway]]
id = "my-gateway"
```

```bash
wrangler secret put CF_API_TOKEN
wrangler secret put OPENAI_API_KEY  # If not using BYOK
```

## Authentication

### Gateway Auth (protects gateway access)
```typescript
const client = new OpenAI({
  baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
  defaultHeaders: { 'cf-aig-authorization': `Bearer ${cfToken}` }
});
```

### Provider Auth Options

**1. Unified Billing (keyless)** - pay through Cloudflare, no provider key:
```typescript
const client = new OpenAI({
  baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
  defaultHeaders: { 'cf-aig-authorization': `Bearer ${cfToken}` }
});
```
Supports: OpenAI, Anthropic, Google AI Studio

**2. BYOK** - store keys in dashboard (Provider Keys > Add), no key in code

**3. Request Headers** - pass provider key per request:
```typescript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
  defaultHeaders: { 'cf-aig-authorization': `Bearer ${cfToken}` }
});
```

## API Token Permissions

- **Gateway management:** AI Gateway - Read + Edit
- **Gateway access:** AI Gateway - Read (minimum)

## Gateway Management API

```bash
# List
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/ai-gateway/gateways \
  -H "Authorization: Bearer $CF_API_TOKEN"

# Get
curl .../gateways/{gateway_id}

# Update
curl -X PUT .../gateways/{gateway_id} \
  -d '{"cache_ttl":7200,"rate_limiting_limit":200}'

# Delete
curl -X DELETE .../gateways/{gateway_id}
```

## Getting IDs

- **Account ID:** Dashboard > Overview > Copy
- **Gateway ID:** AI Gateway > Gateway name column

## Python Example

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=f"https://gateway.ai.cloudflare.com/v1/{os.environ['CF_ACCOUNT_ID']}/{os.environ['GATEWAY_ID']}/openai",
    default_headers={"cf-aig-authorization": f"Bearer {os.environ['CF_API_TOKEN']}"}
)
```

## Best Practices

1. **Always authenticate gateways in production**
2. **Use BYOK or unified billing** - secrets out of code
3. **Environment-specific gateways** - separate dev/staging/prod
4. **Set rate limits** - prevent runaway costs
5. **Enable logging** - track usage, debug issues
