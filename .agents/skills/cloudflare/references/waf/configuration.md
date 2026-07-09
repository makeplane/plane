# Configuration

## Prerequisites

**API Token**: Create at https://dash.cloudflare.com/profile/api-tokens
- Permission: `Zone.WAF Edit` or `Zone.Firewall Services Edit`
- Zone Resources: Include specific zones or all zones

**Zone ID**: Found in dashboard > Overview > API section (right sidebar)

```bash
# Set environment variables
export CF_API_TOKEN="your_api_token_here"
export ZONE_ID="your_zone_id_here"
```

## TypeScript SDK Usage

```bash
npm install cloudflare
```

```typescript
import Cloudflare from 'cloudflare';

const client = new Cloudflare({ apiToken: process.env.CF_API_TOKEN });

// Custom rules
await client.rulesets.create({
  zone_id: process.env.ZONE_ID,
  kind: 'zone',
  phase: 'http_request_firewall_custom',
  name: 'Custom WAF',
  rules: [
    { action: 'block', expression: 'cf.waf.score gt 50', enabled: true },
    { action: 'challenge', expression: 'http.request.uri.path eq "/admin"', enabled: true },
  ],
});

// Managed ruleset
await client.rulesets.create({
  zone_id: process.env.ZONE_ID,
  phase: 'http_request_firewall_managed',
  rules: [{
    action: 'execute',
    action_parameters: { id: 'efb7b8c949ac4650a09736fc376e9aee' },
    expression: 'true',
  }],
});

// Rate limiting
await client.rulesets.create({
  zone_id: process.env.ZONE_ID,
  phase: 'http_ratelimit',
  rules: [{
    action: 'block',
    expression: 'http.request.uri.path starts_with "/api"',
    action_parameters: {
      ratelimit: {
        characteristics: ['cf.colo.id', 'ip.src'],
        period: 60,
        requests_per_period: 100,
        mitigation_timeout: 600,
      },
    },
  }],
});
```

## Terraform Configuration

```hcl
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_ruleset" "waf_custom" {
  zone_id = var.zone_id
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action     = "block"
    expression = "cf.waf.score gt 50"
  }
}
```

**Managed Ruleset & Rate Limiting**:
```hcl
resource "cloudflare_ruleset" "waf_managed" {
  zone_id = var.zone_id
  name    = "Managed Ruleset"
  kind    = "zone"
  phase   = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee"
      overrides {
        rules {
          id = "5de7edfa648c4d6891dc3e7f84534ffa"
          action = "log"
        }
      }
    }
    expression = "true"
  }
}

resource "cloudflare_ruleset" "rate_limiting" {
  zone_id = var.zone_id
  phase   = "http_ratelimit"

  rules {
    action = "block"
    expression = "http.request.uri.path starts_with \"/api\""
    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 100
      mitigation_timeout  = 600
    }
  }
}
```

## Pulumi Configuration

```typescript
import * as cloudflare from '@pulumi/cloudflare';

const zoneId = 'zone_id';

// Custom rules
const wafCustom = new cloudflare.Ruleset('waf-custom', {
  zoneId,
  phase: 'http_request_firewall_custom',
  rules: [
    { action: 'block', expression: 'cf.waf.score gt 50', enabled: true },
    { action: 'challenge', expression: 'http.request.uri.path eq "/admin"', enabled: true },
  ],
});

// Managed ruleset
const wafManaged = new cloudflare.Ruleset('waf-managed', {
  zoneId,
  phase: 'http_request_firewall_managed',
  rules: [{
    action: 'execute',
    actionParameters: { id: 'efb7b8c949ac4650a09736fc376e9aee' },
    expression: 'true',
  }],
});

// Rate limiting
const rateLimiting = new cloudflare.Ruleset('rate-limiting', {
  zoneId,
  phase: 'http_ratelimit',
  rules: [{
    action: 'block',
    expression: 'http.request.uri.path starts_with "/api"',
    ratelimit: {
      characteristics: ['cf.colo.id', 'ip.src'],
      period: 60,
      requestsPerPeriod: 100,
      mitigationTimeout: 600,
    },
  }],
});
```

## Dashboard Configuration

1. Navigate to: **Security** > **WAF**
2. Select tab:
   - **Managed rules** - Deploy/configure managed rulesets
   - **Custom rules** - Create custom rules
   - **Rate limiting rules** - Configure rate limits
3. Click **Deploy** or **Create rule**

**Testing**: Use Security Events to test expressions before deploying.

## Wrangler Integration

WAF configuration is zone-level (not Worker-specific). Configuration methods:
- Dashboard UI
- Cloudflare API via SDK
- Terraform/Pulumi (IaC)

**Workers benefit from WAF automatically** - no Worker code changes needed.

**Example: Query WAF API from Worker**:
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return fetch(`https://api.cloudflare.com/client/v4/zones/${env.ZONE_ID}/rulesets`, {
      headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
    });
  },
};
```